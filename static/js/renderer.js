import { dom } from './dom.js';
import { getSubtitles } from './state.js';
import { formatTime } from './utils.js';
import {
    addSubtitle,
    deleteSubtitle,
    updateSubtitleTime,
    updateSubtitleText,
} from './editor.js';

function createAddButton(index) {
    const div = document.createElement('div');
    div.className = 'add-segment-btn flex items-center justify-center';

    const btn = document.createElement('button');
    btn.className = 'bg-white text-black p-1.5 rounded-full shadow-xl transition transform hover:scale-125';
    btn.innerHTML = '<i data-lucide="plus" class="w-4 h-4"></i>';
    btn.addEventListener('click', () => addSubtitle(index));

    div.appendChild(btn);
    return div;
}

function createSubtitleItem(seg, index) {
    const item = document.createElement('div');
    item.className = 'subtitle-item p-5 rounded-2xl relative mb-2';

    const topRow = document.createElement('div');
    topRow.className = 'flex justify-between items-center mb-4';

    const label = document.createElement('span');
    label.className = 'text-[9px] uppercase tracking-widest text-white/40 font-black';
    label.textContent = `SEG #${seg.id}`;

    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-3';

    const timeGroup = document.createElement('div');
    timeGroup.className = 'flex items-center gap-1';

    const startInput = document.createElement('input');
    startInput.type = 'text';
    startInput.className = 'time-input';
    startInput.value = formatTime(seg.start);
    startInput.addEventListener('change', (e) => {
        updateSubtitleTime(index, 'start', e.target.value);
    });

    const dash = document.createElement('span');
    dash.className = 'text-white/20';
    dash.textContent = '—';

    const endInput = document.createElement('input');
    endInput.type = 'text';
    endInput.className = 'time-input';
    endInput.value = formatTime(seg.end);
    endInput.addEventListener('change', (e) => {
        updateSubtitleTime(index, 'end', e.target.value);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'p-1.5 hover:bg-red-500/30 rounded-lg text-white/40 hover:text-red-400 transition';
    deleteBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
    deleteBtn.addEventListener('click', () => deleteSubtitle(index));

    const textarea = document.createElement('textarea');
    textarea.className = 'w-full bg-transparent border-none outline-none text-sm resize-none focus:ring-0 leading-relaxed text-white font-medium';
    textarea.rows = 2;
    textarea.value = seg.text;
    textarea.addEventListener('input', (e) => {
        updateSubtitleText(index, e.target.value);
    });

    timeGroup.appendChild(startInput);
    timeGroup.appendChild(dash);
    timeGroup.appendChild(endInput);

    actions.appendChild(timeGroup);
    actions.appendChild(deleteBtn);

    topRow.appendChild(label);
    topRow.appendChild(actions);

    item.appendChild(topRow);
    item.appendChild(textarea);

    return item;
}

export function renderSubtitles() {
    const subtitles = getSubtitles();

    dom.loadingState.classList.add('hidden');

    if (!subtitles.length) {
        dom.subtitleList.innerHTML = '';
        dom.subtitleList.appendChild(dom.emptyState);
        dom.emptyState.classList.remove('hidden');
        dom.segmentCountLabel.innerText = '0 SEGMENTS';
        dom.downloadBtn.disabled = true;
        lucide.createIcons();
        return;
    }

    dom.subtitleList.innerHTML = '';
    dom.subtitleList.appendChild(createAddButton(0));

    subtitles.forEach((seg, index) => {
        dom.subtitleList.appendChild(createSubtitleItem(seg, index));
        dom.subtitleList.appendChild(createAddButton(index + 1));
    });

    dom.segmentCountLabel.innerText = `${subtitles.length} SEGMENTS`;
    dom.downloadBtn.disabled = false;

    lucide.createIcons();
}