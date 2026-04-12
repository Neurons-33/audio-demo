from __future__ import annotations

import os
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv

load_dotenv()

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
DEEPGRAM_BASE_URL = "https://api.deepgram.com/v1/listen"


async def transcribe_audio_bytes(
    audio_bytes: bytes,
    mimetype: str,
    filename: str | None = None,
) -> dict:
    if not DEEPGRAM_API_KEY:
        raise RuntimeError("找不到 DEEPGRAM_API_KEY，請確認 .env")

    params = {
        "model": "nova-2",
        "smart_format": "true",
        "punctuate": "true",
        "utterances": "true",
        "words": "true",
        "language": "zh-TW",
        #"detect_language": "true",
    }

    url = f"{DEEPGRAM_BASE_URL}?{urlencode(params)}"

    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": mimetype or "application/octet-stream",
    }

    timeout = httpx.Timeout(120.0, connect=20.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(url, headers=headers, content=audio_bytes)

    if response.status_code >= 400:
        raise RuntimeError(
            f"Deepgram API error {response.status_code}: {response.text}"
        )

    print(f"DEBUG: Deepgram Raw Response: {response.text}")
    return response.json()