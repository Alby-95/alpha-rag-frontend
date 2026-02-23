import React, { useEffect, useState } from "react";
import banner from "./assets/alpha-banner.png";
import { fetchConversations, createConversation } from "./api/conversationApi";
import { fetchMessages, sendMessage } from "./api/messageApi";

type Conversation = {
    id: string;
    title: string;
    createdAt?: string;
    updatedAt?: string;
};

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

function clsx(...v: Array<string | false | null | undefined>) {
    return v.filter(Boolean).join(" ");
}

const promptPresets = [
    "RAG 설계(테이블/인덱스) 뼈대 잡아줘",
    "Spring Boot API 설계부터 같이 정리하자",
    "FastAPI RAG 엔드포인트 예시 코드 만들어줘",
];
function mapConversations(data: any): Conversation[] {
    return (Array.isArray(data) ? data : []).map((c: any) => ({
        id: String(c.id),
        title: c.title ?? "대화",
        createdAt: c.createdAt ?? c.created_at,
        updatedAt: "방금",
    }));
}

function mapMessages(data: any): Message[] {
    return (Array.isArray(data) ? data : []).map((m: any) => ({
        id: String(m.id),
        role:
            String(m.role).toUpperCase() === "USER" || String(m.role).toLowerCase() === "user"
                ? "user"
                : "assistant",
        content: m.content ?? "",
    }));
}


