import { useState } from "react";
import { api } from "../api.js";
import { useNavigate, Link } from "react-router-dom";

export default function CreateListing() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    location: "",
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    const title = form.title.trim();
    const description = form.description.trim();
    const priceNum = Number(form.price);

    if (!title || !description || Number.isNaN(priceNum)) {
      setMsg("Please fill title, description and a valid price.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/listings", {
        title,
        description,
        price: priceNum,
        category: form.category.trim(),
        location: form.location.trim(),
      });

      nav("/my-listings", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || "Failed to create listing";

      if (status === 401) {
        setMsg("You are not logged in. Please login first.");
      } else if (status === 403) {
        setMsg("Not allowed. Make sure your account is verified.");
      } else {
        setMsg(message);
      }
      setLoading(false);
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
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          style={{ width: "100%", marginBottom: 8, minHeight: 90 }}
        />

        <input
          placeholder="Price"
          value={form.price}
          onChange={(e) => setField("price", e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <input
          placeholder="Category"
          value={form.category}
          onChange={(e) => setField("category", e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <input
          placeholder="Location"
          value={form.location}
          onChange={(e) => setField("location", e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Posting..." : "Post"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
