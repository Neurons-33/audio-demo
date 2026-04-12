from datetime import date
from fastapi import HTTPException

from app.services.supabase_storage_service import get_supabase_client

GLOBAL_LIMIT = 100
IP_LIMIT = 12
MAX_SINGLE_FILE_MINUTES = 5


def get_today():
    return date.today().isoformat()


# 🔥 check + 預扣（核心）
async def check_and_reserve(ip: str, duration_minutes: float):
    if duration_minutes > MAX_SINGLE_FILE_MINUTES:
        raise HTTPException(status_code=400, detail="單次上傳超過 5 分鐘限制")

    supabase = get_supabase_client()
    today = get_today()

    # ===== Global =====
    global_res = supabase.table("demo_global_usage") \
        .select("*") \
        .eq("date", today) \
        .execute()

    total_used = global_res.data[0]["total_minutes_used"] if global_res.data else 0

    if total_used + duration_minutes > GLOBAL_LIMIT:
        raise HTTPException(status_code=429, detail="今日全站使用量已達上限")

    # ===== IP =====
    ip_res = supabase.table("demo_ip_usage") \
        .select("*") \
        .eq("date", today) \
        .eq("ip", ip) \
        .execute()

    ip_used = ip_res.data[0]["minutes_used"] if ip_res.data else 0

    if ip_used + duration_minutes > IP_LIMIT:
        raise HTTPException(status_code=429, detail="此 IP 今日使用量已達上限")

    # =========================
    # 🔥 預扣（避免 race）
    # =========================

    # Global
    if global_res.data:
        supabase.table("demo_global_usage") \
            .update({"total_minutes_used": total_used + duration_minutes}) \
            .eq("date", today) \
            .execute()
    else:
        supabase.table("demo_global_usage") \
            .insert({"date": today, "total_minutes_used": duration_minutes}) \
            .execute()

    # IP
    if ip_res.data:
        supabase.table("demo_ip_usage") \
            .update({"minutes_used": ip_used + duration_minutes}) \
            .eq("date", today) \
            .eq("ip", ip) \
            .execute()
    else:
        supabase.table("demo_ip_usage") \
            .insert({"date": today, "ip": ip, "minutes_used": duration_minutes}) \
            .execute()


# 🔥 optional：流水帳
async def record_usage_log(ip: str, duration_minutes: float):
    supabase = get_supabase_client()

    try:
        supabase.table("demo_usage_logs").insert({
            "ip": ip,
            "duration": duration_minutes,
            "created_at": "now()"
        }).execute()
    except Exception as e:
        print(f"⚠️ log failed: {e}")