export default function App() {
    const [activeId, setActiveId] = useState<string>("");
    const [ragDebug, setRagDebug] = useState(true);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messageMap, setMessageMap] = useState<Record<string, Message[]>>({});

    const [draft, setDraft] = useState("");
    const [isSending, setIsSending] = useState(false);

    const activeMessages = messageMap[activeId] ?? [];

    // 1) 대화 목록 로드
    useEffect(() => {
        fetchConversations()
            .then((data) => {
                const list = mapConversations(data);
                console.log("대화목록 API:", list);
                if (list.length > 0) {
                    setConversations(list);
                    setActiveId(list[0].id);
                }
            })
            .catch((err) => console.error("대화목록 API 에러:", err));
    }, []);

    // 2) activeId 바뀌면 메시지 로드
    useEffect(() => {
        if (!activeId) return;

        console.log("[activeId 변경] 메시지 불러오기:", activeId);

        fetchMessages(activeId)
            .then((data) => {
                console.log("[GET messages 응답]", data);

                const list = (Array.isArray(data) ? data : []).map((m: any) => ({
                    id: String(m.id),
                    role:
                        String(m.role).toUpperCase() === "USER" || String(m.role).toLowerCase() === "user"
                            ? "user"
                            : "assistant",
                    content: m.content ?? "",
                })) as Message[];

                setMessageMap((prev) => ({ ...prev, [activeId]: list }));
                console.log("[렌더용 메시지 list]", list);
            })
            .catch((err) => console.error("[GET messages 실패]", err));
    }, [activeId]);

    async function handleNewConversation() {
        try {
            // 1) 서버에 대화 생성
            await createConversation("새 대화");

            // 2) 대화 목록 다시 불러오기
            const list = await fetchConversations();

            // 3) 목록 갱신 + 가장 최근 대화로 이동(보통 첫 번째)
            if (list.length > 0) {
                setConversations(list);
                setActiveId(list[0].id);

                // 메시지 맵에 없으면 빈 배열로 준비 (UI 깨짐 방지)
                setMessageMap((prev) => ({ ...prev, [list[0].id]: prev[list[0].id] ?? [] }));
            }
        } catch (e) {
            console.error("새 대화 생성 실패:", e);
            alert("새 대화 생성 실패! (콘솔 확인)");
        }
    }
    async function handleSend(text?: string) {
        const content = (text ?? draft).trim();
        if (!content || isSending) return;

        // 서버 대화 id일 때만 전송 (seed 대화는 임시)
        const isServerId = /^\d+$/.test(activeId);
        if (!isServerId) {
            alert("서버에 저장하려면 '+ 새 대화'로 만든 대화(서버 id)에서 전송하세요.");
            return;
        }

        setIsSending(true);
        setDraft("");

        try {
            const data = await sendMessage(activeId, content);
            const list = mapMessages(data);
            setMessageMap((prev) => ({ ...prev, [activeId]: list }));
        } catch (e) {
            console.error("메시지 전송 실패:", e);
            alert("메시지 전송 실패 (콘솔 확인)");
        } finally {
            setIsSending(false);
        }
    }
    function handleDeleteConversation(id: string) {
        if (!window.confirm("이 대화를 삭제할까요?")) return;

        setConversations((prev) => prev.filter((c) => c.id !== id));

        setMessageMap((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });

        // 만약 보고 있던 대화를 삭제했으면 다른 대화로 이동
        if (id === activeId) {
            const remain = conversations.filter((c) => c.id !== id);
            if (remain.length > 0) {
                setActiveId(remain[0].id);
            }
        }
    }
    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        // Enter = 전송, Shift+Enter = 줄바꿈
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className="app">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="brand">
                    <img className="brand__banner" src={banner} alt="Alpha banner" />
                    <div className="brand__subLabel">LLM Platform</div>
                </div>

                <button className="btn btn--primary" type="button" onClick={handleNewConversation}>
                    + 새 대화
                </button>

                <div className="sectionTitle">대화</div>
                <div className="convList">
                    {conversations.map((c) => (
                        <div
                            key={c.id}
                            className={clsx("convItem", c.id === activeId && "isActive")}
                            onClick={() => setActiveId(c.id)}
                        >
                            <div className="convItem__main">
                                <div className="convItem__title">{c.title}</div>
                                <div className="convItem__meta">{c.updatedAt}</div>
                            </div>

                            <button
                                className="convItem__more"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteConversation(c.id);
                                }}
                            >
                                ⋯
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main */}
            <main className="main">
                <header className="topbar">
                    <div className="topbar__left">
                        <div className="topbar__title">
                            {conversations.find((c) => c.id === activeId)?.title ?? "대화"}
                        </div>
                        <div className="topbar__hint">Spring API 연결은 다음 단계에서 붙임</div>
                    </div>

                    <div className="topbar__right">
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={ragDebug}
                                onChange={(e) => setRagDebug(e.target.checked)}
                            />
                            <span>RAG 디버그</span>
                        </label>
                        <button className="btn" type="button">
                            설정
                        </button>
                    </div>
                </header>

                <div className={clsx("content", ragDebug && "withDebug")}>
                    {/* Messages */}
                    <section className="chat">
                        <div className="chat__inner">
                            {activeMessages.length === 0 ? (
                                <div className="empty">
                                    <div className="empty__title">새 대화를 시작해볼까요?</div>
                                    <div className="empty__desc">추천 프롬프트로 바로 시작할 수 있어요.</div>

                                    <div className="presetGrid">
                                        {promptPresets.map((p) => (
                                            <button
                                                key={p}
                                                className="preset"
                                                type="button"
                                                onClick={() => handleSend(p)}
                                                disabled={isSending}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                activeMessages.map((m) => (
                                    <div
                                        key={m.id}
                                        className={clsx("msg", m.role === "user" ? "msg--user" : "msg--assistant")}
                                    >
                                        <div className="msg__role">{m.role === "user" ? "YOU" : "ALPHA"}</div>
                                        <div className="msg__bubble">{m.content}</div>
                                    </div>
                                ))
                            )}

                            {/* typing/전송 중 표시 */}
                            {isSending && (
                                <div className="msg msg--assistant">
                                    <div className="msg__role">ALPHA</div>
                                    <div className="msg__bubble msg__bubble--typing">생성 중…</div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Debug panel */}
                    {ragDebug && (
                        <aside className="debug">
                            <div className="debug__title">RAG 컨텍스트(예시)</div>

                            <div className="debug__card">
                                <div className="debug__meta">chunk #12 · score 0.82</div>
                                <div className="debug__text">knowledge_chunk.content 일부가 여기에 표시됩니다.</div>
                            </div>

                            <div className="debug__card">
                                <div className="debug__meta">chunk #3 · score 0.74</div>
                                <div className="debug__text">
                                    검색된 상위 chunk들을 LLM 프롬프트에 포함하는 구조로 연결합니다.
                                </div>
                            </div>
                        </aside>
                    )}
                </div>

                {/* Input */}
                <footer className="composer">
                    <div className="composer__inner">
            <textarea
                className="composer__input"
                placeholder="메시지를 입력하세요… (Enter: 전송, Shift+Enter: 줄바꿈)"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isSending}
            />
                        <button
                            className="btn btn--send"
                            type="button"
                            onClick={() => handleSend()}
                            disabled={isSending || !draft.trim()}
                            title={isSending ? "응답 생성 중…" : "전송"}
                        >
                            {isSending ? "전송 중" : "전송"}
                        </button>
                    </div>

                    <div className="composer__footnote">
                        ※ 다음 단계: Spring 백엔드(대화/메시지 API) 붙이고 실제 응답 저장하기
                    </div>
                </footer>
            </main>
        </div>
    );
}
