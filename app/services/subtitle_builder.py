from __future__ import annotations

from typing import Any
import re


# =========================
# 基本處理
# =========================
def _clean_text(text: str) -> str:
    return "".join(text.split()).strip()


def _fix_numbers(text: str) -> str:
    return re.sub(r'(\d)\s+(\d)', r'\1\2', text)


def _normalize_text(raw: str) -> str:
    text = _clean_text(raw)
    text = _fix_numbers(text)
    return text


# =========================
# 語意規則
# =========================
BREAK_WORDS = {
    "但是", "可是", "然後", "所以", "因為", "如果",
    "那", "就是", "其實", "這樣"
}

# 🔥 語塊（不能被拆）
PHRASE_WORDS = {"的話", "的時候", "就是說", "對不對"}

NOISE_WORDS = {"嗯", "啊", "呃", "欸"}


def _ends_with_break_word(text: str) -> bool:
    return any(text.endswith(w) for w in BREAK_WORDS)


# =========================
# v3：粗切（保留）
# =========================
def _chunk_words_to_segments(
    words: list[dict[str, Any]],
    max_chars: int = 14,
    max_duration: float = 3.0,
) -> list[dict[str, Any]]:

    segments: list[dict[str, Any]] = []
    current_words: list[dict[str, Any]] = []

    def flush():
        nonlocal current_words, segments

        if not current_words:
            return

        raw = "".join(
            w.get("punctuated_word") or w.get("word", "")
            for w in current_words
        )

        text = _normalize_text(raw)

        start = float(current_words[0]["start"])
        end = float(current_words[-1]["end"])

        if text and end > start and text not in NOISE_WORDS:
            segments.append({
                "id": len(segments) + 1,
                "start": round(start, 3),
                "end": round(end, 3),
                "text": text,
            })

        current_words = []

    for w in words:
        if "start" not in w or "end" not in w:
            continue

        current_words.append(w)

        raw = "".join(
            x.get("punctuated_word") or x.get("word", "")
            for x in current_words
        )

        text = _normalize_text(raw)

        start = float(current_words[0]["start"])
        end = float(current_words[-1]["end"])
        duration = end - start

        # 🔥 硬限制
        if len(text) >= max_chars or duration >= max_duration:
            flush()
            continue

        # 語意輔助
        if text.endswith(("。", "！", "？", ".", "!", "?")):
            flush()
            continue

        if _ends_with_break_word(text) and len(text) > max_chars * 0.6:
            flush()

    flush()
    return segments


# =========================
# v4：語意修復 + CPS
# =========================
def _post_optimize_segments(segments: list[dict[str, Any]]) -> list[dict[str, Any]]:

    optimized: list[dict[str, Any]] = []

    for seg in segments:
        if not optimized:
            optimized.append(seg)
            continue

        prev = optimized[-1]

        combined_text = prev["text"] + seg["text"]
        combined_duration = seg["end"] - prev["start"]

        cps = len(combined_text) / max(combined_duration, 0.1)

        # =========================
        # 🔥 1. 語塊修復（最重要）
        # =========================
        for phrase in PHRASE_WORDS:
            if prev["text"].endswith(phrase[:-1]) and seg["text"].startswith(phrase[-1]):
                prev["end"] = seg["end"]
                prev["text"] = combined_text
                break
        else:
            # =========================
            # 🔥 2. 短句合併
            # =========================
            if (
                len(seg["text"]) < 6
                and len(combined_text) <= 16
                and cps < 17
            ):
                prev["end"] = seg["end"]
                prev["text"] = combined_text
            else:
                optimized.append(seg)

    # =========================
    # 🔥 3. CPS 強制檢查（過快拆分）
    # =========================
    final_segments: list[dict[str, Any]] = []

    for seg in optimized:
        duration = seg["end"] - seg["start"]
        cps = len(seg["text"]) / max(duration, 0.1)

        if cps > 18 and len(seg["text"]) > 8:
            mid = len(seg["text"]) // 2

            final_segments.append({
                "start": seg["start"],
                "end": seg["start"] + duration / 2,
                "text": seg["text"][:mid],
            })

            final_segments.append({
                "start": seg["start"] + duration / 2,
                "end": seg["end"],
                "text": seg["text"][mid:],
            })
        else:
            final_segments.append(seg)

    # 重編 id
    for i, seg in enumerate(final_segments, start=1):
        seg["id"] = i

    print(f"✅ segments (v4): {len(final_segments)}")

    return final_segments


# =========================
# 主入口
# =========================
def build_segments_from_deepgram(data: dict[str, Any]) -> list[dict[str, Any]]:

    try:
        alt = data["results"]["channels"][0]["alternatives"][0]
        print(f"🧠 transcript sample: {alt.get('transcript', '')[:60]}...")
        print(f"🧠 total words: {len(alt.get('words', []))}")
    except Exception:
        print("❌ Deepgram structure unexpected")

    words = (
        data.get("results", {})
        .get("channels", [{}])[0]
        .get("alternatives", [{}])[0]
        .get("words", [])
    )

    if words:
        segments = _chunk_words_to_segments(words)
        return _post_optimize_segments(segments)

    print("⚠️ fallback: no words")

    transcript = (
        data.get("results", {})
        .get("channels", [{}])[0]
        .get("alternatives", [{}])[0]
        .get("transcript", "")
    ).strip()

    if transcript:
        return [{
            "id": 1,
            "start": 0.0,
            "end": 5.0,
            "text": transcript,
        }]

    print("❌ no usable data")
    return []