# base image
FROM python:3.11-slim

# 設定工作目錄
WORKDIR /app

# 安裝系統依賴（關鍵）
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# 複製 requirements
COPY requirements.txt .

# 安裝 Python 套件
RUN pip install --no-cache-dir -r requirements.txt

# 複製專案
COPY . .

# 啟動
CMD uvicorn app.main:app --host 0.0.0.0 --port 7860