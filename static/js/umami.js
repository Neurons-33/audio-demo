export function trackUmami(eventName, data = undefined) {
    if (window.umami && typeof window.umami.track === "function") {
        if (data) {
            window.umami.track(eventName, data);
        } else {
            window.umami.track(eventName);
        }
    }
}