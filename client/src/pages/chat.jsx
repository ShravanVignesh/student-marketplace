import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useSocket } from "../hooks/useSocket.js";

export default function Chat() {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket, connected } = useSocket(user);

    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);

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

    // Load conversations
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/api/chat");
                setConversations(res.data.conversations || []);
            } catch (err) {
                console.error("Failed to load conversations:", err);
            } finally {
                setLoadingConvos(false);
            }
        })();
    }, []);

    // Load messages when conversation changes
    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            return;
        }
        (async () => {
            setLoadingMsgs(true);
            try {
                const res = await api.get(`/api/chat/${conversationId}/messages`);
                setMessages(res.data.messages || []);
            } catch (err) {
                console.error("Failed to load messages:", err);
            } finally {
                setLoadingMsgs(false);
            }
        })();

        // Join room for this conversation
        if (socket) {
            socket.emit("join-room", conversationId);
        }
    }, [conversationId, socket]);

    // Listen for new messages
    useEffect(() => {
        if (!socket) return;

        const handler = (msg) => {
            // Add message if it belongs to the active conversation
            if (msg.conversation === conversationId) {
                setMessages((prev) => {
                    // Prevent duplicates
                    if (prev.some((m) => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
            }

            // Update conversation list — move to top and update lastMessage
            setConversations((prev) => {
                const updated = prev.map((c) => {
                    if (c._id === msg.conversation) {
                        return { ...c, lastMessage: msg.text, updatedAt: new Date().toISOString() };
                    }
                    return c;
                });
                // Sort by updatedAt desc
                updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                return updated;
            });
        };

        socket.on("new-message", handler);
        return () => socket.off("new-message", handler);
    }, [socket, conversationId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function handleSend(e) {
        e.preventDefault();
        if (!text.trim() || !socket || !conversationId || sending) return;

        setSending(true);
        socket.emit("send-message", { conversationId, text: text.trim() }, (res) => {
            setSending(false);
            if (res?.error) {
                console.error("Send error:", res.error);
                return;
            }
            setText("");
        });
    }

    // Get the other participant's name
    function getOtherUser(conv) {
        if (!conv?.participants || !user) return { name: "Unknown" };
        return conv.participants.find((p) => p._id !== user._id) || { name: "Unknown" };
    }

    function formatTime(dateStr) {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) {
            return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        } else if (diffDays === 1) {
            return "Yesterday";
        } else if (diffDays < 7) {
            return d.toLocaleDateString("en-GB", { weekday: "short" });
        }
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }

    const activeConvo = conversations.find((c) => c._id === conversationId);

    return (
        <div className="chat-page">
            {/* Sidebar — Conversation List */}
            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <h3>Messages</h3>
                    <div className={`chat-status-dot ${connected ? "online" : ""}`} title={connected ? "Connected" : "Disconnected"} />
                </div>

                {loadingConvos ? (
                    <div className="chat-sidebar-empty">Loading...</div>
                ) : conversations.length === 0 ? (
                    <div className="chat-sidebar-empty">
                        <p>No conversations yet</p>
                        <Link to="/listings" style={{ fontSize: "0.85rem" }}>Browse listings to start chatting</Link>
                    </div>
                ) : (
                    <div className="chat-convo-list">
                        {conversations.map((c) => {
                            const other = getOtherUser(c);
                            const listingImg = c.listing?.images?.[0] ? fileUrl(c.listing.images[0]) : "";
                            const isActive = c._id === conversationId;

                            return (
                                <div
                                    key={c._id}
                                    className={`chat-convo-item ${isActive ? "active" : ""}`}
                                    onClick={() => navigate(`/chat/${c._id}`)}
                                >
                                    <div className="chat-convo-avatar">
                                        {listingImg ? (
                                            <img src={listingImg} alt="" />
                                        ) : (
                                            <span>📦</span>
                                        )}
                                    </div>
                                    <div className="chat-convo-info">
                                        <div className="chat-convo-top">
                                            <span className="chat-convo-name">{other.name}</span>
                                            <span className="chat-convo-time">{formatTime(c.updatedAt)}</span>
                                        </div>
                                        <div className="chat-convo-listing-title">
                                            {c.listing?.title || "Listing"}
                                        </div>
                                        <div className="chat-convo-preview">
                                            {c.lastMessage || "No messages yet"}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Main — Message Panel */}
            <div className="chat-main">
                {!conversationId ? (
                    <div className="chat-empty-state">
                        <div style={{ fontSize: "3rem" }}>💬</div>
                        <h3>Select a conversation</h3>
                        <p>Choose a conversation from the sidebar to start chatting</p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <h4>{getOtherUser(activeConvo)?.name || "Chat"}</h4>
                                {activeConvo?.listing && (
                                    <Link to={`/listings/${activeConvo.listing._id}`} className="chat-header-listing">
                                        Re: {activeConvo.listing.title} — £{activeConvo.listing.price}
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="chat-messages">
                            {loadingMsgs ? (
                                <div className="chat-empty-state">Loading messages...</div>
                            ) : messages.length === 0 ? (
                                <div className="chat-empty-state">
                                    <p>No messages yet. Say hello! 👋</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
                                    return (
                                        <div key={msg._id} className={`chat-bubble-row ${isMine ? "mine" : "theirs"}`}>
                                            <div className={`chat-bubble ${isMine ? "mine" : "theirs"}`}>
                                                <p>{msg.text}</p>
                                                <span className="chat-bubble-time">
                                                    {formatTime(msg.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form className="chat-input-bar" onSubmit={handleSend}>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="chat-input"
                                autoFocus
                            />
                            <button type="submit" disabled={!text.trim() || sending} className="chat-send-btn">
                                {sending ? "..." : "Send"}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
