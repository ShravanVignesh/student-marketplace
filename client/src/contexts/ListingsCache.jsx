import { createContext, useContext, useRef } from "react";

const PageCacheContext = createContext(null);

const STALE_MS = 60_000; // 1 minute

export function PageCacheProvider({ children }) {
    // Map of key -> { data, timestamp }
    const cache = useRef({});

    return (
        <PageCacheContext.Provider value={cache}>
            {children}
        </PageCacheContext.Provider>
    );
}

export function usePageCache() {
    const cacheRef = useContext(PageCacheContext);
    if (!cacheRef) throw new Error("usePageCache must be inside PageCacheProvider");

    function get(key) {
        const entry = cacheRef.current[key];
        if (entry && Date.now() - entry.timestamp < STALE_MS) {
            return entry.data;
        }
        return null;
    }

    function set(key, data) {
        cacheRef.current[key] = { data, timestamp: Date.now() };
    }

    function invalidate(key) {
        if (key) {
            delete cacheRef.current[key];
        } else {
            cacheRef.current = {};
        }
    }

    return { get, set, invalidate };
}
