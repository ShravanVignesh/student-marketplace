import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";
import { usePageCache } from "../contexts/ListingsCache.jsx";

export default function SellerProfile() {
    const { userId } = useParams();
    const cache = usePageCache();
    const cacheKey = `seller:${userId}`;
    const cached = cache.get(cacheKey);

    const [seller, setSeller] = useState(cached?.seller || null);
    const [listings, setListings] = useState(cached?.listings || []);
    const [loading, setLoading] = useState(!cached);
    const [err, setErr] = useState("");

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
        (async () => {
            if (!cached) setLoading(true);
            try {
                const res = await api.get(`/api/listings/seller/${userId}`);
                setSeller(res.data.seller);
                setListings(res.data.listings || []);
                cache.set(cacheKey, { seller: res.data.seller, listings: res.data.listings || [] });
            } catch (e) {
                setErr(e.response?.data?.message || "Failed to load seller profile");
            } finally {
                setLoading(false);
            }
        })();
    }, [userId]);

    const memberSince = seller?.memberSince
        ? new Date(seller.memberSince).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
        : "";

    if (loading) {
        return (
            <div className="container" style={{ marginTop: "40px", textAlign: "center" }}>
                <div className="detail-loading">
                    <div className="detail-loading-spinner" />
                    <p>Loading seller profile...</p>
                </div>
            </div>
        );
    }

    if (err || !seller) {
        return (
            <div className="container" style={{ marginTop: "40px" }}>
                <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "16px" }}>😕</div>
                    <h2>Seller Not Found</h2>
                    <p>{err || "This seller doesn't exist."}</p>
                    <Link to="/listings">
                        <button style={{ marginTop: "16px" }}>← Back to Listings</button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ marginTop: "24px" }}>
            <Link to="/listings" style={{ color: "var(--primary-color)", textDecoration: "none", fontWeight: 500, fontSize: "0.95rem", display: "inline-block", marginBottom: "24px" }}>
                ← Back to Listings
            </Link>

            {/* Seller Header Card */}
            <div className="card" style={{ padding: "32px", marginBottom: "32px", textAlign: "center" }}>
                <div style={{
                    width: "80px", height: "80px", borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--primary-color), #7c3aed)",
                    color: "white", fontSize: "2rem", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px"
                }}>
                    {seller.name[0].toUpperCase()}
                </div>
                <h2 style={{ margin: "0 0 4px", fontSize: "1.5rem" }}>{seller.name}</h2>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>
                    Member since {memberSince}
                </p>
                <div style={{ marginTop: "12px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    {listings.length} active {listings.length === 1 ? "listing" : "listings"}
                </div>
            </div>

            {/* Listings */}
            {listings.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "40px" }}>
                    <h3>No Active Listings</h3>
                    <p>This seller doesn't have any active listings right now.</p>
                </div>
            ) : (
                <div className="listings-grid">
                    {listings.map((l) => {
                        const imgPath = Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : "";
                        const img = fileUrl(imgPath);

                        return (
                            <Link key={l._id} to={`/listings/${l._id}`} className="listing-card-link">
                                <div className="card listing-card" style={{ padding: 0, overflow: "hidden" }}>
                                    <div style={{ position: "relative" }}>
                                        {img ? (
                                            <img src={img} alt={l.title} className="listing-image" />
                                        ) : (
                                            <div className="listing-image flex items-center justify-center" style={{ color: "var(--text-secondary)", fontSize: "2rem" }}>
                                                📷
                                            </div>
                                        )}
                                    </div>

                                    <div className="listing-content flex flex-col">
                                        <div className="flex items-center" style={{ justifyContent: "space-between", marginBottom: "8px" }}>
                                            <div className="listing-price">£{l.price}</div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                {l.category || "General"}
                                            </div>
                                        </div>

                                        <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", lineHeight: "1.3" }}>{l.title}</h3>
                                        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", flexGrow: 1, marginBottom: "16px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {l.description}
                                        </p>

                                        <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border-color)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                            📍 {l.location || "Campus"}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
