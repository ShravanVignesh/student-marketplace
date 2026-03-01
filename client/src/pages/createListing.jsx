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

  const [imageFiles, setImageFiles] = useState([]);
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
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      setImageFiles(prev => {
        const combined = [...prev, ...files];
        return combined.slice(0, 5);
      });
    }
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
      if (imageFiles.length > 0) {
        imageFiles.forEach(f => fd.append("images", f));
      }

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
            <label className="form-label">Title</label>
            <input
              placeholder="What are you selling?"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
            />
          </div>

          <div className="form-grid">
            <div>
              <label className="form-label">Price (£)</label>
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
              <label className="form-label">Category</label>
              <input
                placeholder="e.g. Textbooks, Electronics"
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Location</label>
            <input
              placeholder="e.g. Student Union, Library"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              placeholder="Describe the condition, reason for selling, etc."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              style={{ minHeight: "140px", resize: "vertical" }}
              required
            />
          </div>

          <div>
            <label className="form-label">Images (Optional, Max 5)</label>

            <div
              className={`file-upload-zone ${dragActive ? "dragover" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                marginBottom: imageFiles.length > 0 ? "24px" : "0",
                padding: "40px 20px",
                border: "2px dashed var(--border-color)",
                borderRadius: "16px",
                backgroundColor: dragActive ? "rgba(37, 99, 235, 0.05)" : "#fafafa",
                borderColor: dragActive ? "var(--primary-color)" : "var(--border-color)",
                transition: "all 0.2s ease"
              }}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    const files = Array.from(e.target.files);
                    setImageFiles(prev => {
                      const combined = [...prev, ...files];
                      return combined.slice(0, 5);
                    });
                  }
                }}
                className="file-upload-input"
              />
              <div className="file-upload-icon" style={{ fontSize: "3rem", marginBottom: "12px", color: "var(--primary-color)", opacity: 0.8 }}>📁</div>
              <div className="file-upload-text" style={{ fontWeight: 600, fontSize: "1.05rem", color: "var(--text-color)" }}>Click to upload or drag and drop (Max 5)</div>
              <div className="file-upload-hint" style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>PNG, JPG, GIF up to 5MB total</div>
            </div>

            {imageFiles.length > 0 && (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {imageFiles.map((f, i) => (
                  <div key={i} className="file-preview-container" style={{ width: "120px", height: "120px", padding: "4px", position: "relative", minHeight: "auto" }}>
                    <img src={URL.createObjectURL(f)} alt="Preview" className="file-preview-image" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px", margin: 0 }} />
                    <button type="button" className="file-remove-btn" style={{ position: "absolute", top: "0", right: "0", transform: "translate(30%, -30%)", width: "24px", height: "24px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 0 }} onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "16px", marginTop: "32px", alignItems: "center" }}>
            <Link to="/listings" style={{ flex: 1, textAlign: "center", padding: "14px", color: "var(--text-secondary)", fontWeight: 600, textDecoration: "none", transition: "color 0.2s" }} className="hover:text-primary">
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
