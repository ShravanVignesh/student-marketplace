import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Link } from "react-router-dom";

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    try {
      const res = await api.get("/api/listings/mine");
      setListings(res.data.listings || []);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to load your listings (login required)");
    }
  }

  async function remove(id) {
    setMsg("");
    try {
      await api.delete(`/api/listings/${id}`);
      setListings((prev) => prev.filter((x) => x._id !== id));
    } catch (err) {
      setMsg(err.response?.data?.message || "Delete failed");
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

      {listings.length === 0 ? (
        <p>No listings yet</p>
      ) : (
        listings.map((l) => (
          <div key={l._id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{l.title}</h3>
            <p style={{ margin: "8px 0" }}>£{l.price}</p>
            <button onClick={() => remove(l._id)}>Delete</button>
          </div>
        ))
      )}
    </div>
  );
}
