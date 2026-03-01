import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useSocket } from "../hooks/useSocket.js";

export default function ChatWidget() {
    const { user } = useAuth();
    const { socket, connected } = useSocket(user);

    const [open, setOpen] = useState(false);
    const [view, setView] = useState("list"); // "list" or "chat"
    const [conversations, setConversations] = useState([]);
    const [activeConvoId, setActiveConvoId] = useState(null);
    const [directConvo, setDirectConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loadingConvos, setLoadingConvos] = useState(false);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);
    const [unread, setUnread] = useState(0);

    const messagesEndRef = useRef(null);

    const serverBase = useMemo(() => {
        const base = api?.defaults?.baseURL || "";
        return base.endsWith("/") ? base.slice(0, -1) : base;
    }, []);

    function fileUrl(path) {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        return `${serverBase}${path}`;
    }

    // Load conversations when widget opens
    useEffect(() => {
        if (!open || !user) return;
        (async () => {
            setLoadingConvos(true);
            try {
                const res = await api.get("/api/chat");
                setConversations(res.data.conversations || []);
            } catch (err) {
                console.error("Failed to load conversations:", err);
            } finally {
                setLoadingConvos(false);
            }
        })();
    }, [open, user]);

    // Load messages when switching to a conversation
    useEffect(() => {
        if (!activeConvoId) return;
        (async () => {
            setLoadingMsgs(true);
            try {
                const res = await api.get(`/api/chat/${activeConvoId}/messages`);
                setMessages(res.data.messages || []);
            } catch (err) {
                console.error("Failed to load messages:", err);
            } finally {
                setLoadingMsgs(false);
            }
        })();
        if (socket) socket.emit("join-room", activeConvoId);
    }, [activeConvoId, socket]);

    // Listen for new messages
    useEffect(() => {
        if (!socket) return;

        const handler = (msg) => {
            if (msg.conversation === activeConvoId) {
                setMessages((prev) => {
                    if (prev.some((m) => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
            } else if (!open || view !== "chat" || msg.conversation !== activeConvoId) {
                // Increment unread for messages not in the active view
                setUnread((prev) => prev + 1);
            }

            setConversations((prev) => {
                const updated = prev.map((c) =>
                    c._id === msg.conversation
                        ? { ...c, lastMessage: msg.text, updatedAt: new Date().toISOString() }
                        : c
                );
                updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                return updated;
            });
        };

        socket.on("new-message", handler);
        return () => socket.off("new-message", handler);
    }, [socket, activeConvoId, open, view]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function openConversation(convoId) {
        setActiveConvoId(convoId);
        setView("chat");
        setMessages([]);
    }

    // Public method: open widget with a specific conversation
    // This gets called from the event system
    useEffect(() => {
        function handleOpenChat(e) {
            const { conversationId, conversation } = e.detail;
            if (conversation) setDirectConvo(conversation);
            setOpen(true);
            openConversation(conversationId);
        }
        window.addEventListener("open-chat", handleOpenChat);
        return () => window.removeEventListener("open-chat", handleOpenChat);
    }, []);

    function handleSend(e) {
        e.preventDefault();
        if (!text.trim() || !socket || !activeConvoId || sending) return;

        setSending(true);
        socket.emit("send-message", { conversationId: activeConvoId, text: text.trim() }, (res) => {
            setSending(false);
            if (res?.error) {
                console.error("Send error:", res.error);
                return;
            }
            setText("");
        });
    }

    function getOtherUser(conv) {
        if (!conv?.participants || !user) return { name: "Unknown" };
        return conv.participants.find((p) => p._id !== user._id) || { name: "Unknown" };
    }

    function formatTime(dateStr) {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now - d) / 86400000);
        if (diffDays === 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return d.toLocaleDateString("en-GB", { weekday: "short" });
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }

    // Don't render if not logged in
    if (!user) return null;

    const activeConvo = conversations.find((c) => c._id === activeConvoId) || directConvo;

    return (
        <>
            {/* Floating button */}
            <button
                className="chatbox-fab"
                onClick={() => {
                    setOpen(!open);
                    if (!open) setUnread(0);
                }}
                title="Messages"
            >
                💬
                {unread > 0 && <span className="chatbox-badge">{unread > 9 ? "9+" : unread}</span>}
            </button>

            {/* Chatbox panel */}
            {open && (
                <div className="chatbox-panel">
                    {/* Header */}
                    <div className="chatbox-header">
                        {view === "chat" && (
                            <button
                                className="chatbox-back-btn"
                                onClick={() => {
                                    setView("list");
                                    setActiveConvoId(null);
                                    setDirectConvo(null);
                                }}
                            >
                                ←
                            </button>
                        )}
                        <div className="chatbox-header-title">
                            {view === "list" ? (
                                <>
                                    Messages
                                    <span className={`chatbox-dot ${connected ? "online" : ""}`} />
                                </>
                            ) : (
                                <>
                                    <span>{getOtherUser(activeConvo)?.name || "Chat"}</span>
                                    {activeConvo?.listing && (
                                        <Link
                                            to={`/listings/${activeConvo.listing._id}`}
                                            className="chatbox-listing-link"
                                            onClick={() => setOpen(false)}
                                        >
                                            {activeConvo.listing.title}
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                        <button className="chatbox-close-btn" onClick={() => setOpen(false)}>×</button>
                    </div>

                    {/* Body */}
                    {view === "list" ? (
                        /* Conversation list */
                        <div className="chatbox-body">
                            {loadingConvos ? (
                                <div className="chatbox-empty">Loading...</div>
                            ) : conversations.length === 0 ? (
                                <div className="chatbox-empty">
                                    <p>No conversations yet</p>
                                    <Link to="/listings" onClick={() => setOpen(false)} style={{ fontSize: "0.82rem" }}>
                                        Browse listings
                                    </Link>
                                </div>
                            ) : (
                                conversations.map((c) => {
                                    const other = getOtherUser(c);
                                    const listingImg = c.listing?.images?.[0] ? fileUrl(c.listing.images[0]) : "";
                                    return (
                                        <div
                                            key={c._id}
                                            className="chatbox-convo-item"
                                            onClick={() => openConversation(c._id)}
                                        >
                                            <div className="chatbox-convo-avatar">
                                                {listingImg ? <img src={listingImg} alt="" /> : <span>📦</span>}
                                            </div>
                                            <div className="chatbox-convo-info">
                                                <div className="chatbox-convo-top">
                                                    <span className="chatbox-convo-name">{other.name}</span>
                                                    <span className="chatbox-convo-time">{formatTime(c.updatedAt)}</span>
                                                </div>
                                                <div className="chatbox-convo-listing">{c.listing?.title || "Listing"}</div>
                                                <div className="chatbox-convo-preview">{c.lastMessage || "No messages yet"}</div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        /* Message view */
                        <>
                            <div className="chatbox-messages">
                                {loadingMsgs ? (
                                    <div className="chatbox-empty">Loading...</div>
                                ) : messages.length === 0 ? (
                                    <div className="chatbox-empty">Say hello! 👋</div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
                                        return (
                                            <div key={msg._id} className={`chatbox-bubble-row ${isMine ? "mine" : "theirs"}`}>
                                                <div className={`chatbox-bubble ${isMine ? "mine" : "theirs"}`}>
                                                    <p>{msg.text}</p>
                                                    <span className="chatbox-bubble-time">{formatTime(msg.createdAt)}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="chatbox-input-bar" onSubmit={handleSend}>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="chatbox-input"
                                    autoFocus
                                />
                                <button type="submit" disabled={!text.trim() || sending} className="chatbox-send-btn">
                                    ➤
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
