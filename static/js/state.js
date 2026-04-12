let subtitles = [];
let progressInterval = null;
let currentProgress = 0;

export function getSubtitles() {
    return subtitles;
}

export function setSubtitles(data) {
    subtitles = Array.isArray(data) ? data : [];
}

export function setSubtitleAt(index, patch) {
    if (!subtitles[index]) return;
    subtitles[index] = { ...subtitles[index], ...patch };
}

export function spliceSubtitles(start, deleteCount, ...items) {
    subtitles.splice(start, deleteCount, ...items);
}

export function reindexSubtitles() {
    subtitles.forEach((s, i) => {
        s.id = i + 1;
    });
}

export function getProgressInterval() {
    return progressInterval;
}

export function setProgressInterval(interval) {
    progressInterval = interval;
}

export function clearProgressInterval() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

export function getCurrentProgress() {
    return currentProgress;
}

export function setCurrentProgress(value) {
    currentProgress = value;
}