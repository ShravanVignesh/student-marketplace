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
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setImageFile(e.dataTransfer.files[0]);
  };

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
    <div className="container" style={{ marginTop: "40px", marginBottom: "60px" }}>
      <div className="page-header">
        <h1>Sell an Item</h1>
        <p>List your textbook, electronics, or anything else in seconds.</p>
      </div>

      <div className="form-card" style={{ maxWidth: "700px", margin: "0 auto" }}>
        <form onSubmit={onSubmit} className="flex flex-col gap-md">
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--text-color)" }}>Title</label>
            <input
              placeholder="What are you selling?"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
              style={{ padding: "12px", fontSize: "1.05rem" }}
            />
          </div>

          <div className="form-grid">
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--text-color)" }}>Price (£)</label>
              <input
                placeholder="0.00"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                required
                style={{ padding: "12px", fontSize: "1.05rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--text-color)" }}>Category</label>
              <input
                placeholder="e.g. Textbooks, Electronics"
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                style={{ padding: "12px", fontSize: "1.05rem" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--text-color)" }}>Location</label>
            <input
              placeholder="e.g. Student Union, Library"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
              style={{ padding: "12px", fontSize: "1.05rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--text-color)" }}>Description</label>
            <textarea
              placeholder="Describe the condition, reason for selling, etc."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              style={{ minHeight: "140px", padding: "12px", fontSize: "1.05rem", resize: "vertical" }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--text-color)" }}>Image (Optional)</label>

            {!imageFile ? (
              <div
                className={`file-upload-zone ${dragActive ? "dragover" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="file-upload-input"
                />
                <div className="file-upload-icon">📁</div>
                <div className="file-upload-text">Click to upload or drag and drop</div>
                <div className="file-upload-hint">PNG, JPG, GIF up to 5MB</div>
              </div>
            ) : (
              <div className="file-preview-container">
                <img src={URL.createObjectURL(imageFile)} alt="Preview" className="file-preview-image" />
                <button type="button" className="file-remove-btn" onClick={() => setImageFile(null)}>✕</button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "16px", marginTop: "24px", alignItems: "center" }}>
            <Link to="/listings" style={{ flex: 1, textAlign: "center", padding: "14px", color: "var(--text-secondary)", fontWeight: 500, textDecoration: "none" }}>
              Cancel
            </Link>
            <button type="submit" disabled={loading} className="btn-primary-large" style={{ flex: 2, margin: 0 }}>
              {loading ? "Posting..." : "Post Listing"}
            </button>
          </div>
        </form>

        {msg && (
          <div style={{ marginTop: "24px", padding: "14px", borderRadius: "8px", backgroundColor: "#fee2e2", color: "#b91c1c", textAlign: "center", fontWeight: 500 }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
