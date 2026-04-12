FROM python:3.11-slim

WORKDIR /app

# 環境設定
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

#  系統依賴（關鍵）
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# 安裝 Python 套件
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製專案
COPY . .

# port
EXPOSE 8000

#  正確入口（你這版用這個）
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]