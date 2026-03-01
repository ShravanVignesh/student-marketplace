import { createContext, useContext, useRef } from "react";

const ListingsCacheContext = createContext(null);

export function ListingsCacheProvider({ children }) {
    // useRef so the cache persists across renders without causing re-renders
    const cache = useRef({ listings: null, query: "", timestamp: 0 });

    return (
        <ListingsCacheContext.Provider value={cache}>
            {children}
        </ListingsCacheContext.Provider>
    );
}

export function useListingsCache() {
    const cacheRef = useContext(ListingsCacheContext);
    if (!cacheRef) throw new Error("useListingsCache must be inside ListingsCacheProvider");

    const STALE_MS = 60_000; // 1 minute

    function get(queryString) {
        const c = cacheRef.current;
        if (c.listings && c.query === queryString && Date.now() - c.timestamp < STALE_MS) {
            return c.listings;
        }
        return null;
    }

    function set(queryString, listings) {
        cacheRef.current = { listings, query: queryString, timestamp: Date.now() };
    }

    function invalidate() {
        cacheRef.current = { listings: null, query: "", timestamp: 0 };
    }

    return { get, set, invalidate };
}
