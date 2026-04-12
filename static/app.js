let currentSegments = [];
let currentFilename = "subtitle";

const audioFileInput = document.getElementById("audioFile");
const uploadBtn = document.getElementById("uploadBtn");
const downloadBtn = document.getElementById("downloadBtn");
const statusEl = document.getElementById("status");
const segmentsContainer = document.getElementById("segmentsContainer");

function setStatus(text) {
  statusEl.textContent = text;
}

function formatPreviewTime(sec) {
  const s = Number(sec || 0);
  return `${s.toFixed(2)}s`;
}

function formatSrtTimestamp(seconds) {
  const totalMs = Math.round(Number(seconds) * 1000);
  const ms = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function generateSrt(segments) {
  return segments
    .map((seg, index) => {
      return [
        String(index + 1),
        `${formatSrtTimestamp(seg.start)} --> ${formatSrtTimestamp(seg.end)}`,
        String(seg.text || "").trim(),
        ""
      ].join("\n");
    })
    .join("\n");
}

function getSafeBaseName(filename) {
  if (!filename) return "subtitle";
  const idx = filename.lastIndexOf(".");
  return idx > 0 ? filename.slice(0, idx) : filename;
}

function renderSegments(segments) {
  segmentsContainer.innerHTML = "";

  if (!segments.length) {
    segmentsContainer.innerHTML = "<p>沒有字幕可顯示。</p>";
    downloadBtn.disabled = true;
    return;
  }

  segments.forEach((seg, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "segment";

    const header = document.createElement("div");
    header.className = "segment-header";
    header.textContent = `#${index + 1} | ${formatPreviewTime(seg.start)} → ${formatPreviewTime(seg.end)}`;

    const textarea = document.createElement("textarea");
    textarea.value = seg.text || "";
    textarea.addEventListener("input", (e) => {
      currentSegments[index].text = e.target.value;
      localStorage.setItem("segments", JSON.stringify(currentSegments));
    });

    wrapper.appendChild(header);
    wrapper.appendChild(textarea);
    segmentsContainer.appendChild(wrapper);
  });

  downloadBtn.disabled = false;
}

uploadBtn.addEventListener("click", async () => {
  const file = audioFileInput.files?.[0];
  if (!file) {
    setStatus("請先選擇音檔。");
    return;
  }

  currentFilename = file.name;
  uploadBtn.disabled = true;
  downloadBtn.disabled = true;
  segmentsContainer.innerHTML = "";
  setStatus("上傳中，正在送往 Deepgram 進行 ASR，請稍候...");

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "上傳失敗");
    }

    currentSegments = data.segments || [];
    localStorage.setItem("segments", JSON.stringify(currentSegments));
    localStorage.setItem("filename", currentFilename);

    renderSegments(currentSegments);
    setStatus(`完成，共 ${currentSegments.length} 段字幕。`);
  } catch (error) {
    console.error(error);
    setStatus(`失敗：${error.message}`);
  } finally {
    uploadBtn.disabled = false;
  }
});

downloadBtn.addEventListener("click", () => {
  if (!currentSegments.length) {
    setStatus("目前沒有字幕可以下載。");
    return;
  }

  const srtContent = generateSrt(currentSegments);
  const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${getSafeBaseName(currentFilename)}.srt`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
  setStatus("SRT 已下載。");
});

window.addEventListener("DOMContentLoaded", () => {
  const savedSegments = localStorage.getItem("segments");
  const savedFilename = localStorage.getItem("filename");

  if (savedSegments) {
    try {
      currentSegments = JSON.parse(savedSegments);
      currentFilename = savedFilename || "subtitle";
      renderSegments(currentSegments);
      setStatus("已載入上次暫存在瀏覽器的字幕。");
    } catch (error) {
      console.error(error);
      localStorage.removeItem("segments");
      localStorage.removeItem("filename");
    }
  }
});