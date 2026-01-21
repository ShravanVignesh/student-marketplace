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

  const [currentImage, setCurrentImage] = useState(""); // string path like /uploads/xxx
  const [newImageFile, setNewImageFile] = useState(null); // File

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const serverBase = useMemo(() => {
    // api baseURL is set in api.js
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
      // cleanup preview url to avoid memory leak
      if (newImagePreviewUrl) URL.revokeObjectURL(newImagePreviewUrl);
    };
  }, [newImagePreviewUrl]);

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
      // If user picked a new image, send multipart/form-data
      if (newImageFile) {
        const fd = new FormData();
        fd.append("title", title);
        fd.append("description", description);
        fd.append("price", String(priceNum));
        fd.append("category", form.category.trim());
        fd.append("location", form.location.trim());
        fd.append("status", form.status);
        fd.append("image", newImageFile); // must match upload.single("image")

        await api.put(`/api/listings/${id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // normal JSON update
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

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}

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
            style={{ width: "100%", marginBottom: 12 }}
          >
            <option value="active">Active</option>
            <option value="sold">Sold</option>
          </select>

          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Image</div>

            {currentImageUrl && !newImagePreviewUrl && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}>Current:</div>
                <img
                  src={currentImageUrl}
                  alt="Current listing"
                  style={{ maxWidth: "100%", border: "1px solid #ddd" }}
                />
              </div>
            )}

            {newImagePreviewUrl && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}>New (preview):</div>
                <img
                  src={newImagePreviewUrl}
                  alt="New preview"
                  style={{ maxWidth: "100%", border: "1px solid #ddd" }}
                />
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
            />

            {newImageFile && (
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setNewImageFile(null)}
                  style={{ marginRight: 8 }}
                >
                  Remove new image
                </button>
              </div>
            )}
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      )}
    </div>
  );
}
