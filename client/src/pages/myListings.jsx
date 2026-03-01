import { useEffect, useMemo, useState, useRef } from "react";
import { api } from "../api.js";
import { Link, useNavigate } from "react-router-dom";
import { usePageCache } from "../contexts/ListingsCache.jsx";
import { useToast } from "../components/Toast.jsx";

export default function MyListings() {
  const nav = useNavigate();
  const cache = usePageCache();
  const { toast } = useToast();
  const cacheKey = "my-listings";

  const [listings, setListings] = useState(() => cache.get(cacheKey) || []);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(!listings.length);
  const [deletingId, setDeletingId] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const serverBase = useMemo(() => {
    const base = api?.defaults?.baseURL || "";
    return base.endsWith("/") ? base.slice(0, -1) : base;
  }, []);

  function fileUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${serverBase}${path}`;
  }

  async function load(showSpinner = true) {
    setMsg("");
    if (showSpinner) setLoading(true);
    try {
      const res = await api.get("/api/listings/mine");
      const data = res.data.listings || [];
      setListings(data);
      cache.set(cacheKey, data);
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || "Failed to load your listings";
      if (status === 401) setMsg("Login required. Please login first.");
      else setMsg(message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    setMsg("");
    setDeletingId(id);
    setOpenMenuId(null);
    try {
      await api.delete(`/api/listings/${id}`);
      cache.invalidate(cacheKey);
      toast("Listing deleted", "error");
      await load();
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || "Delete failed";
      if (status === 401) setMsg("Login required.");
      else if (status === 403) setMsg("Not allowed. You can only delete your own listings.");
      else setMsg(message);
    } finally {
      setDeletingId("");
    }
  }

  async function toggleStatus(id, currentStatus) {
    const updatingTo = currentStatus === "sold" ? "active" : "sold";
    try {
      await api.put(`/api/listings/${id}`, { status: updatingTo });
      cache.invalidate(cacheKey);
      toast(
        updatingTo === "sold" ? "Listing marked as sold" : "Listing is active again",
        "success"
      );
      await load();
    } catch (_err) {
      setMsg("Failed to update status.");
    }
  }

  useEffect(() => {
    const cached = cache.get(cacheKey);
    if (cached && cached.length > 0) {
      setListings(cached);
      load(false);
    } else {
      load();
    }
  }, []);

  return (
    <div className="container" style={{ marginTop: "24px" }}>
      <div className="flex items-center" style={{ justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ margin: 0 }}>My Listings</h2>
          {!loading && (
            <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.88rem" }}>
              {listings.filter(l => l.status === 'active').length} Active · {listings.filter(l => l.status === 'sold').length} Sold
            </p>
          )}
        </div>
        <Link to="/create">
          <button>+ Create New</button>
        </Link>
      </div>

      {msg && <div className="card" style={{ color: "var(--danger-color)", textAlign: "center", padding: "16px", marginBottom: "24px" }}>{msg}</div>}

      {
        loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading your listings...</div>
        ) : listings.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📦</div>
            <h3>No listings yet</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>You haven't posted any items for sale yet.</p>
            <Link to="/create"><button>Start Selling</button></Link>
          </div>
        ) : (
          <div className="listings-grid">
            {listings.map((l) => {
              const imgPath = Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : "";
              const img = fileUrl(imgPath);

              return (
                <div key={l._id} className="card listing-card" style={{ padding: 0, overflow: "hidden" }}>
                  {/* Image with status badge */}
                  <div style={{ position: "relative" }}>
                    <Link to={`/listings/${l._id}`}>
                      {img ? (
                        <img src={img} alt={l.title} className="listing-image" />
                      ) : (
                        <div className="listing-image flex items-center justify-center" style={{ color: "var(--text-secondary)", fontSize: "2rem" }}>
                          📷
                        </div>
                      )}
                    </Link>
                    <div style={{
                      position: "absolute", top: 12, left: 12,
                      backgroundColor: l.status === 'sold' ? "var(--danger-color)" : "var(--success-color)", color: "white",
                      padding: "3px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.5px", opacity: 0.9
                    }}>
                      {l.status ? l.status.toUpperCase() : "ACTIVE"}
                    </div>

                    {/* 3-dot menu */}
                    <div className="card-menu-wrapper" style={{ position: "absolute", top: 8, right: 8 }} ref={openMenuId === l._id ? menuRef : null}>
                      <button
                        className="card-menu-btn"
                        onClick={() => setOpenMenuId(openMenuId === l._id ? null : l._id)}
                        style={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
                      </button>
                      {openMenuId === l._id && (
                        <div className="card-menu-dropdown">
                          <button onClick={() => { setOpenMenuId(null); nav(`/edit/${l._id}`); }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            Edit
                          </button>
                          <button
                            className="danger"
                            onClick={() => remove(l._id)}
                            disabled={deletingId === l._id}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                            {deletingId === l._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <Link to={`/listings/${l._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="listing-content flex flex-col">
                      <div className="flex items-center" style={{ justifyContent: "space-between", marginBottom: "8px" }}>
                        <div className="listing-price">£{l.price}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {l.category || "General"}
                        </div>
                      </div>
                      <h3 style={{ fontSize: "1.05rem", marginBottom: "8px", lineHeight: "1.3" }}>{l.title}</h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", flexGrow: 1, marginBottom: "12px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {l.description}
                      </p>
                    </div>
                  </Link>

                  {/* Status toggle — bottom of card */}
                  <div style={{ padding: "0 16px 16px" }}>
                    {l.status === 'active' ? (
                      <button
                        className="status-toggle-btn mark-sold"
                        onClick={() => toggleStatus(l._id, "active")}
                      >
                        Mark as Sold
                      </button>
                    ) : (
                      <button
                        className="status-toggle-btn mark-active"
                        onClick={() => toggleStatus(l._id, "sold")}
                      >
                        Mark as Active
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div >
  );
}
