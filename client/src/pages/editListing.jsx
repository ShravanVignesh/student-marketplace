import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../api.js";
import { usePageCache } from "../contexts/ListingsCache.jsx";

export default function EditListing() {
  const { id } = useParams();
  const nav = useNavigate();
  const cache = usePageCache();
  const cacheKey = `edit:${id}`;
  const cached = cache.get(cacheKey);

  const [form, setForm] = useState(() => cached ? {
    title: cached.title || "",
    description: cached.description || "",
    price: String(cached.price ?? ""),
    category: cached.category || "",
    location: cached.location || "",
    status: cached.status || "active",
  } : {
    title: "",
    description: "",
    price: "",
    category: "",
    location: "",
    status: "active",
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(!cached);
  const [saving, setSaving] = useState(false);

  const [currentImages, setCurrentImages] = useState(() =>
    cached && Array.isArray(cached.images) ? cached.images : []
  );
  const [newImageFiles, setNewImageFiles] = useState([]);

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
      setNewImageFiles(prev => {
        const combined = [...prev, ...files];
        return combined.slice(0, 5 - currentImages.length);
      });
    }
  };

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const serverBase = useMemo(() => {
    const base = api?.defaults?.baseURL || "";
    return base.endsWith("/") ? base.slice(0, -1) : base;
  }, []);

  function fileUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${serverBase}${path}`;
  }

  useEffect(() => {
    async function load() {
      setMsg("");
      const hasCached = !!cached;
      if (!hasCached) setLoading(true);

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

        setCurrentImages(Array.isArray(l.images) ? l.images : []);
        cache.set(cacheKey, l);
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
    setSaving(true);

    const title = form.title.trim();
    const description = form.description.trim();
    const priceNum = Number(form.price);

    if (!title || !description || Number.isNaN(priceNum)) {
      setMsg("Please fill title, description and a valid price.");
      setSaving(false);
      return;
    }

    try {
      if (newImageFiles.length > 0 || currentImages.length > 0) {
        const fd = new FormData();
        fd.append("title", title);
        fd.append("description", description);
        fd.append("price", String(priceNum));
        fd.append("category", form.category.trim());
        fd.append("location", form.location.trim());
        fd.append("status", form.status);

        currentImages.forEach(img => fd.append("existingImages", img));
        newImageFiles.forEach(f => fd.append("images", f));

        await api.put(`/api/listings/${id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.put(`/api/listings/${id}`, {
          title,
          description,
          price: priceNum,
          category: form.category.trim(),
          location: form.location.trim(),
          status: form.status,
          existingImages: [],
        });
      }

      nav("/my-listings", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || "Update failed";

      if (status === 401) setMsg("Login required.");
      else if (status === 403) setMsg("Not allowed. You can only edit your own listings.");
      else setMsg(message);

      setSaving(false);
    }
  }

  return (
    <div className="container" style={{ marginTop: "40px", marginBottom: "60px" }}>
      <div className="page-header">
        <h1>Edit Listing</h1>
        <p>Update the details of your item.</p>
      </div>

      <div className="form-card" style={{ maxWidth: "700px", margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading listing details...</div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-md">
            <div>
              <label className="form-label">Title</label>
              <input
                placeholder="Item Title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                required
              />
            </div>

            <div className="form-grid">
              <div>
                <label className="form-label">Price (£)</label>
                <input
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
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Location</label>
              <input
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                style={{ minHeight: "140px", resize: "vertical" }}
                required
              />
            </div>

            <div>
              <label className="form-label">Images (Max 5 total)</label>

              {currentImages.length + newImageFiles.length < 5 && (
                <div
                  className={`file-upload-zone ${dragActive ? "dragover" : ""}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    marginBottom: "24px",
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
                        setNewImageFiles(prev => {
                          const combined = [...prev, ...files];
                          return combined.slice(0, 5 - currentImages.length);
                        });
                      }
                    }}
                    className="file-upload-input"
                  />
                  <div className="file-upload-icon" style={{ fontSize: "3rem", marginBottom: "12px", color: "var(--primary-color)", opacity: 0.8, pointerEvents: "none" }}>📁</div>
                  <div className="file-upload-text" style={{ fontWeight: 600, fontSize: "1.05rem", color: "var(--text-color)", pointerEvents: "none" }}>Click to upload or drag and drop</div>
                  <div className="file-upload-hint" style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--text-secondary)", pointerEvents: "none" }}>PNG, JPG, GIF up to 5MB (Max 5 images total)</div>
                </div>
              )}

              {(currentImages.length > 0 || newImageFiles.length > 0) && (
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {currentImages.map((img, i) => (
                    <div key={`cur-${i}`} className="file-preview-container" style={{ width: "120px", height: "120px", padding: "4px", position: "relative", minHeight: "auto" }}>
                      <img src={fileUrl(img)} alt="Current" className="file-preview-image" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px", margin: 0 }} />
                      <button type="button" className="file-remove-btn" title="Remove image" style={{ position: "absolute", top: "0", right: "0", transform: "translate(30%, -30%)", width: "24px", height: "24px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 0 }} onClick={() => setCurrentImages(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                    </div>
                  ))}
                  {newImageFiles.map((f, i) => (
                    <div key={`new-${i}`} className="file-preview-container" style={{ width: "120px", height: "120px", padding: "4px", position: "relative", minHeight: "auto" }}>
                      <img src={URL.createObjectURL(f)} alt="New Preview" className="file-preview-image" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px", margin: 0 }} />
                      <button type="button" className="file-remove-btn" title="Remove new image" style={{ position: "absolute", top: "0", right: "0", transform: "translate(30%, -30%)", width: "24px", height: "24px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 0 }} onClick={() => setNewImageFiles(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "16px", marginTop: "32px", alignItems: "center" }}>
              <Link to="/my-listings" style={{ flex: 1, textAlign: "center", padding: "14px", color: "var(--text-secondary)", fontWeight: 600, textDecoration: "none", transition: "color 0.2s" }} className="hover:text-primary">
                Cancel
              </Link>
              <button type="submit" disabled={saving} className="btn-primary-large" style={{ flex: 2, margin: 0 }}>
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {msg && (
          <div style={{ marginTop: "24px", padding: "14px", borderRadius: "8px", backgroundColor: "#fee2e2", color: "#b91c1c", textAlign: "center", fontWeight: 500 }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
