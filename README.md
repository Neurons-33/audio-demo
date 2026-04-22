---
title: Audio Demo
emoji: 🎧
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

#  Audio Demo — AI Workflow System

> 語音轉文字不等於字幕。
> 這個專案在解的是：如何讓語音資料變成可用內容。

---

Article: [Read on Medium](https://medium.com/@fengyun3999/%E7%82%BA%E4%BB%80%E9%BA%BC%E8%AA%9E%E9%9F%B3%E8%BD%89%E6%96%87%E5%AD%97%E4%B8%8D%E7%AD%89%E6%96%BC%E5%AD%97%E5%B9%95-67a98df67dea)

---

## 問題定義

這個專案的起點來自一個很直接的問題：

語音轉文字，並不能直接變成可用的字幕。

ASR 只負責將聲音轉成文字，但在實際使用中，這些文字：
- 難以閱讀
- 缺乏節奏
- 無法直接應用於內容整理或分析

因此我將問題重新定義為：

如何將「語音資料」轉為「可閱讀、可編輯的內容」


---

## 專案定位

這個專案是在解這個問題，並嘗試建立一條完整的處理流程，
讓語音資料真正轉換為可使用的資訊。

核心是設計一套 AI workflow 系統，
將原始語音轉換為「可編輯、可應用」的內容。

在實際場景中，語音轉文字只是第一步，
真正困難的是後續的整理、斷句與結構化。

因此我將整個流程拆解為多個可控步驟，
讓原本依賴人工處理的流程，可以被系統化與優化。

本專案的重點並非 ASR 本身，
而在於如何將模型輸出轉為可以直接進入工作流程的內容。

---

### 系統目標（具體化）

一個針對「語音轉字幕」場景所設計的 MVP 系統。

主要聚焦在：

- 如何將 ASR（Automatic Speech Recognition）結果轉為可閱讀字幕
- 如何在「成本 / 速度 / 品質」之間做實務取捨
- 如何設計一個可擴展為 SaaS 的處理流程

---
## Pipeline

Audio → ASR → Structure → Subtitle Builder → Editable Output
---

##  介面展示

###  介面與連結 https://neurons33-audio-demo.hf.space

<p align="center">
  <img src="https://fengyun3999.sirv.com/html.png" width="720">
</p>

---

###  手機介面

<p align="center">
  <img src="https://fengyun3999.sirv.com/phong.png" width="330">
</p>

---

##  Workflow流程

<p align="center">
  <img src="https://fengyun3999.sirv.com/workflow.png" width="320">
</p>

本系統將語音處理拆為多個可控步驟：

1. 使用者上傳音檔（m4a / wav）
2. 後端接收並轉換為標準 wav 格式（mono / 16kHz）
3. 呼叫 ASR（Deepgram / Whisper）取得逐字結果與時間資訊
4. 將 ASR 結果送入字幕切分模組（Subtitle Builder）
5. 根據語意、字數、時間與 CPS 規則進行結構化處理
6. 產生可編輯字幕 segments（SRT 初稿）
7. 前端顯示結果，供使用者預覽與編輯
8. 儲存結果與任務資訊（Supabase）

---

##  系統架構

```
使用者上傳音檔
        ↓
FastAPI 接收請求
        ↓
音訊格式轉換（wav）
        ↓
ASR 處理（Deepgram / Whisper）
        ↓
字幕切分與結構化處理
        ↓
segments / SRT 初稿生成
        ↓
儲存結果與使用紀錄（Supabase）
        ↓
前端顯示與編輯
```

---

##  設計思維

本專案的重點在於：

**如何將「原始語音」轉換為「可使用內容」的完整流程設計**

在實作過程中，我將問題拆解為三個部分：

---

### 1. Pipeline 設計（流程可控）

語音轉文字並不是單一步驟，而是：

ASR → 結構化處理 → 字幕生成 → 前端編輯

我選擇將流程拆解為多個模組，而非依賴單一模型輸出  
以確保每個階段都可以獨立優化與替換

---

### 2. 輸出品質控制（不是只看辨識率）

ASR 除錯字以外最大的問題：

- 斷句不自然  
- 字幕長度不穩定  
- 閱讀節奏不一致  

因此我將重點放在：

**後處理（Subtitle Builder）**

透過規則（語意 / CPS / 長度）讓輸出更接近實際短影音使用場景

---

### 3. 系統取捨（Speed / Cost / Quality）

在 MVP 階段，我刻意選擇：

- 使用外部 ASR（Deepgram） → 降低開發成本  
- 保留後處理邏輯 → 提升輸出品質  
- 採同步流程 → 簡化系統複雜度  

優先驗證「流程可行性」，而非直接優化效能

---

最終目標是：

**建立一條可擴展的語音處理工作流**

---

## 關鍵觀察

在實作過程中，我發現 ASR 的輸出結果無法直接用於字幕場景。

問題不僅僅是辨識正確率，其中包含斷句、閱讀節奏與輸出穩定性。

因此額外設計了字幕後處理邏輯：

- 語意斷句
- 語塊修復
- 短句合併與
- CPS（字元/秒）控制
- fallback（無 word timestamp 時處理）

---

## 實際價值

- 降低語音內容整理的人工成本  
- 可在數分鐘內產出可用字幕初稿（測試情境）  
- 支援影音字幕、會議紀錄、語音整理等場景(目前為短影音)  

**縮短「語音 → 可用內容」之間的距離**

---

##  技術棧

- FastAPI（後端 API）
- Deepgram / Whisper（語音辨識）
- Supabase（儲存與資料管理）
- JavaScript / HTML（前端 UI）

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

*  音檔上傳介面
*  字幕（SRT）生成邏輯
*  前端即時預覽
*  Hugging Face 雲端部署
*  Supabase 環境變數整合

---

##  當前限制（Prototype 階段）

目前版本仍處於原型階段，主要限制：

* 尚無任務佇列（多人同時使用會不穩定）
* 無持久化任務管理
* 無使用者系統 / 金流
* 錯誤處理尚未完整

---

##  發展方向

未來將優先優化系統穩定性與可擴展性：

### 系統架構
- [ ] 非同步任務系統（Queue / Background Worker）
- [ ] Job 狀態追蹤與任務管理機制  
- [ ] 使用者 session / usage tracking  

### 使用體驗
- [ ] 線上字幕編輯器（時間軸 + 即時修改）  
- [ ] 字幕輸出格式優化（閱讀性 / 節奏控制）  

### 商業化方向
- [ ] SaaS 收費模型（按音檔長度計費）  
- [ ] API 化服務（提供第三方接入）  

### AI / 模型優化
- [ ] GPU / 外部 ASR 加速方案  
- [ ] 字幕後處理（LLM / 語意優化）  

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

##  作者

Neurons-33



