import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { Link, useNavigate } from "react-router-dom";

export default function MyListings() {
  const nav = useNavigate();

  const [listings, setListings] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

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
    setMsg("");
    setLoading(true);
    try {
      const res = await api.get("/api/listings/mine");
      setListings(res.data.listings || []);
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
    try {
      await api.delete(`/api/listings/${id}`);
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
      await load();
    } catch (err) {
      setMsg("Failed to update status.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container" style={{ marginTop: "24px" }}>
      <div className="flex items-center" style={{ justifyContent: "space-between", marginBottom: "24px" }}>
        <h2>My Listings</h2>
        <Link to="/create">
          <button>+ Create New</button>
        </Link>
      </div>

      {msg && <div className="card" style={{ color: "var(--danger-color)", textAlign: "center", padding: "16px", marginBottom: "24px" }}>{msg}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading your listings...</div>
      ) : listings.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <h3>No listings yet</h3>
          <p>You haven't posted any items for sale yet.</p>
          <Link to="/create">Start Selling</Link>
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map((l) => {
            const imgPath = Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : "";
            const img = fileUrl(imgPath);

            return (
              <div key={l._id} className="card listing-card" style={{ padding: 0 }}>
                <div style={{ position: "relative" }}>
                  {img ? (
                    <img src={img} alt={l.title} className="listing-image" />
                  ) : (
                    <div className="listing-image flex items-center justify-center" style={{ color: "var(--text-secondary)", fontSize: "2rem" }}>
                      📷
                    </div>
                  )}
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    backgroundColor: l.status === 'sold' ? "var(--danger-color)" : "var(--success-color)", color: "white",
                    padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold"
                  }}>
                    {l.status ? l.status.toUpperCase() : "ACTIVE"}
                  </div>
                </div>

                <div className="listing-content flex flex-col">
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", lineHeight: "1.3" }}>{l.title}</h3>
                  <div className="listing-price" style={{ marginBottom: "12px" }}>£{l.price}</div>

                  <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                    {l.category || "General"} | {l.location || "Campus"}
                  </div>

                  <div className="flex gap-sm" style={{ marginTop: "auto", flexWrap: "wrap" }}>
                    {l.status === 'active' && (
                      <button
                        onClick={() => toggleStatus(l._id, "active")}
                        style={{ flex: "1 0 100%", backgroundColor: "var(--primary-color)", color: "white" }}
                      >
                        Mark as Sold
                      </button>
                    )}
                    {l.status === 'sold' && (
                      <button
                        onClick={() => toggleStatus(l._id, "sold")}
                        style={{ flex: "1 0 100%", backgroundColor: "var(--success-color)", color: "white" }}
                      >
                        Mark as Active
                      </button>
                    )}
                    <button
                      onClick={() => nav(`/edit/${l._id}`)}
                      style={{ flex: 1, backgroundColor: "var(--background-color)", color: "var(--text-color)", border: "1px solid var(--border-color)" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(l._id)}
                      disabled={deletingId === l._id}
                      style={{ flex: 1, backgroundColor: "var(--danger-color)", opacity: deletingId === l._id ? 0.7 : 1 }}
                    >
                      {deletingId === l._id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
