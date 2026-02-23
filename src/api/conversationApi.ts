const BASE_URL = "http://localhost:8080/api";

export async function fetchConversations() {
    const res = await fetch(`${BASE_URL}/conversations`);
    if (!res.ok) throw new Error(`GET conversations ${res.status}`);
    return res.json();
}

export async function createConversation(title: string) {
    const res = await fetch(`${BASE_URL}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error(`POST conversations ${res.status}`);
    return res.json();
}