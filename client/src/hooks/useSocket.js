import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useSocket(user) {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!user) {
            setSocket((prev) => {
                if (prev) prev.disconnect();
                return null;
            });
            setConnected(false);
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) return;

        const s = io(SERVER_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
        });

        s.on("connect", () => {
            setConnected(true);
            s.emit("join-conversations");
        });

        s.on("disconnect", () => {
            setConnected(false);
        });

        s.on("connect_error", (err) => {
            console.error("Socket connection error:", err.message);
            setConnected(false);
        });

        setSocket(s);

        return () => {
            s.disconnect();
            setSocket(null);
            setConnected(false);
        };
    }, [user]);

    return { socket, connected };
}
