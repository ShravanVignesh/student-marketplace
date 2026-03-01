import { useEffect, useMemo, useState } from "react";
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

  const [currentImage, setCurrentImage] = useState("");
  const [newImageFile, setNewImageFile] = useState(null);

  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setNewImageFile(e.dataTransfer.files[0]);
  };

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const serverBase = useMemo(() => {
    const base = api?.defaults?.baseURL || "";
    return base.endsWith("/") ? base.slice(0, -1) : base;
  }, []);

  const currentImageUrl = useMemo(() => {
    if (!currentImage) return "";
    if (currentImage.startsWith("http")) return currentImage;
    return `${serverBase}${currentImage}`;
  }, [currentImage, serverBase]);

  const newImagePreviewUrl = useMemo(() => {
    if (!newImageFile) return "";
    return URL.createObjectURL(newImageFile);
  }, [newImageFile]);

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

        const firstImage = Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : "";
        setCurrentImage(firstImage || "");
      } catch (err) {
        setMsg(err.response?.data?.message || "Failed to load listing");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  useEffect(() => {
    return () => {
      if (newImagePreviewUrl) URL.revokeObjectURL(newImagePreviewUrl);
    };
  }, [newImagePreviewUrl]);

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
      if (newImageFile) {
        const fd = new FormData();
        fd.append("title", title);
        fd.append("description", description);
        fd.append("price", String(priceNum));
        fd.append("category", form.category.trim());
        fd.append("location", form.location.trim());
        fd.append("status", form.status);
        fd.append("image", newImageFile);

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
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--text-color)" }}>Title</label>
              <input
                placeholder="Item Title"
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
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--text-color)" }}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                  style={{ padding: "12px", fontSize: "1.05rem", width: "100%", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "white" }}
                >
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--text-color)" }}>Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                  style={{ padding: "12px", fontSize: "1.05rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--text-color)" }}>Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  style={{ padding: "12px", fontSize: "1.05rem" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--text-color)" }}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                style={{ minHeight: "140px", padding: "12px", fontSize: "1.05rem", resize: "vertical" }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--text-color)" }}>Image</label>

              {!newImageFile && !currentImageUrl ? (
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
                    onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                    className="file-upload-input"
                  />
                  <div className="file-upload-icon">📁</div>
                  <div className="file-upload-text">Click to upload or drag and drop</div>
                  <div className="file-upload-hint">Replace current image with a new one</div>
                </div>
              ) : (
                <div className="file-preview-container" style={{ width: "100%", textAlign: "center", border: "1px solid var(--border-color)", borderRadius: "var(--border-radius)", padding: "16px", backgroundColor: "#f8fafc" }}>
                  <img src={newImagePreviewUrl || currentImageUrl} alt="Preview" className="file-preview-image" />

                  <div style={{ marginTop: "16px" }}>
                    {!newImageFile ? (
                      <div
                        className="file-upload-zone"
                        style={{ padding: "16px", minHeight: "auto", marginTop: "16px" }}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                          className="file-upload-input"
                        />
                        <div style={{ fontWeight: 600, color: "var(--text-color)" }}>Click to replace image</div>
                      </div>
                    ) : (
                      <button type="button" className="btn-primary-large" style={{ marginTop: 0, padding: "8px 16px", fontSize: "0.95rem", width: "auto" }} onClick={() => setNewImageFile(null)}>Cancel New Image</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "16px", marginTop: "24px", alignItems: "center" }}>
              <Link to="/my-listings" style={{ flex: 1, textAlign: "center", padding: "14px", color: "var(--text-secondary)", fontWeight: 500, textDecoration: "none" }}>
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
