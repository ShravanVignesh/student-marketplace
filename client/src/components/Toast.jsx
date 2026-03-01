import { useState, useEffect, useCallback } from "react";

let addToastExternal = null;

export function useToast() {
    return { toast: (message, type = "success") => addToastExternal?.(message, type) };
}

export default function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "success") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, exiting: false }]);
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 300);
        }, 3000);
    }, []);

    useEffect(() => { addToastExternal = addToast; }, [addToast]);

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: "fixed", bottom: "24px", right: "24px", zIndex: 10000,
            display: "flex", flexDirection: "column", gap: "8px"
        }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    padding: "12px 20px",
                    borderRadius: "10px",
                    color: "white",
                    fontWeight: 500,
                    fontSize: "0.9rem",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    animation: t.exiting ? "toastOut 0.3s ease forwards" : "toastIn 0.3s ease forwards",
                    background: t.type === "success" ? "var(--success-color)"
                        : t.type === "error" ? "var(--danger-color)"
                            : "var(--primary-color)",
                    display: "flex", alignItems: "center", gap: "8px",
                }}>
                    <span>{t.type === "success" ? "✓" : t.type === "error" ? "✗" : "ℹ"}</span>
                    {t.message}
                </div>
            ))}
        </div>
    );
}
