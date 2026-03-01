import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useSocket } from "../hooks/useSocket.js";

export default function ChatWidget() {
    const { user } = useAuth();
    const { socket } = useSocket(user);

    const [open, setOpen] = useState(false);
    const [view, setView] = useState("list");
    const [conversations, setConversations] = useState([]);
    const [activeConvoId, setActiveConvoId] = useState(null);
    const [directConvo, setDirectConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loadingConvos, setLoadingConvos] = useState(false);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);
    const [unread, setUnread] = useState(0);
    const [msgMenu, setMsgMenu] = useState(null);
    const [convoMenu, setConvoMenu] = useState(null);

    // New Feature States
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [showScrollBottom, setShowScrollBottom] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Track active state in refs for socket handler
    const activeConvoRef = useRef(null);
    const openRef = useRef(false);
    const viewRef = useRef("list");

    useEffect(() => { activeConvoRef.current = activeConvoId; }, [activeConvoId]);
    useEffect(() => { openRef.current = open; }, [open]);
    useEffect(() => { viewRef.current = view; }, [view]);

    const serverBase = useMemo(() => {
        const base = api?.defaults?.baseURL || "";
        return base.endsWith("/") ? base.slice(0, -1) : base;
    }, []);

    function fileUrl(path) {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        return `${serverBase}${path}`;
    }

    const loadMessages = useCallback(async (convoId) => {
        if (!convoId) return;
        setLoadingMsgs(true);
        try {
            const res = await api.get(`/api/chat/${convoId}/messages`);
            setMessages(res.data.messages || []);
        } catch (err) {
            console.error("Failed to load messages:", err);
        } finally {
            setLoadingMsgs(false);
        }
        if (socket) {
            socket.emit("join-room", convoId);
            socket.emit("mark-read", { conversationId: convoId });
        }
    }, [socket]);

    const loadConversations = useCallback(async () => {
        setLoadingConvos(true);
        try {
            const res = await api.get("/api/chat");
            setConversations((prev) => {
                const unreadMap = {};
                prev.forEach((c) => {
                    if (c.unreadMsgs) unreadMap[c._id] = c.unreadMsgs;
                });
                return (res.data.conversations || []).map((c) => ({
                    ...c,
                    unreadMsgs: unreadMap[c._id] || 0,
                }));
            });
        } catch (err) {
            console.error("Failed to load conversations:", err);
        } finally {
            setLoadingConvos(false);
        }
    }, []);

    useEffect(() => {
        if (!open || !user) return;
        loadConversations();
    }, [open, user, loadConversations]);

    // Socket event listeners — use refs for current state to avoid stale closures
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg) => {
            const isActiveChat = msg.conversation === activeConvoRef.current
                && openRef.current && viewRef.current === "chat";

            if (isActiveChat) {
                setMessages((prev) => {
                    if (prev.some((m) => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
                // Mark read immediately if we are actively viewing
                socket.emit("mark-read", { conversationId: msg.conversation });
            } else {
                // Not viewing this conversation — increment unread
                setUnread((prev) => prev + 1);
            }

            setConversations((prev) => {
                const exists = prev.some(c => c._id === msg.conversation);
                if (!exists) {
                    // Chat is missing from the list (it's new or was deleted).
                    // Trigger a reload of conversations to fetch it.
                    setTimeout(() => loadConversations(), 0);
                    return prev;
                }

                const updated = prev.map((c) => {
                    if (c._id === msg.conversation) {
                        return {
                            ...c,
                            lastMessage: msg.text,
                            updatedAt: new Date().toISOString(),
                            unreadMsgs: isActiveChat ? 0 : (c.unreadMsgs || 0) + 1,
                        };
                    }
                    return c;
                });
                updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                return updated;
            });
        };

        const handleMessageDeleted = ({ messageId }) => {
            setMessages((prev) => prev.filter((m) => m._id !== messageId));
        };

        const handleTyping = ({ conversationId, sender }) => {
            if (activeConvoRef.current === conversationId) {
                setTypingUsers(prev => new Set(prev).add(sender));
                scrollToBottomIfNear();
            }
        };

        const handleStopTyping = ({ conversationId, sender }) => {
            if (activeConvoRef.current === conversationId) {
                setTypingUsers(prev => {
                    const next = new Set(prev);
                    next.delete(sender);
                    return next;
                });
            }
        };

        const handleMessagesRead = ({ conversationId, readBy }) => {
            if (activeConvoRef.current === conversationId) {
                setMessages(prev => prev.map(m => {
                    // If the other user read our messages
                    if (m.sender?._id !== readBy && m.sender !== readBy) {
                        return { ...m, read: true };
                    }
                    return m;
                }));
            }
        };

        socket.on("new-message", handleNewMessage);
        socket.on("message-deleted", handleMessageDeleted);
        socket.on("typing", handleTyping);
        socket.on("stop-typing", handleStopTyping);
        socket.on("messages-read", handleMessagesRead);

        return () => {
            socket.off("new-message", handleNewMessage);
            socket.off("message-deleted", handleMessageDeleted);
            socket.off("typing", handleTyping);
            socket.off("stop-typing", handleStopTyping);
            socket.off("messages-read", handleMessagesRead);
        };
    }, [socket]);

    const scrollToBottomIfNear = () => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        // If within 150px of bottom, auto scroll down
        if (scrollHeight - scrollTop - clientHeight < 150) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottomIfNear();
    }, [messages, typingUsers]);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent("chat-unread-count", { detail: unread }));
    }, [unread]);

    async function openConversation(convoId) {
        setActiveConvoId(convoId);
        setView("chat");
        setMsgMenu(null);
        setConvoMenu(null);
        setTypingUsers(new Set());
        setShowScrollBottom(false);

        // Clear unread badge for this conversation
        setConversations(prev => prev.map(c =>
            c._id === convoId ? { ...c, unreadMsgs: 0 } : c
        ));

        await loadMessages(convoId);

        // Focus textarea after opening
        setTimeout(() => textareaRef.current?.focus(), 100);
    }

    useEffect(() => {
        function handleOpenChat(e) {
            const { conversationId, conversation } = e.detail;
            if (conversation) setDirectConvo(conversation);
            setOpen(true);
            openConversation(conversationId);
        }
        window.addEventListener("open-chat", handleOpenChat);
        return () => window.removeEventListener("open-chat", handleOpenChat);
    }, [loadMessages]);

    const emitTyping = () => {
        if (!socket || !activeConvoId) return;
        socket.emit("typing", { conversationId: activeConvoId });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stop-typing", { conversationId: activeConvoId });
        }, 2000);
    };

    const handleTextChange = (e) => {
        setText(e.target.value);
        emitTyping();

        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
        }
    };

    const resetTextarea = () => {
        setText("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
        if (socket && activeConvoId) {
            socket.emit("stop-typing", { conversationId: activeConvoId });
        }
    };

    function handleSend(e) {
        if (e) e.preventDefault();
        if (!text.trim() || !socket || !activeConvoId || sending) return;
        setSending(true);
        socket.emit("send-message", { conversationId: activeConvoId, text: text.trim() }, (res) => {
            setSending(false);
            if (res?.error) { console.error("Send error:", res.error); return; }
            resetTextarea();
        });
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    function handleUnsend(msgId) {
        if (!socket) return;
        socket.emit("delete-message", { messageId: msgId }, (res) => {
            if (res?.error) console.error("Unsend error:", res.error);
        });
        setMsgMenu(null);
    }

    function handleDeleteConversation(convoId) {
        if (!socket) return;
        socket.emit("delete-conversation", { conversationId: convoId }, (res) => {
            if (res?.error) { console.error("Delete conversation error:", res.error); return; }
            setConversations((prev) => prev.filter((c) => c._id !== convoId));
            if (activeConvoId === convoId) setView("list");
        });
        setConvoMenu(null);
    }

    function getOtherUser(conv) {
        if (!conv?.participants || !user) return { name: "Unknown" };
        return conv.participants.find((p) => p._id !== user._id) || { name: "Unknown" };
    }

    // Always show HH:MM for messages
    function formatMsgTime(dateStr) {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    }

    // Format day label for separator
    function formatDayLabel(dateStr) {
        const d = new Date(dateStr);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diffDays = Math.floor((today - msgDay) / 86400000);

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    }

    // Check if we need a day separator before this message
    function needsDaySeparator(idx) {
        if (idx === 0) return true;
        const prev = new Date(messages[idx - 1].createdAt);
        const curr = new Date(messages[idx].createdAt);
        return prev.toDateString() !== curr.toDateString();
    }

    // Format time for conversation list
    function formatConvoTime(dateStr) {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now - d) / 86400000);
        if (diffDays === 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return d.toLocaleDateString("en-GB", { weekday: "short" });
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight > 100) {
            setShowScrollBottom(true);
        } else {
            setShowScrollBottom(false);
        }
        setMsgMenu(null);
    };

    useEffect(() => {
        if (!msgMenu && !convoMenu) return;
        const handler = () => { setMsgMenu(null); setConvoMenu(null); };
        window.addEventListener("click", handler);
        return () => window.removeEventListener("click", handler);
    }, [msgMenu, convoMenu]);

    if (!user) return null;

    const activeConvo = conversations.find((c) => c._id === activeConvoId) || directConvo;
    const isOtherTyping = typingUsers.size > 0;

    return (
        <>
            <button
                className="chatbox-fab"
                onClick={() => {
                    if (!open) {
                        setUnread(0);
                        setView("list");
                        setActiveConvoId(null);
                        setDirectConvo(null);
                        setMsgMenu(null);
                        setConvoMenu(null);
                        loadConversations();
                    }
                    setOpen(!open);
                }}
                title="Messages"
            >
                💬
                {unread > 0 && <span className="chatbox-badge">{unread > 9 ? "9+" : unread}</span>}
            </button>

            {open && (
                <div className="chatbox-panel">
                    <div className="chatbox-header">
                        {view === "chat" && (
                            <button
                                className="chatbox-back-btn"
                                onClick={() => {
                                    setView("list");
                                    setActiveConvoId(null);
                                    setDirectConvo(null);
                                    setMsgMenu(null);
                                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                                    if (socket && activeConvoId) socket.emit("stop-typing", { conversationId: activeConvoId });
                                    loadConversations();
                                }}
                            >
                                ←
                            </button>
                        )}
                        <div className="chatbox-header-title">
                            {view === "list" ? (
                                <>
                                    Messages
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
                        <button className="chatbox-close-btn" onClick={() => { setOpen(false); setMsgMenu(null); setConvoMenu(null); }}>×</button>
                    </div>

                    {view === "list" ? (
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
                                        <div key={c._id} className="chatbox-convo-item">
                                            <div className="chatbox-convo-clickable" onClick={() => openConversation(c._id)}>
                                                <div className="chatbox-convo-avatar">
                                                    {listingImg ? <img src={listingImg} alt="" /> : <span>📦</span>}
                                                </div>
                                                <div className="chatbox-convo-info">
                                                    <div className="chatbox-convo-top">
                                                        <span className="chatbox-convo-name">
                                                            {other.name}
                                                            {c.unreadMsgs > 0 && (
                                                                <span className="chatbox-convo-badge">{c.unreadMsgs > 9 ? "9+" : c.unreadMsgs}</span>
                                                            )}
                                                        </span>
                                                        <span className="chatbox-convo-time">{formatConvoTime(c.updatedAt)}</span>
                                                    </div>
                                                    <div className="chatbox-convo-listing">{c.listing?.title || "Listing"}</div>
                                                    <div className="chatbox-convo-preview">{c.lastMessage || "No messages yet"}</div>
                                                </div>
                                            </div>
                                            <div className="chatbox-convo-actions">
                                                <button
                                                    className="chatbox-dots-btn"
                                                    onClick={(e) => { e.stopPropagation(); setConvoMenu(convoMenu === c._id ? null : c._id); }}
                                                >⋮</button>
                                                {convoMenu === c._id && (
                                                    <div className="chatbox-dropdown" onClick={(e) => e.stopPropagation()}>
                                                        <button onClick={() => {
                                                            if (confirm("Delete this conversation? This cannot be undone.")) handleDeleteConversation(c._id);
                                                        }}>🗑 Delete conversation</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative' }}>
                            <div className="chatbox-messages" ref={messagesContainerRef} onScroll={handleScroll}>
                                {loadingMsgs ? (
                                    <div className="chatbox-empty">Loading...</div>
                                ) : messages.length === 0 ? (
                                    <div className="chatbox-empty">Say hello! 👋</div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
                                        const showDay = needsDaySeparator(idx);
                                        return (
                                            <div key={msg._id}>
                                                {showDay && (
                                                    <div className="chatbox-day-separator">
                                                        <span>{formatDayLabel(msg.createdAt)}</span>
                                                    </div>
                                                )}
                                                <div className={`chatbox-bubble-row ${isMine ? "mine" : "theirs"}`}>
                                                    <div className={`chatbox-bubble ${isMine ? "mine" : "theirs"}`}>
                                                        <p style={{ whiteSpace: "pre-wrap", margin: 0, wordBreak: "break-word" }}>{msg.text}</p>
                                                        <div className="chatbox-bubble-meta">
                                                            <span className="chatbox-bubble-time">{formatMsgTime(msg.createdAt)}</span>
                                                            {isMine && (
                                                                <span className="chatbox-read-receipt" title={msg.read ? "Read" : "Sent"}>
                                                                    {msg.read ? "✓✓" : "✓"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isMine && (
                                                        <div className="chatbox-msg-actions">
                                                            <button
                                                                className="chatbox-dots-btn small"
                                                                onClick={(e) => { e.stopPropagation(); setMsgMenu(msgMenu === msg._id ? null : msg._id); }}
                                                            >⋮</button>
                                                            {msgMenu === msg._id && (
                                                                <div className="chatbox-dropdown msg-dropdown" onClick={(e) => e.stopPropagation()}>
                                                                    <button onClick={() => handleUnsend(msg._id)}>↩ Unsend</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                {isOtherTyping && (
                                    <div className="chatbox-typing-indicator">
                                        <div className="typing-dots">
                                            <span></span><span></span><span></span>
                                        </div>
                                        <span className="typing-text">{getOtherUser(activeConvo)?.name} is typing...</span>
                                    </div>
                                )}

                                <div ref={messagesEndRef} style={{ height: 1 }} />
                            </div>

                            {showScrollBottom && (
                                <button
                                    className="chatbox-scroll-bottom"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                                    }}
                                >
                                    ↓
                                </button>
                            )}

                            <form className="chatbox-input-bar" onSubmit={handleSend}>
                                <textarea
                                    ref={textareaRef}
                                    placeholder="Type a message..."
                                    value={text}
                                    onChange={handleTextChange}
                                    onKeyDown={handleKeyDown}
                                    className="chatbox-textarea"
                                    rows="1"
                                    autoFocus
                                />
                                <button type="submit" disabled={!text.trim() || sending} className="chatbox-send-btn">
                                    ➤
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
