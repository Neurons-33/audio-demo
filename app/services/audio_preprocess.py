from __future__ import annotations

import subprocess
import tempfile
import os


def convert_to_wav_bytes(input_bytes: bytes) -> bytes:
    """
    將任意音訊轉為 16kHz mono wav（Deepgram 最穩）
    """

    with tempfile.NamedTemporaryFile(delete=False, suffix=".input") as tmp_in:
        tmp_in.write(input_bytes)
        input_path = tmp_in.name

    output_path = input_path + ".wav"

    try:
        cmd = [
            "ffmpeg",
            "-y",
            "-i", input_path,
            "-ar", "16000",
            "-ac", "1",
            "-f", "wav",
            output_path,
        ]

        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

        with open(output_path, "rb") as f:
            return f.read()

    finally:
        if os.path.exists(input_path):
            os.remove(input_path)
        if os.path.exists(output_path):
            os.remove(output_path)