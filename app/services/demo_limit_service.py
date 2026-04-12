from datetime import date
from fastapi import HTTPException

from app.services.supabase_storage_service import get_supabase_client

GLOBAL_LIMIT = 100
IP_LIMIT = 12
MAX_SINGLE_FILE_MINUTES = 5


def get_today():
    return date.today().isoformat()


async def check_limits(ip: str, duration_minutes: float):
    if duration_minutes > MAX_SINGLE_FILE_MINUTES:
        raise HTTPException(status_code=400, detail="單次上傳超過 5 分鐘限制")

    supabase = get_supabase_client()
    today = get_today()

    # ===== Global =====
    global_res = supabase.table("demo_global_usage") \
        .select("*") \
        .eq("date", today) \
        .execute()

    total_used = 0
    if global_res.data:
        total_used = global_res.data[0]["total_minutes_used"]

    if total_used + duration_minutes > GLOBAL_LIMIT:
        raise HTTPException(status_code=429, detail="今日全站使用量已達上限")

    # ===== IP =====
    ip_res = supabase.table("demo_ip_usage") \
        .select("*") \
        .eq("date", today) \
        .eq("ip", ip) \
        .execute()

    ip_used = 0
    if ip_res.data:
        ip_used = ip_res.data[0]["minutes_used"]

    if ip_used + duration_minutes > IP_LIMIT:
        raise HTTPException(status_code=429, detail="此 IP 今日使用量已達上限")


async def record_usage(ip: str, duration_minutes: float):
    supabase = get_supabase_client()
    today = get_today()

    # ===== Global =====
    global_res = supabase.table("demo_global_usage").select("*").eq("date", today).execute()
    if global_res.data:
        new_total = global_res.data[0]["total_minutes_used"] + duration_minutes
        supabase.table("demo_global_usage").update({"total_minutes_used": new_total}).eq("date", today).execute()
    else:
        supabase.table("demo_global_usage").insert({"date": today, "total_minutes_used": duration_minutes}).execute()

    # ===== IP =====
    ip_res = supabase.table("demo_ip_usage").select("*").eq("date", today).eq("ip", ip).execute()
    if ip_res.data:
        new_ip_total = ip_res.data[0]["minutes_used"] + duration_minutes
        supabase.table("demo_ip_usage").update({"minutes_used": new_ip_total}).eq("date", today).eq("ip", ip).execute()
    else:
        supabase.table("demo_ip_usage").insert({"date": today, "ip": ip, "minutes_used": duration_minutes}).execute()

    # ===== 額外新增：寫入流水帳以供追溯 (假設建立了一張 demo_usage_logs 表) =====
    try:
        supabase.table("demo_usage_logs").insert({
            "ip": ip,
            "duration": duration_minutes,
            "created_at": "now()" # Supabase 特性，會自動填入時間
        }).execute()
    except Exception as e:
        print(f"⚠️ 流水帳記錄失敗 (請確認 demo_usage_logs 表是否存在): {e}")

    print(f"🔥 usage recorded: {ip} +{duration_minutes}min")