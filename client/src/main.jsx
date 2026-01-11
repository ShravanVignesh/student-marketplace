import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Register from "./pages/register.jsx";
import Login from "./pages/login.jsx";
import Verify from "./pages/verify.jsx";

import Listings from "./pages/listings.jsx";
import CreateListing from "./pages/createListing.jsx";
import MyListings from "./pages/myListings.jsx";

import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";

function NavBar() {
  const { user, loading, logout } = useAuth();

  return (
    <div style={{ padding: 12, borderBottom: "1px solid #ddd", marginBottom: 12 }}>
      <Link to="/" style={{ marginRight: 12 }}>Home</Link>
      <Link to="/listings" style={{ marginRight: 12 }}>Listings</Link>
      <Link to="/create" style={{ marginRight: 12 }}>Create</Link>
      <Link to="/my-listings" style={{ marginRight: 12 }}>My Listings</Link>

      <span style={{ marginLeft: 12 }}>
        {loading ? (
          "Loading..."
        ) : user ? (
          <>
            <span style={{ marginRight: 10 }}>Hi, {user.name}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/register" style={{ marginRight: 12 }}>Register</Link>
            <Link to="/login">Login</Link>
          </>
        )}
      </span>
    </div>
  );
}

function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Student Marketplace</h1>
      <p>
        <Link to="/listings">Browse Listings</Link>
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<Verify />} />

          <Route path="/listings" element={<Listings />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/create" element={<CreateListing />} />
            <Route path="/my-listings" element={<MyListings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
