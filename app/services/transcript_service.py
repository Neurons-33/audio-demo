from app.services.supabase_storage_service import get_supabase_client


async def save_transcript(ip: str, duration: int, segments: list):
    supabase = get_supabase_client()

    res = supabase.table("transcripts").insert({
        "ip": ip,
        "duration_minutes": duration,
        "segments_json": segments
    }).execute()

    print("📝 transcript saved:", res)