const BASE_URL = "http://localhost:8080/api";

export async function fetchMessages(conversationId: string) {
    const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`);
    if (!res.ok) throw new Error(`GET messages ${res.status}`);
    return res.json();
}

export async function sendMessage(conversationId: string, content: string) {
    const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`POST messages ${res.status}`);
    return res.json();
}