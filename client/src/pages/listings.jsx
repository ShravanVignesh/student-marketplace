import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../api.js";
import { Link } from "react-router-dom";
import { usePageCache } from "../contexts/ListingsCache.jsx";

export default function Listings() {
  const cache = usePageCache();
  const [listings, setListings] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [locationQ, setLocationQ] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (locationQ.trim()) params.set("location", locationQ.trim());
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [q, locationQ]);

  const cacheKey = `listings${queryString}`;

  const serverBase = useMemo(() => {
    const base = api?.defaults?.baseURL || "";
    return base.endsWith("/") ? base.slice(0, -1) : base;
  }, []);

  function fileUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${serverBase}${path}`;
  }

  const load = useCallback(async (showSpinner = true) => {
    setErr("");
    if (showSpinner) setLoading(true);
    try {
      const res = await api.get(`/api/listings${queryString}`);
      const data = res.data.listings || [];
      setListings(data);
      cache.set(cacheKey, data);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [queryString, cache, cacheKey]);

  useEffect(() => {
    // Check cache first — show instantly if available
    const cached = cache.get(cacheKey);
    if (cached) {
      setListings(cached);
      // Silently refresh in background (no spinner)
      const t = setTimeout(() => load(false), 100);
      return () => clearTimeout(t);
    }
    // No cache — full load with spinner
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [cacheKey, cache, load]);

  function clearFilters() {
    setQ("");
    setLocationQ("");
  }

  const countText = loading
    ? "Loading..."
    : `${listings.length} ${listings.length === 1 ? "result" : "results"} found`;

  return (
    <div className="container" style={{ marginTop: "24px" }}>
      <div className="flex items-center" style={{ justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ margin: 0 }}>Browse Listings</h2>
          <div style={{ marginTop: 4, color: "var(--text-secondary)" }}>{countText}</div>
        </div>

        <Link to="/create">
          <button>+ Create Listing</button>
        </Link>
      </div>

      <div className="card" style={{ padding: "16px", marginBottom: "24px" }}>
        <div className="flex gap-md" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 2, minWidth: "200px" }}>
            <input
              placeholder="Search title or description..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>

          <div style={{ flex: 1, minWidth: "150px" }}>
            <input
              placeholder="Campus or location..."
              value={locationQ}
              onChange={(e) => setLocationQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>

          <div className="flex gap-sm">
            <button onClick={load} disabled={loading} style={{ padding: "0.75rem 1rem" }}>
              Search
            </button>
            <button onClick={clearFilters} style={{ backgroundColor: "var(--secondary-color)", padding: "0.75rem 1rem" }}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {err && <div className="card" style={{ color: "var(--danger-color)", textAlign: "center", padding: "20px" }}>{err}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading listings...</div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)", backgroundColor: "var(--card-bg)", borderRadius: "var(--border-radius)", border: "1px solid var(--border-color)" }}>
          <h3>No listings found</h3>
          <p>Try adjusting your search filters or create a new listing.</p>
          <button onClick={clearFilters} style={{ backgroundColor: "var(--secondary-color)" }}>Clear Filters</button>
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map((l) => {
            const imgPath = Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : "";
            const img = fileUrl(imgPath);

            return (
              <Link key={l._id} to={`/listings/${l._id}`} className="listing-card-link">
                <div className="card listing-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ position: "relative" }}>
                    {img ? (
                      <img src={img} alt={l.title} className="listing-image" />
                    ) : (
                      <div className="listing-image flex items-center justify-center" style={{ color: "var(--text-secondary)", fontSize: "2rem" }}>
                        📷
                      </div>
                    )}
                    {l.status === 'sold' && (
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        backgroundColor: "var(--danger-color)", color: "white",
                        padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold"
                      }}>
                        SOLD
                      </div>
                    )}
                  </div>

                  <div className="listing-content flex flex-col">
                    <div className="flex items-center" style={{ justifyContent: "space-between", marginBottom: "8px" }}>
                      <div className="listing-price">£{l.price}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {l.category || "General"}
                      </div>
                    </div>

                    <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", lineHeight: "1.3" }}>{l.title}</h3>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", flexGrow: 1, marginBottom: "16px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {l.description}
                    </p>

                    <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border-color)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      📍 {l.location || "Campus"}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
