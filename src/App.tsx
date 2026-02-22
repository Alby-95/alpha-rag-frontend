import React, { useMemo, useState } from "react";
import banner from "./assets/alpha-banner.png";

type Conversation = {
    id: string;
    title: string;
    updatedAt: string;
};

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

function clsx(...v: Array<string | false | null | undefined>) {
    return v.filter(Boolean).join(" ");
}

function makeId(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const seedConversations: Conversation[] = [
    { id: "c1", title: "RAG 설계", updatedAt: "방금" },
    { id: "c2", title: "Spring 구조", updatedAt: "오늘" },
    { id: "c3", title: "면접 준비", updatedAt: "어제" },
];

// c1만 메시지 넣고, c2/c3는 비워서 Empty state가 보이게 해둠
const seedMessageMap: Record<string, Message[]> = {
    c1: [
        { id: "m1", role: "assistant", content: "안녕하세요! 무엇을 도와드릴까요?" },
        { id: "m2", role: "user", content: "뤼튼 같은 UI 먼저 만들고 싶어." },
        {
            id: "m3",
            role: "assistant",
            content: "좋아요. 사이드바/채팅/입력창부터 잡아볼게요.",
        },
    ],
    c2: [],
    c3: [],
};

const promptPresets = [
    "RAG 설계(테이블/인덱스) 뼈대 잡아줘",
    "Spring Boot API 설계부터 같이 정리하자",
    "FastAPI RAG 엔드포인트 예시 코드 만들어줘",
];

export default function App() {
    const [activeId, setActiveId] = useState(seedConversations[0].id);
    const [ragDebug, setRagDebug] = useState(true);

    const [conversations, setConversations] = useState<Conversation[]>(seedConversations);
    const [messageMap, setMessageMap] = useState<Record<string, Message[]>>(seedMessageMap);

    const activeMessages = messageMap[activeId] ?? [];

    const [draft, setDraft] = useState("");
    const [isSending, setIsSending] = useState(false);

    function pushMessage(conversationId: string, msg: Message) {
        setMessageMap((prev) => {
            const next = { ...prev };
            next[conversationId] = [...(next[conversationId] ?? []), msg];
            return next;
        });
    }

    function handleSend(text?: string) {
        const content = (text ?? draft).trim();
        if (!content || isSending) return;

        setIsSending(true);

        const userMsg: Message = { id: makeId("u"), role: "user", content };
        pushMessage(activeId, userMsg);
        setDraft("");

        // TODO: 다음 단계에서 Spring API 호출로 교체
        window.setTimeout(() => {
            const botMsg: Message = {
                id: makeId("a"),
                role: "assistant",
                content: "좋아요. 다음 단계에서 Spring API 붙여서 실제로 저장/응답 처리할게요.",
            };
            pushMessage(activeId, botMsg);
            setIsSending(false);
        }, 650);
    }
    function handleNewConversation() {
        const newId = makeId("c");

        const newConv: Conversation = {
            id: newId,
            title: "새 대화",
            updatedAt: "방금",
        };

        // 목록 맨 위에 추가
        setConversations((prev) => [newConv, ...prev]);

        // 메시지 목록 초기화
        setMessageMap((prev) => ({ ...prev, [newId]: [] }));

        // 새 대화로 이동
        setActiveId(newId);

        // 입력창 포커스는 조금 있다가 (렌더 끝난 후)
        window.setTimeout(() => {
            const el = document.querySelector<HTMLTextAreaElement>(".composer__input");
            el?.focus();
        }, 0);
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
