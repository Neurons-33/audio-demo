from datetime import date

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, Depends, Header
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from jinja2 import Environment, FileSystemLoader

import subprocess
import json
import tempfile
import os

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services.transcription_service import transcribe_audio_bytes
from app.services.subtitle_builder import build_segments_from_deepgram
from app.services.audio_preprocess import convert_to_wav_bytes

from app.services.demo_limit_service import check_and_reserve, record_usage_log, IP_LIMIT
from app.services.supabase_storage_service import get_supabase_client
from app.services.transcript_service import save_transcript


# =========================
# 基礎設定
# =========================

router = APIRouter()

templates = Jinja2Templates(
    env=Environment(loader=FileSystemLoader("templates"))
)

limiter = Limiter(key_func=get_remote_address)


# =========================
# API KEY
# =========================

DEMO_API_KEY = "your-secret-key"


def verify_api_key(x_api_key: str = Header(default=None)):
    if x_api_key != DEMO_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


# =========================
# user system
# =========================

def get_user_id(request: Request):
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host


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

def get_audio_duration_seconds(file_path: str):
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
    return templates.TemplateResponse("index.html", {"request": request})


# =========================
# usage
# =========================

@router.get("/api/usage")
async def get_usage(request: Request):
    user = get_user_id(request)
    today = date.today().isoformat()

    supabase = get_supabase_client()

    res = supabase.table("demo_ip_usage") \
        .select("minutes_used") \
        .eq("date", today) \
        .eq("ip", user) \
        .execute()

    used = res.data[0]["minutes_used"] if res.data else 0

    return {
        "user": user,
        "used": used,
        "remaining": max(0, IP_LIMIT - used)
    }


# =========================
# upload（核心）
# =========================

@router.post("/api/upload", response_model=None)
@limiter.limit("5/minute")
async def upload_audio(
    request: Request,
    file: UploadFile = File(...),
    _: None = Depends(verify_api_key)
):
    user = get_user_id(request)

    if not file.filename:
        raise HTTPException(status_code=400, detail="缺少檔名")

    if file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(status_code=400, detail=f"不支援的檔案類型: {file.content_type}")

    audio_bytes = await file.read()

    tmp_path = None

    try:
        wav_bytes = convert_to_wav_bytes(audio_bytes)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(wav_bytes)
            tmp_path = tmp.name

        duration_seconds = get_audio_duration_seconds(tmp_path)
        duration_minutes = int(duration_seconds / 60) + 1

        # 🔥 預扣
        await check_and_reserve(user, duration_minutes)

        # 🔥 呼叫 ASR
        dg_result = await transcribe_audio_bytes(
            audio_bytes=wav_bytes,
            mimetype="audio/wav",
            filename=file.filename,
        )

        segments = build_segments_from_deepgram(dg_result)

        # 🔥 儲存
        await save_transcript(user, duration_minutes, segments)

        # 🔥 log
        await record_usage_log(user, duration_minutes)

        return {
            "filename": file.filename,
            "segments": segments
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"轉錄失敗: {str(exc)}")

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)