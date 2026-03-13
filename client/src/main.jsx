import React, { useState, useEffect, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";

import "./styles/global.css";

import Register from "./pages/register.jsx";
import Login from "./pages/login.jsx";
import Verify from "./pages/verify.jsx";

import Listings from "./pages/listings.jsx";
import ListingDetail from "./pages/listingDetail.jsx";
import CreateListing from "./pages/createListing.jsx";
import MyListings from "./pages/myListings.jsx";
import EditListing from "./pages/editListing.jsx";
import SellerProfile from "./pages/sellerProfile.jsx";
import ChatWidget from "./components/ChatWidget.jsx";
import ToastContainer from "./components/Toast.jsx";
import EditProfileModal from "./components/EditProfileModal.jsx";
import { api } from "./api.js";

import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import { PageCacheProvider } from "./contexts/ListingsCache.jsx";

function NavBar() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleUnread = (e) => setUnreadMsgCount(e.detail);
    window.addEventListener("chat-unread-count", handleUnread);
    return () => window.removeEventListener("chat-unread-count", handleUnread);
  }, []);

  const isActive = (path) => location.pathname === path ? "nav-link active" : "nav-link";

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="nav-brand" onClick={closeMenu}>Student Marketplace</Link>

        {/* Hamburger Menu Button */}
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </button>

        <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <Link to="/listings" className={isActive("/listings")} onClick={closeMenu}>Browse</Link>

          {loading ? (
            <span className="text-secondary">Loading...</span>
          ) : user ? (
            <>
              <Link to="/create" className={isActive("/create")} onClick={closeMenu}>Sell Item</Link>
              <Link to="/my-listings" className={isActive("/my-listings")} onClick={closeMenu}>My Listings</Link>
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); closeMenu(); document.querySelector('.chatbox-fab')?.click(); }}>
                Messages
                {unreadMsgCount > 0 && <span className="nav-unread-badge">{unreadMsgCount > 9 ? "9+" : unreadMsgCount}</span>}
              </a>
              <div className="nav-user-section" style={{ position: "relative" }}>
                <div
                  className="nav-avatar"
                  style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}
                  onClick={() => setShowProfileModal(!showProfileModal)}
                  title="Click to edit profile photo"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl.startsWith('http') ? user.avatarUrl : api.defaults.baseURL + user.avatarUrl}
                      alt={user.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    user.name[0].toUpperCase()
                  )}
                </div>
                <span className="nav-user-name">{user.name}</span>
                <button onClick={() => { logout(); closeMenu(); }} className="nav-logout-btn">Logout</button>
                {showProfileModal && <EditProfileModal onClose={() => setShowProfileModal(false)} />}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={isActive("/login")} onClick={closeMenu}>Login</Link>
              <Link to="/register" className={`button ${isActive("/register")}`} onClick={closeMenu} style={{
                backgroundColor: "var(--primary-color)",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "var(--border-radius)",
                textDecoration: "none"
              }}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function Home() {
  const { user } = useAuth();
  const [recentListings, setRecentListings] = useState([]);

  useEffect(() => {
    // Fetch 3 recent listings
    api.get("/api/listings?limit=3")
      .then(res => {
        // slice just in case the backend returns more
        setRecentListings((res.data.listings || []).slice(0, 3));
      })
      .catch(err => console.error("Could not fetch preview listings", err));
  }, []);

  const serverBase = useMemo(() => {
    const base = api?.defaults?.baseURL || "";
    return base.endsWith("/") ? base.slice(0, -1) : base;
  }, []);

  function fileUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${serverBase}${path}`;
  }

  return (
    <div className="home-wrapper">

      {/* SECTION 1: HERO (SPLIT LAYOUT) */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Buy & Sell Safely Within Your University</h1>
          <p className="hero-subtitle">
            Exclusive to university students. No scams. No strangers. Securely trade textbooks, electronics, and dorm essentials.
          </p>
          <div className="hero-actions">
            <Link to="/listings" className="btn-primary hero-btn">
              Browse Listings
            </Link>
            {user ? (
              <Link to="/create" className="btn-secondary hero-btn">Sell an Item</Link>
            ) : (
              <Link to="/register" className="btn-secondary hero-btn">Join Now</Link>
            )}
          </div>
        </div>
        <div className="hero-graphic">
          {/* Abstract placeholder graphic/illustration */}
          <div className="graphic-card graphic-card-1">
            <div className="graphic-img-placeholder" style={{ background: "#f1f5f9", overflow: "hidden", position: "relative" }}>
              <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300" alt="Mock Product" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} />
            </div>
            <div className="graphic-details" style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
              <div className="flex justify-between items-center">
                <div className="graphic-line" style={{ width: "60%", height: "14px", background: "#334155" }}></div>
                <div className="graphic-line" style={{ width: "25%", height: "16px", background: "var(--primary-color)", borderRadius: "4px" }}></div>
              </div>
              <div className="graphic-line" style={{ width: "40%", height: "10px", background: "#cbd5e1" }}></div>
              <div className="flex items-center gap-sm" style={{ marginTop: "8px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#94a3b8" }}></div>
                <div className="graphic-line" style={{ width: "30%", height: "8px", background: "#94a3b8" }}></div>
              </div>
            </div>
          </div>

          <div className="graphic-card graphic-card-2">
            <div className="graphic-img-placeholder" style={{ background: "#f1f5f9", overflow: "hidden", position: "relative" }}>
              <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300" alt="Mock Product 2" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} />
            </div>
            <div className="graphic-details" style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
              <div className="flex justify-between items-center">
                <div className="graphic-line" style={{ width: "75%", height: "14px", background: "#334155" }}></div>
                <div className="graphic-line" style={{ width: "20%", height: "16px", background: "var(--primary-color)", borderRadius: "4px" }}></div>
              </div>
              <div className="graphic-line" style={{ width: "35%", height: "10px", background: "#cbd5e1" }}></div>
              <div className="flex items-center gap-sm" style={{ marginTop: "8px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#94a3b8" }}></div>
                <div className="graphic-line" style={{ width: "40%", height: "8px", background: "#94a3b8" }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: WHY THIS MARKETPLACE */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title text-center">Why Student Marketplace?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <h3>Verified Students Only</h3>
              <p>Trade exclusively with verified university email holders. No external strangers.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <h3>Secure Real-Time Chat</h3>
              <p>Communicate and negotiate safely inside the platform without sharing personal numbers.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <h3>Local Campus Trading</h3>
              <p>Meet in public, trusted campus spaces. Fast, easy, and no shipping fees.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title text-center">How It Works</h2>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <h4>Sign up with .ac.uk</h4>
              <p>Register using your university email to verify your student status.</p>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <h4>Post or Browse</h4>
              <p>Find what you need or sell things you don't. Connect instantly via chat.</p>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <h4>Meet Safely</h4>
              <p>Arrange to meet up in a public campus location to exchange the item.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: RECENT LISTINGS PREVIEW */}
      <section className="preview-section container">
        <div className="flex" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: "8px" }}>Fresh on Campus</h2>
            <p style={{ color: "var(--light-text)" }}>Discover recently added items.</p>
          </div>
          <Link to="/listings" className="view-all-link">View All →</Link>
        </div>

        {recentListings.length > 0 ? (
          <div className="grid">
            {recentListings.map(listing => (
              <Link to={`/listings/${listing._id}`} key={listing._id} className="card listing-card" style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}>
                <div className="listing-img-wrapper" style={{ height: "200px", background: "#f3f4f6", borderTopLeftRadius: "var(--border-radius)", borderTopRightRadius: "var(--border-radius)", overflow: "hidden" }}>
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={fileUrl(listing.images[0])}
                      alt={listing.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="flex justify-center" style={{ height: "100%", alignItems: "center", color: "var(--light-text)", fontSize: "2rem" }}>
                      📷
                    </div>
                  )}
                </div>
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div className="flex" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", gap: "12px" }}>
                    <h3 className="listing-title" style={{ fontSize: "1.1rem", margin: 0, lineHeight: 1.3 }}>{listing.title}</h3>
                    <div className="listing-price" style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--primary-color)" }}>£{listing.price}</div>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--light-text)", marginTop: "auto" }}>
                    {listing.location || "Campus"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center" style={{ padding: "40px" }}>
            <p>Loading recent items...</p>
          </div>
        )}
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <PageCacheProvider>
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <NavBar />
            <main style={{ flex: 1, paddingBottom: "40px" }}>
              <Routes>
                <Route path="/" element={<Home />} />

                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/verify" element={<Verify />} />

                <Route path="/listings" element={<Listings />} />
                <Route path="/listings/:id" element={<ListingDetail />} />
                <Route path="/seller/:userId" element={<SellerProfile />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/create" element={<CreateListing />} />
                  <Route path="/my-listings" element={<MyListings />} />
                  <Route path="/edit/:id" element={<EditListing />} />
                </Route>
              </Routes>
            </main>
            <footer style={{
              textAlign: "center",
              padding: "20px",
              borderTop: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
              fontSize: "0.875rem"
            }}>
              &copy; {new Date().getFullYear()} Student Marketplace. All rights reserved.
            </footer>
            <ChatWidget />
            <ToastContainer />
          </div>
        </PageCacheProvider>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
