import { dom } from './dom.js';
import {
    getSubtitles,
    setSubtitleAt,
    spliceSubtitles,
    reindexSubtitles,
} from './state.js';
import { renderSubtitles } from './renderer.js';
import { parseTimeInput } from './utils.js';

export function triggerSaveUI() {
    dom.saveStatus.innerHTML = '<i data-lucide="refresh-cw" class="w-3 h-3 animate-spin text-white"></i> SYNCING';
    lucide.createIcons();

    setTimeout(() => {
        dom.saveStatus.innerHTML = '<i data-lucide="check-circle" class="w-3 h-3 text-emerald-400"></i> SYNCED';
        lucide.createIcons();
    }, 600);
}

export function addSubtitle(index) {
    const subtitles = getSubtitles();
    const start = index > 0 ? subtitles[index - 1].end + 0.1 : 0;

    spliceSubtitles(index, 0, {
        id: 0,
        start,
        end: start + 2,
        text: '新字幕段落...',
    });

    reindexSubtitles();
    renderSubtitles();
    triggerSaveUI();
}

export function deleteSubtitle(index) {
    const subtitles = getSubtitles();

    if (index > 0 && index < subtitles.length - 1) {
        subtitles[index - 1].end = subtitles[index].end;
    }

    spliceSubtitles(index, 1);
    reindexSubtitles();
    renderSubtitles();
    triggerSaveUI();
}

export function updateSubtitleTime(index, field, value) {
    const seconds = parseTimeInput(value);
    if (seconds === null) return;

    const subtitles = getSubtitles();
    setSubtitleAt(index, { [field]: seconds });

    if (field === 'end' && index < subtitles.length - 1) {
        subtitles[index + 1].start = seconds;
    }

    renderSubtitles();
    triggerSaveUI();
}

export function updateSubtitleText(index, value) {
    setSubtitleAt(index, { text: value });

    const subtitles = getSubtitles();
    const currentTime = dom.videoElement.currentTime;
    const current = subtitles[index];

    if (current && currentTime >= current.start && currentTime <= current.end) {
        dom.subtitleOverlay.innerText = value;
    }

    triggerSaveUI();
}