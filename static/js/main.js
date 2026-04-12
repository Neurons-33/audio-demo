import { dom } from './dom.js';
import { initBackground } from './background.js';
import { bindVideoUpload, bindVideoSubtitleSync } from './video.js';
import {
    setSubtitles,
    clearProgressInterval,
    setProgressInterval,
    setCurrentProgress,
    getCurrentProgress,
    getSubtitles,
} from './state.js';
import { renderSubtitles } from './renderer.js';
import { buildSrt } from './utils.js';

/* =========================
🔥 USER SYSTEM (修正 UUID 相容性)
========================= */
function getUserId() {
    let id = localStorage.getItem("demo_user_id");
    if (!id) {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            id = crypto.randomUUID();
        } else {
            id = 'u_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        }
        localStorage.setItem("demo_user_id", id);
    }
    return id;
}

async function apiFetch(url, options = {}) {
    const userId = getUserId();
    
    options.headers = {
        ...(options.headers || {}),
        "x-user-id": userId
    };

    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.detail || `API ERROR: ${res.status}`);
        }
        return res;
    } catch (err) {
        console.error("API FAIL:", url, err);
        throw err;
    }
}

/* =========================
🔥 新增：UI 錯誤提示函數 (整合毛玻璃彈窗)
========================= */
window.showLimitError = function(message) {
    const modal = document.getElementById('custom-alert');
    const card = document.getElementById('alert-card');
    const title = document.getElementById('alert-title');
    const content = document.getElementById('alert-content');
    const icon = document.getElementById('alert-icon-container');

    if (!modal || !content) return;

    content.innerText = message;
    
    // 判斷錯誤類型切換 UI 內容與圖示
    if (message.includes('全站')) {
        title.innerText = '系統公告';
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19.5h-11a3.5 3.5 0 0 1 0-7h.5a8.5 8.5 0 0 1 15 2.5a4 4 0 0 1-4.5 4.5z"/><circle cx="12" cy="14" r="1"/></svg>`;
    } else {
        title.innerText = '個人額度限制';
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }

    modal.classList.remove('hidden');
    // 動態縮放動畫效果
    setTimeout(() => {
        card.classList.remove('scale-95');
        card.classList.add('scale-100');
    }, 10);
};

/* =========================
🔥 USAGE (優化顯示邏輯)
========================= */
async function refreshUsage() {
    const el = document.getElementById("usage-box");
    if (!el) return;

    try {
        const res = await apiFetch("/api/usage");
        const data = await res.json();

        const used = data.used ?? 0;
        const remaining = data.remaining ?? (20 - used); // 注意：這裡已對應你修改後的 20 分鐘

        el.innerHTML = `
            <span class="bg-white/10 px-3 py-1 rounded-full border border-white/10">
                今日剩餘：<span class="text-emerald-400">${remaining}</span> 分鐘 
                <span class="opacity-40 mx-2">|</span> 
                已用：${used} min
            </span>
        `;

    } catch (err) {
        console.error("refreshUsage Error:", err);
        el.innerText = "⚠️ 無法取得額度";
    }
}

/* =========================
🔥 HISTORY
========================= */
async function loadHistory() {
    const container = document.getElementById("history");
    if (!container) return;

    try {
        const res = await apiFetch("/api/history");
        const data = await res.json();

        container.innerHTML = "";
        
        if (!data.data || data.data.length === 0) {
            container.innerHTML = `<div class="text-white/20 text-[10px] italic">No recent logs</div>`;
            return;
        }

        data.data.forEach(item => {
            const btn = document.createElement("button");
            btn.className = "w-full text-left text-white text-[11px] bg-white/5 p-2 rounded-xl hover:bg-white/10 border border-white/5 transition flex justify-between items-center group";
            
            btn.innerHTML = `
                <span>📝 ${item.duration_minutes} min Record</span>
                <i data-lucide="chevron-right" class="w-3 h-3 opacity-0 group-hover:opacity-100 transition"></i>
            `;

            btn.onclick = () => {
                if (item.segments_json) {
                    setSubtitles(item.segments_json);
                    renderSubtitles();
                }
            };
            container.appendChild(btn);
        });
        lucide.createIcons();

    } catch (err) {
        container.innerHTML = `<div class="text-red-400 text-[10px]">History load failed</div>`;
    }
}

/* =========================
🔥 PROGRESS
========================= */
function startSimulatedProgress() {
    setCurrentProgress(0);
    dom.statusBadge.classList.remove('hidden');
    clearProgressInterval();

    const interval = setInterval(() => {
        let progress = getCurrentProgress();
        if (progress < 95) {
            progress += (98 - progress) / 20;
            setCurrentProgress(progress);
        }
        dom.statusText.innerText = `PROCESSING (${Math.floor(getCurrentProgress())}%)`;
    }, 300);

    setProgressInterval(interval);
}

function stopSimulatedProgress() {
    clearProgressInterval();
    dom.statusText.innerText = 'READY (100%)';
    setTimeout(() => {
        dom.statusBadge.classList.add('hidden');
    }, 800);
}

/* =========================
🔥 UPLOAD (整合新錯誤提示)
========================= */
function bindAudioUpload() {
    dom.audioUpload.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        dom.emptyState.classList.add('hidden');
        dom.loadingState.classList.remove('hidden');
        dom.subtitleList.innerHTML = '';
        dom.subtitleList.appendChild(dom.loadingState);
        dom.downloadBtn.disabled = true;

        startSimulatedProgress();

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await apiFetch("/api/upload", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            setSubtitles(data.segments || []);
            stopSimulatedProgress();
            renderSubtitles();

            await refreshUsage();
            // await loadHistory(); // 配合你的 UI 修改

        } catch (error) {
            console.error(error);
            
            // ✅ 使用自定義 UI 彈窗取代 alert
            window.showLimitError(error.message); 
            
            dom.loadingState.classList.add('hidden');
            dom.emptyState.classList.remove('hidden');
            stopSimulatedProgress();
        }
    });
}

/* =========================
🔥 DOWNLOAD
========================= */
function bindDownload() {
    dom.downloadBtn.addEventListener('click', () => {
        const srt = buildSrt(getSubtitles());
        const blob = new Blob([srt], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'ASR_Export.srt';
        a.click();
    });
}

/* =========================
🔥 INIT
========================= */
async function init() {
    console.log("🚀 MAIN INIT START");
    
    lucide.createIcons();
    initBackground();

    try {
        await refreshUsage();
        // await loadHistory();
    } catch (e) {
        console.error("Init Request Failed", e);
    }

    bindVideoUpload();
    bindVideoSubtitleSync();
    bindAudioUpload();
    bindDownload();

    console.log("✅ MAIN INIT DONE");
}

init();