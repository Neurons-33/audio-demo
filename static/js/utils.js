export function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const sec = (seconds % 60).toFixed(2);
    return `${m.toString().padStart(2, '0')}:${sec.padStart(5, '0')}`;
}

export function parseTimeInput(value) {
    const parts = value.split(/[:.]/);
    if (parts.length < 2) return null;

    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);

    if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;

    return minutes * 60 + seconds;
}

export function formatSrt(seconds) {
    const d = new Date(seconds * 1000);
    return d.toISOString().substr(11, 8) + ',' + d.getUTCMilliseconds().toString().padStart(3, '0');
}

export function buildSrt(subtitles) {
    return subtitles
        .map((s, i) => `${i + 1}\n${formatSrt(s.start)} --> ${formatSrt(s.end)}\n${s.text}`)
        .join('\n\n');
}