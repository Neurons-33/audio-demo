---
title: Audio Demo
emoji: 🎧
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

#  Audio Demo — AI 字幕生成 SaaS 原型

一個以 **FastAPI + ASR 語音轉文字流程 + Supabase** 建構的 AI 字幕生成系統原型。
此專案重點不在單點功能，而在於展示 **從前端互動到後端處理的完整系統流程**。

---

##  Demo展示

 Hugging Face 部署
https://neurons33-audio-demo.hf.space

---

##  介面展示

###  網頁介面

<p align="center">
  <img src="https://fengyun3999.sirv.com/html.png" width="720">
</p>

---

###  手機介面

<p align="center">
  <img src="https://fengyun3999.sirv.com/phong.png" width="320">
</p>

---

##  專案核心

* 使用者實際操作流程（上傳 → 處理 → 顯示）
* API 設計與後端協調
* 可部署的系統架構（Docker + 雲端）

---

##  技術棧

### 後端

* FastAPI
* Uvicorn
* Python 3.11

### 語音處理

* ASR（語音轉文字流程）
* ffmpeg（音訊前處理）

### 前端

* 原生 JavaScript（模組化）
* HTML + CSS（自訂 UI）

### 雲端與部署

* Hugging Face Spaces（Docker）
* Supabase（儲存與 API）

---

##  系統架構

```
使用者上傳音檔
        ↓
FastAPI 接收請求
        ↓
ASR 處理（音訊 → 文字）
        ↓
字幕生成（SRT）
        ↓
Supabase（可選儲存）
        ↓
前端顯示結果
```

---

##  專案結構

```
audio-demo/
├── app/                # FastAPI 後端
├── static/             # 前端資源（JS / CSS）
├── templates/          # HTML
├── Dockerfile          # 部署設定
├── requirements.txt
```

---

##  目前功能

* 🎵 音檔上傳介面
* 🧾 字幕（SRT）生成邏輯
* 🖥️ 前端即時預覽
* ☁️ Hugging Face 雲端部署
* 🔌 Supabase 環境變數整合

---

##  當前限制（Prototype 階段）

此專案為系統原型，尚未進入產品化：

* 尚無任務佇列（多人同時使用會不穩定）
* 無持久化任務管理
* 無使用者系統 / 金流
* 錯誤處理尚未完整

---

##  發展方向

* [ ] 非同步任務系統（Queue）
* [ ] 使用者與 session 管理
* [ ] 線上字幕編輯器（時間軸操作）
* [ ] SaaS 收費模型整合
* [ ] GPU / 外部 ASR 優化

---

##  本地開發

```bash
git clone https://github.com/Neurons-33/audio-demo.git
cd audio-demo

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

##  Docker

```bash
docker build -t audio-demo .
docker run -p 8000:8000 audio-demo
```

---

##  環境變數

建立 `.env`：

```
SUPABASE_URL=你的網址
SUPABASE_ANON_KEY=你的金鑰
DEEPGRAM_API_KEY=你的金鑰
```

---

##  設計思維

此專案重點不在「語音辨識本身」，
而在於：

* 如何設計可擴展的處理流程
* 如何在雲端環境中管理資源
* 如何平衡效能、成本與使用體驗

---

##  作者

Neurons-33



