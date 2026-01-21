import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { Link } from "react-router-dom";

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category.trim()) params.set("category", category.trim());
    if (status) params.set("status", status);
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [q, category, status]);

  const serverBase = useMemo(() => {
    const base = api?.defaults?.baseURL || "";
    return base.endsWith("/") ? base.slice(0, -1) : base;
  }, []);

  function fileUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${serverBase}${path}`;
  }

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get(`/api/listings${queryString}`);
      setListings(res.data.listings || []);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [queryString]);

  function clearFilters() {
    setQ("");
    setCategory("");
    setStatus("");
  }

  const countText = loading
    ? "Loading..."
    : `${listings.length} ${listings.length === 1 ? "result" : "results"} found`;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Listings</h2>
          <div style={{ marginTop: 6, fontSize: 14 }}>{countText}</div>
        </div>

        <Link to="/create">Create listing</Link>
      </div>

      <div style={{ marginTop: 12, border: "1px solid #ddd", padding: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            placeholder="Search (title or description)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ minWidth: 260 }}
          />

          <input
            placeholder="Category (example: Electronics)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ minWidth: 220 }}
          />

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
          </select>

          <button onClick={clearFilters}>Clear</button>
          <button onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {err && <p style={{ marginTop: 12 }}>{err}</p>}

      {loading ? (
        <p style={{ marginTop: 12 }}>Loading...</p>
      ) : listings.length === 0 ? (
        <p style={{ marginTop: 12 }}>No listings found.</p>
      ) : (
        <div style={{ marginTop: 12 }}>
          {listings.map((l) => {
            const imgPath =
              Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : "";
            const img = fileUrl(imgPath);

            return (
              <div key={l._id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
                {img && (
                  <img
                    src={img}
                    alt={l.title}
                    style={{
                      width: 260,
                      height: "auto",
                      display: "block",
                      marginBottom: 10,
                    }}
                  />
                )}

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <h3 style={{ margin: 0 }}>{l.title}</h3>
                  <strong>£{l.price}</strong>
                </div>

                <p>{l.description}</p>

                <div style={{ fontSize: 14 }}>
                  <div>Status: {l.status || "active"}</div>
                  <div>Category: {l.category || "None"}</div>
                  <div>Location: {l.location || "None"}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
