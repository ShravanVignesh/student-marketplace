import { useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "./Toast";

export default function EditProfileModal({ onClose }) {
    const { user, setUser } = useAuth();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(user?.avatarUrl ? api.defaults.baseURL + user.avatarUrl : null);

    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;

        // Create preview
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const handleSave = async () => {
        if (!file) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            // 1. Upload the image
            const formData = new FormData();
            formData.append("image", file);

            const uploadRes = await api.post("/api/uploads/image", formData);
            const newAvatarUrl = uploadRes.data.url;

            // 2. Save to user profile
            await api.put("/api/users/profile", { avatarUrl: newAvatarUrl });

            // 3. Update local auth state immediately
            setUser((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
            toast("Profile photo updated!", "success");
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Failed to update profile";
            toast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            right: 0,
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            border: "1px solid var(--border-color)",
            padding: "24px",
            width: "280px",
            zIndex: 100,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
        }}>
            <h4 style={{ marginTop: 0, marginBottom: "20px", fontSize: "1.1rem" }}>Edit Profile Photo</h4>

            <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                    width: "100px", height: "100px", borderRadius: "50%", margin: "0 auto 20px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "2.5rem", fontWeight: "bold", cursor: "pointer", position: "relative",
                    overflow: "hidden", border: "3px solid white", boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                }}
            >
                {preview ? (
                    <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    user?.name[0].toUpperCase()
                )}

                <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)",
                    color: "white", fontSize: "0.7rem", padding: "4px 0", backdropFilter: "blur(2px)"
                }}>
                    Upload
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
            />

            <div className="flex gap-sm" style={{ marginTop: "16px", justifyContent: "center", width: "100%" }}>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "none", flex: 1, padding: "8px 0" }}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={loading}
                    style={{ flex: 1, padding: "8px 0" }}
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}
