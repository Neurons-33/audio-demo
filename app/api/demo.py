from __future__ import annotations
from datetime import date

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from jinja2 import Environment, FileSystemLoader

import subprocess
import json
import tempfile
import os

from app.services.transcription_service import transcribe_audio_bytes
from app.services.subtitle_builder import build_segments_from_deepgram
from app.services.audio_preprocess import convert_to_wav_bytes

from app.services.demo_limit_service import check_limits, record_usage, IP_LIMIT
from app.services.supabase_storage_service import get_supabase_client
from app.services.transcript_service import save_transcript


router = APIRouter()

templates = Jinja2Templates(
    env=Environment(loader=FileSystemLoader("templates"))
)



# =========================
# 🔥 user system（匿名多使用者）
# =========================
def get_user_id(request: Request) -> str:
    return request.headers.get("x-user-id") or "anonymous"


# =========================
# 支援格式
# =========================
ALLOWED_AUDIO_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
    "audio/webm",
    "video/mp4",
    "application/octet-stream",
}


# =========================
# 音檔長度
# =========================
def get_audio_duration_seconds(file_path: str) -> float:
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "json",
        file_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    data = json.loads(result.stdout)
    return float(data["format"]["duration"])


# =========================
# 頁面
# =========================
@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(
        request,
        "index.html",
        {"request": request}
    )


# =========================
# usage
# =========================
@router.get("/api/usage")
async def get_usage(request: Request):
    user = get_user_id(request)
    today = date.today().isoformat()

    try:
        supabase = get_supabase_client()

        res = supabase.table("demo_ip_usage") \
            .select("minutes_used") \
            .eq("date", today) \
            .eq("ip", user) \
            .execute()

        used = 0
        if res.data:
            used = res.data[0]["minutes_used"]

    except Exception as e:
        print("⚠️ usage fetch failed:", e)
        used = 0

    return {
        "user": user,
        "used": used,
        "remaining": max(0, IP_LIMIT - used)
    }


# =========================
# history
# =========================
@router.get("/api/history")
async def get_history(request: Request):
    user = get_user_id(request)

    try:
        supabase = get_supabase_client()

        res = supabase.table("transcripts") \
            .select("*") \
            .eq("ip", user) \
            .order("created_at", desc=True) \
            .limit(20) \
            .execute()

        return {
            "count": len(res.data),
            "data": res.data
        }

    except Exception as e:
        print("⚠️ history fetch failed:", e)
        return {"count": 0, "data": []}


# =========================
# upload
# =========================
@router.post("/api/upload")
async def upload_audio(request: Request, file: UploadFile = File(...)):
    user = get_user_id(request)

    if not file.filename:
        raise HTTPException(status_code=400, detail="缺少檔名")

    if file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(status_code=400, detail=f"不支援的檔案類型: {file.content_type}")

    audio_bytes = await file.read()

    try:
        wav_bytes = convert_to_wav_bytes(audio_bytes)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(wav_bytes)
            tmp_path = tmp.name

        duration_seconds = get_audio_duration_seconds(tmp_path)
        duration_minutes = int(duration_seconds / 60) + 1

        # 1. 檢查限制
        await check_limits(user, duration_minutes)

        # 2. 轉錄處理
        dg_result = await transcribe_audio_bytes(
            audio_bytes=wav_bytes,
            mimetype="audio/wav",
            filename=file.filename,
        )
        segments = build_segments_from_deepgram(dg_result)

        # 3. 儲存紀錄與更新使用量
        await save_transcript(user, duration_minutes, segments)
        await record_usage(user, duration_minutes)

        # 4. 獲取最新使用量資訊回傳給前端更新 UI
        today = date.today().isoformat()
        supabase = get_supabase_client()
        res = supabase.table("demo_ip_usage").select("minutes_used").eq("date", today).eq("ip", user).execute()
        used = res.data[0]["minutes_used"] if res.data else 0

        return {
            "filename": file.filename,
            "segments": segments,
            "usage": {
                "used": used,
                "remaining": max(0, IP_LIMIT - used)
            }
        }

    except Exception as exc:
        raise HTTPException(500, f"轉錄失敗: {str(exc)}")
    finally:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)