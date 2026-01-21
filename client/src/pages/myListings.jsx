import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Link, useNavigate } from "react-router-dom";

export default function MyListings() {
  const nav = useNavigate();

  const [listings, setListings] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

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

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>My Listings</h2>

      <p>
        <Link to="/listings">Browse</Link> | <Link to="/create">Create</Link>
      </p>

      {msg && <p>{msg}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : listings.length === 0 ? (
        <p>No listings yet</p>
      ) : (
        listings.map((l) => (
          <div key={l._id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{l.title}</h3>
            <p style={{ margin: "8px 0" }}>{l.description}</p>
            <p style={{ margin: "8px 0" }}>£{l.price}</p>
            <p style={{ margin: "8px 0" }}>
              {l.category ? `Category: ${l.category}` : ""} {l.location ? ` | Location: ${l.location}` : ""}
            </p>

            <button onClick={() => nav(`/edit/${l._id}`)} style={{ marginRight: 10 }}>
              Edit
            </button>

            <button onClick={() => remove(l._id)} disabled={deletingId === l._id}>
              {deletingId === l._id ? "Deleting..." : "Delete"}
            </button>
          </div>
        ))
      )}
    </div>
  );
}
