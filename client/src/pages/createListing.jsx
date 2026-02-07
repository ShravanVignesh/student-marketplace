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

  const [imageFile, setImageFile] = useState(null);
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
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("price", String(priceNum));
      fd.append("category", form.category.trim());
      fd.append("location", form.location.trim());
      if (imageFile) fd.append("image", imageFile);

      await api.post("/api/listings", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      nav("/my-listings", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || "Failed to create listing";

      if (status === 401) setMsg("You are not logged in. Please login first.");
      else if (status === 403) setMsg("Not allowed. Make sure your account is verified.");
      else setMsg(message);

      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ marginTop: "40px", marginBottom: "40px" }}>
      <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="flex items-center" style={{ justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ margin: 0 }}>Create Listing</h2>
          <Link to="/listings" style={{ fontSize: "0.9rem" }}>Cancel</Link>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-md">
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>Title</label>
            <input
              placeholder="What are you selling?"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>Price (£)</label>
            <input
              placeholder="0.00"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>Category</label>
            <input
              placeholder="e.g. Textbooks, Electronics, Kitchenware"
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>Location</label>
            <input
              placeholder="e.g. Student Union, Library"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>Description</label>
            <textarea
              placeholder="Describe the condition, reason for selling, etc."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              style={{ minHeight: "120px", resize: "vertical" }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>Image (Optional)</label>
            <div style={{ border: "1px dashed var(--border-color)", padding: "20px", borderRadius: "var(--border-radius)", textAlign: "center" }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                style={{ border: "none", padding: "0" }}
              />
              {imageFile && <div style={{ marginTop: "10px", color: "var(--success-color)", fontWeight: 500 }}>Selected: {imageFile.name}</div>}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full mt-md" style={{ padding: "1rem" }}>
            {loading ? "Posting Listing..." : "Post Listing"}
          </button>
        </form>

        {msg && (
          <div style={{
            marginTop: "20px",
            padding: "12px",
            borderRadius: "var(--border-radius)",
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            textAlign: "center"
          }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
