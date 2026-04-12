// app/static/js/api.js

// 獲取或建立一個持久的用戶 ID (存於瀏覽器)
function getClientId() {
    let id = localStorage.getItem('demo_user_id');
    if (!id) {
        id = 'client_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('demo_user_id', id);
    }
    return id;
}

export async function getUsage() {
    const response = await fetch('/api/usage', {
        headers: { 'x-user-id': getClientId() }
    });
    return response.json();
}

export async function uploadAudio(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
            'x-user-id': getClientId() // 確保後端 get_user_id 能正確拿到值
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '辨識失敗');
    }

    return response.json();
}