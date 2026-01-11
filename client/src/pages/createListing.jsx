import { useState } from "react";
import { api } from "../api.js";
import { useNavigate, Link } from "react-router-dom";

export default function CreateListing() {
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    try {
      await api.post("/api/listings", {
        title,
        description,
        price: Number(price),
        category,
        location,
      });

      nav("/my-listings");
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to create listing");
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 520 }}>
      <h2>Create Listing</h2>

      <p>
        <Link to="/listings">Back to listings</Link>
      </p>

      <form onSubmit={onSubmit}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", marginBottom: 8, minHeight: 90 }}
        />

        <input
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <button type="submit">Post</button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <p style={{ marginTop: 12 }}>
        If you get "Missing or invalid Authorization header", login first.
      </p>
    </div>
  );
}
