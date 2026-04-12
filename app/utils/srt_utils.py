from __future__ import annotations


def format_srt_timestamp(seconds: float) -> str:
    total_ms = int(round(seconds * 1000))
    ms = total_ms % 1000
    total_seconds = total_ms // 1000
    s = total_seconds % 60
    m = (total_seconds // 60) % 60
    h = total_seconds // 3600
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def segments_to_srt(segments: list[dict]) -> str:
    lines: list[str] = []

    for idx, seg in enumerate(segments, start=1):
        lines.append(str(idx))
        lines.append(
            f"{format_srt_timestamp(float(seg['start']))} --> "
            f"{format_srt_timestamp(float(seg['end']))}"
        )
        lines.append(str(seg["text"]).strip())
        lines.append("")

    return "\n".join(lines)