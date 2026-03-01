import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { usePageCache } from "../contexts/ListingsCache.jsx";

export default function ListingDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const cache = usePageCache();
    const cacheKey = `detail:${id}`;
    const [listing, setListing] = useState(() => cache.get(cacheKey) || null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(!listing);
    const [activeImg, setActiveImg] = useState(0);
    const [chatLoading, setChatLoading] = useState(false);

    // Swipe state
    const [isDragging, setIsDragging] = useState(false);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setIsDragging(true);
        setTouchEnd(null);
        setTouchStart(e.targetTouches ? e.targetTouches[0].clientX : e.clientX);
    };

    const onTouchMove = (e) => {
        if (!isDragging) return;
        setTouchEnd(e.targetTouches ? e.targetTouches[0].clientX : e.clientX);
    };

    const onTouchEnd = () => {
        setIsDragging(false);
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            setActiveImg((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
        } else if (isRightSwipe) {
            setActiveImg((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
        }
    };

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
            // If we already have cached data, don't show spinner — just refresh silently
            const hasCached = !!listing;
            if (!hasCached) setLoading(true);
            try {
                const res = await api.get(`/api/listings/detail/${id}`);
                setListing(res.data.listing);
                cache.set(cacheKey, res.data.listing);
            } catch (e) {
                setErr(e.response?.data?.message || "Failed to load listing");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return (
            <div className="container" style={{ marginTop: "40px", textAlign: "center" }}>
                <div className="detail-loading">
                    <div className="detail-loading-spinner" />
                    <p>Loading listing details...</p>
                </div>
            </div>
        );
    }

    if (err || !listing) {
        return (
            <div className="container" style={{ marginTop: "40px" }}>
                <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "16px" }}>😕</div>
                    <h2>Listing Not Found</h2>
                    <p>{err || "This listing doesn't exist or has been removed."}</p>
                    <Link to="/listings">
                        <button style={{ marginTop: "16px" }}>← Back to Listings</button>
                    </Link>
                </div>
            </div>
        );
    }

    const images = Array.isArray(listing.images) ? listing.images : [];
    const hasImages = images.length > 0;
    const owner = listing.owner || {};
    const createdDate = listing.createdAt ? new Date(listing.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
    const updatedDate = listing.updatedAt ? new Date(listing.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

    return (
        <div className="container" style={{ marginTop: "24px" }}>
            {/* Back Navigation */}
            <Link to="/listings" className="detail-back-link">
                ← Back to Listings
            </Link>

            <div className="detail-layout">
                {/* Left Column — Images */}
                <div className="detail-images-col">
                    <div className="detail-hero-wrapper" style={{ position: "relative" }}>
                        {hasImages ? (
                            <div
                                onTouchStart={onTouchStart}
                                onTouchMove={onTouchMove}
                                onTouchEnd={onTouchEnd}
                                onMouseDown={onTouchStart}
                                onMouseMove={onTouchMove}
                                onMouseUp={onTouchEnd}
                                onMouseLeave={() => {
                                    if (isDragging) onTouchEnd();
                                }}
                                style={{ width: '100%', height: '100%', cursor: 'grab', overflow: 'hidden' }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        height: '100%',
                                        transition: 'transform 0.3s ease-out',
                                        transform: `translateX(-${activeImg * 100}%)`,
                                    }}
                                >
                                    {images.map((img, idx) => (
                                        <div key={idx} style={{ flex: '0 0 100%', height: '100%' }}>
                                            <img
                                                src={fileUrl(img)}
                                                alt={`${listing.title} ${idx + 1}`}
                                                className="detail-hero-image"
                                                style={{ userSelect: 'none', pointerEvents: 'none' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="detail-hero-placeholder">
                                <span>📷</span>
                                <p>No image available</p>
                            </div>
                        )}
                        {listing.status === "sold" && (
                            <div className="detail-sold-badge">SOLD</div>
                        )}

                        {/* Navigation Arrows */}
                        {images.length > 1 && (
                            <>
                                <button
                                    className="hero-arrow hero-arrow-left"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveImg((prev) => (prev === 0 ? images.length - 1 : prev - 1)); }}
                                    aria-label="Previous image"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>
                                <button
                                    className="hero-arrow hero-arrow-right"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveImg((prev) => (prev === images.length - 1 ? 0 : prev + 1)); }}
                                    aria-label="Next image"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {images.length > 1 && (
                        <div className="detail-thumbnails">
                            {images.map((img, i) => (
                                <img
                                    key={i}
                                    src={fileUrl(img)}
                                    alt={`${listing.title} — ${i + 1}`}
                                    className={`detail-thumb ${i === activeImg ? "active" : ""}`}
                                    onClick={() => setActiveImg(i)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column — Info */}
                <div className="detail-info-col">
                    {/* Price & Status */}
                    <div className="detail-price-row">
                        <span className="detail-price">£{listing.price}</span>
                        <span className={`detail-status ${listing.status}`}>
                            {listing.status === "sold" ? "Sold" : "Available"}
                        </span>
                    </div>

                    <h1 className="detail-title">{listing.title}</h1>

                    {/* Meta tags */}
                    <div className="detail-meta">
                        {listing.category && (
                            <span className="detail-tag">🏷️ {listing.category}</span>
                        )}
                        {listing.location && (
                            <span className="detail-tag">📍 {listing.location}</span>
                        )}
                    </div>

                    {/* Description */}
                    <div className="detail-section">
                        <h3>Description</h3>
                        <p className="detail-description">{listing.description}</p>
                    </div>

                    {/* Seller Info */}
                    <div className="detail-seller-card">
                        <div className="detail-seller-avatar">
                            {(owner.name || "?")[0].toUpperCase()}
                        </div>
                        <div className="detail-seller-info">
                            <h4>Seller</h4>
                            <p className="detail-seller-name">{owner.name || "Unknown"}</p>
                            {owner.email && (
                                <p className="detail-seller-email">{owner.email}</p>
                            )}
                        </div>
                    </div>

                    {/* CTA */}
                    {user && owner._id && owner._id !== user._id && listing.status !== "sold" && (
                        <button
                            className="detail-contact-btn"
                            disabled={chatLoading}
                            onClick={async () => {
                                setChatLoading(true);
                                try {
                                    const res = await api.post("/api/chat", {
                                        listingId: listing._id,
                                        sellerId: owner._id,
                                    });
                                    window.dispatchEvent(
                                        new CustomEvent("open-chat", {
                                            detail: {
                                                conversationId: res.data.conversation._id,
                                                conversation: res.data.conversation,
                                            },
                                        })
                                    );
                                } catch (e) {
                                    console.error("Failed to start chat:", e);
                                } finally {
                                    setChatLoading(false);
                                }
                            }}
                        >
                            {chatLoading ? "Opening chat..." : "💬 Contact Seller"}
                        </button>
                    )}
                    {!user && listing.status !== "sold" && (
                        <Link to="/login" className="detail-contact-btn">
                            💬 Login to Contact Seller
                        </Link>
                    )}

                    {/* Timestamps */}
                    <div className="detail-timestamps">
                        {createdDate && <span>Listed on {createdDate}</span>}
                        {updatedDate && updatedDate !== createdDate && (
                            <span>Updated on {updatedDate}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
