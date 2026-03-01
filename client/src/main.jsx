import React from "react";
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
import ChatWidget from "./components/ChatWidget.jsx";

import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";

function NavBar() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="nav-brand">Student Marketplace</Link>

        <div className="nav-links">
          <Link to="/listings" className={isActive("/listings")}>Browse</Link>

          {loading ? (
            <span className="text-secondary">Loading...</span>
          ) : user ? (
            <>
              <Link to="/create" className={isActive("/create")}>Sell Item</Link>
              <Link to="/my-listings" className={isActive("/my-listings")}>My Listings</Link>
              <span style={{ color: "var(--text-secondary)", marginLeft: "8px" }}>|</span>
              <span style={{ fontWeight: 500 }}>{user.name}</span>
              <button onClick={logout} style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem", marginLeft: "8px" }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className={isActive("/login")}>Login</Link>
              <Link to="/register" className={`button ${isActive("/register")}`} style={{
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
  return (
    <div className="container">
      <div className="card" style={{ marginTop: "40px", textAlign: "center", padding: "60px 20px" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "16px" }}>Welcome to Student Marketplace</h1>
        <p style={{ fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 32px" }}>
          The exclusive platform for university students to buy and sell textbooks, electronics, and more.
        </p>
        <div className="flex justify-center gap-md">
          <Link to="/listings">
            <button style={{ fontSize: "1.1rem", padding: "0.75rem 2rem" }}>Browse Listings</button>
          </Link>
          <Link to="/register" style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.75rem 2rem",
            borderRadius: "var(--border-radius)",
            border: "1px solid var(--border-color)",
            color: "var(--text-color)",
            textDecoration: "none",
            backgroundColor: "white",
            fontWeight: 500,
            fontSize: "1.1rem"
          }}>
            Join Now
          </Link>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
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
        </div>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
