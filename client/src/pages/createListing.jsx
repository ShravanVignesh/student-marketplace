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
    <div className="create-page-container">
      <div className="create-layout-grid">
        {/* LEFT COLUMN: FORM */}
        <div className="create-form-column">
          <div className="create-header-left">
            <h1>Sell an Item</h1>
            <p>Create a listing in under a minute. Verified students only.</p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-md">
            <div>
              <label className="form-label uppercase text-xs font-bold text-gray-500 mb-2 block">Title</label>
              <input
                className="input-minimal"
                placeholder="What are you selling?"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                required
              />
            </div>

            <div className="form-grid-2">
              <div>
                <label className="form-label uppercase text-xs font-bold text-gray-500 mb-2 block">Price (£)</label>
                <input
                  className="input-minimal"
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
                <label className="form-label uppercase text-xs font-bold text-gray-500 mb-2 block">Category</label>
                <input
                  className="input-minimal"
                  placeholder="e.g. Textbooks, Electronics"
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label uppercase text-xs font-bold text-gray-500 mb-2 block">Location</label>
              <input
                className="input-minimal"
                placeholder="e.g. Student Union, Library"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
              />
            </div>

            <div>
              <label className="form-label uppercase text-xs font-bold text-gray-500 mb-2 block">Description</label>
              <textarea
                className="input-minimal"
                placeholder="Condition, condition, accessories, what's includde, picup info..."
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                style={{ minHeight: "120px", resize: "vertical" }}
                required
              />
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "8px" }}>Tip: include condition, accessories, and where you can meet.</p>
            </div>

            <div>
              <label className="form-label uppercase text-xs font-bold text-gray-500 mb-2 block">Images <span style={{ fontWeight: 'normal', color: '#94a3b8' }}>(Optional, Max 5)</span></label>

              <div
                className={`upload-zone-minimal ${dragActive ? "dragover" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("hidden-file-input").click()}
              >
                <input
                  id="hidden-file-input"
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
                  style={{ display: "none" }}
                />
                <div className="upload-icon-minimal">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: "1rem", color: "#1e293b" }}>Upload photos or drag androp</div>
                <div style={{ marginTop: "6px", fontSize: "0.8rem", color: "#94a3b8" }}>PNG, JPG, up to 5MB total</div>
              </div>

              {imageFiles.length > 0 && (
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
                  {imageFiles.map((f, i) => (
                    <div key={i} className="file-preview-container" style={{ width: "80px", height: "80px", padding: "4px", position: "relative", minHeight: "auto" }}>
                      <img src={URL.createObjectURL(f)} alt="Preview" className="file-preview-image" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px", margin: 0 }} />
                      <button type="button" className="file-remove-btn" style={{ position: "absolute", top: "0", right: "0", transform: "translate(30%, -30%)", width: "20px", height: "20px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 0, fontSize: "12px" }} onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "16px", marginTop: "32px", justifyContent: "space-between", alignItems: "center" }}>
              <Link to="/listings" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500 }}>
                Cancel
              </Link>
              <button type="submit" disabled={loading} className="btn-primary-large" style={{ margin: 0, padding: "12px 32px", borderRadius: "8px" }}>
                {loading ? "Posting..." : "Post listing"}
              </button>
            </div>
          </form>

          {msg && (
            <div style={{ marginTop: "24px", padding: "14px", borderRadius: "8px", backgroundColor: "#fee2e2", color: "#b91c1c", textAlign: "center", fontWeight: 500 }}>
              {msg}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PREVIEW & TIPS */}
        <div className="create-preview-column">
          <h3 className="preview-heading">Listing preview</h3>

          <div className="live-preview-card">
            <div className="preview-image-wrapper">
              {imageFiles.length > 0 ? (
                <img src={URL.createObjectURL(imageFiles[0])} alt="Preview cover" className="preview-cover-img" />
              ) : (
                <div className="preview-placeholder-img">
                  <span className="active-badge label-active">ACTIVE</span>
                  <img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Mockup cover" className="preview-cover-img" style={{ opacity: 0.5 }} />
                </div>
              )}
            </div>

            <div className="preview-content">
              <h2 className="preview-title">{form.title || "Title goes here"}</h2>

              <div className="preview-price-row">
                <span className="preview-price">£{form.price || "0.00"}</span>
                <span className="preview-icons">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  <span className="preview-dots">•••</span>
                </span>
              </div>

              <div className="preview-meta">
                <span>{form.category || "Category"}</span>
                <span className="preview-dot-separator">•</span>
                <span>{form.location || "Location"}</span>
              </div>

              <div className="preview-skeleton-lines">
                <div className="skeleton-line full"></div>
                <div className="skeleton-line medium"></div>
              </div>

              <button className="preview-action-btn">Mark as Sold</button>
              <p className="preview-disclaimer">This is rouglly what your listing will look like.</p>
            </div>
          </div>

          <div className="selling-tips-section">
            <h3 className="preview-heading">Selling tips</h3>
            <ul className="tips-list">
              <li>
                <div className="tip-bullet">📍</div>
                <span>Meet in public campus locations.</span>
              </li>

              <li>
                <div className="tip-bullet">💬</div>
                <span>Keep all communications inside the app.</span>
              </li>
            </ul>
            <a href="#" className="guidelines-link">Guidelines for safe trading <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          </div>
        </div>
      </div>
    </div>
  );
}
