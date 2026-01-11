import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/api/listings");
        setListings(res.data.listings || []);
      } catch (e) {
        setErr(e.response?.data?.message || e.message || "Failed to load listings");
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Listings</h2>

      {err && <p>{err}</p>}

      {listings.length === 0 ? (
        <p>No listings yet.</p>
      ) : (
        listings.map((l) => (
          <div key={l._id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
            <h3>{l.title}</h3>
            <p>{l.description}</p>
            <p>£{l.price}</p>
            <p>Category: {l.category}</p>
            <p>Location: {l.location}</p>
            <p>Seller: {l.owner?.name || "Unknown"}</p>
          </div>
        ))
      )}
    </div>
  );
}
