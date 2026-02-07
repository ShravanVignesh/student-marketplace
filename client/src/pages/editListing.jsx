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
    <div className="container" style={{ marginTop: "40px", marginBottom: "40px" }}>
      <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="flex items-center" style={{ justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ margin: 0 }}>Edit Listing</h2>
          <Link to="/my-listings" style={{ fontSize: "0.9rem" }}>Cancel</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading listing details...</div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-md">
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>Title</label>
              <input
                placeholder="Item Title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                required
              />
            </div>

            <div className="flex gap-md">
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>Price (£)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>Category</label>
              <input
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>Location</label>
              <input
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                style={{ minHeight: "120px", resize: "vertical" }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>Image</label>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
                {currentImageUrl && !newImagePreviewUrl && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Current Image:</div>
                    <img
                      src={currentImageUrl}
                      alt="Current"
                      style={{ height: "100px", borderRadius: "var(--border-radius)", border: "1px solid var(--border-color)" }}
                    />
                  </div>
                )}

                {newImagePreviewUrl && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>New Image Preview:</div>
                    <img
                      src={newImagePreviewUrl}
                      alt="Preview"
                      style={{ height: "100px", borderRadius: "var(--border-radius)", border: "1px solid var(--border-color)" }}
                    />
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                style={{ marginTop: "8px" }}
              />

              {newImageFile && (
                <button
                  type="button"
                  onClick={() => setNewImageFile(null)}
                  style={{ marginTop: "8px", fontSize: "0.8rem", padding: "4px 8px", backgroundColor: "var(--secondary-color)" }}
                >
                  Cancel new image
                </button>
              )}
            </div>

            <button type="submit" disabled={saving} className="w-full mt-md">
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </form>
        )}

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
