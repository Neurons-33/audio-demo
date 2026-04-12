import { dom } from './dom.js';
import { getSubtitles } from './state.js';

export function bindVideoUpload() {
    dom.videoUpload.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        dom.videoElement.src = URL.createObjectURL(file);
        dom.videoElement.classList.remove('hidden');
        dom.videoPlaceholder.classList.add('hidden');
    });
}

export function bindVideoSubtitleSync() {
    dom.videoElement.addEventListener('timeupdate', () => {
        const subtitles = getSubtitles();
        if (!subtitles.length) return;

        const currentTime = dom.videoElement.currentTime;
        const activeSegment = subtitles.find(
            (seg) => currentTime >= seg.start && currentTime <= seg.end
        );

        if (activeSegment) {
            dom.subtitleOverlay.innerText = activeSegment.text;
            dom.subtitleOverlay.classList.remove('opacity-0');
            dom.subtitleOverlay.classList.add('opacity-100');
        } else {
            dom.subtitleOverlay.classList.remove('opacity-100');
            dom.subtitleOverlay.classList.add('opacity-0');
        }
    });
}