import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../api.js";

export default function EditListing() {
  const { id } = useParams();
  const nav = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    location: "",
    status: "active",
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  useEffect(() => {
    async function load() {
      setMsg("");
      setLoading(true);
      try {
        const res = await api.get(`/api/listings/${id}`);
        const l = res.data.listing;

        setForm({
          title: l.title || "",
          description: l.description || "",
          price: String(l.price ?? ""),
          category: l.category || "",
          location: l.location || "",
          status: l.status || "active",
        });
      } catch (err) {
        setMsg(err.response?.data?.message || "Failed to load listing");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

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

    setSaving(true);
    try {
      await api.put(`/api/listings/${id}`, {
        title,
        description,
        price: priceNum,
        category: form.category.trim(),
        location: form.location.trim(),
        status: form.status,
      });

      nav("/my-listings", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || "Update failed";

      if (status === 401) setMsg("Login required.");
      else if (status === 403) setMsg("Not allowed. You can only edit your own listings.");
      else setMsg(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 560 }}>
      <h2>Edit Listing</h2>

      <p>
        <Link to="/my-listings">Back to My Listings</Link>
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : (
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

          <select
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          >
            <option value="active">Active</option>
            <option value="sold">Sold</option>
          </select>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>

          {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
        </form>
      )}
    </div>
  );
}
