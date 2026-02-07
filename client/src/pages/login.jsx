import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Login() {
  const nav = useNavigate();
  const { refreshMe } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);

      await refreshMe();

      nav("/listings", { replace: true });
    } catch (err) {
      setMsg(err.response?.data?.message || "Error");
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to manage your listings</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-md">
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Email</label>
            <input
              placeholder="name@university.ac.uk"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex" style={{ justifyContent: "space-between" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Password</label>
            </div>
            <input
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="w-full mt-md">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {msg && (
          <div style={{
            marginTop: "16px",
            padding: "12px",
            borderRadius: "var(--border-radius)",
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            textAlign: "center"
          }}>
            {msg}
          </div>
        )}

        <div className="mt-md" style={{ textAlign: "center", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
          <p style={{ marginBottom: 0 }}>
            Don't have an account? <Link to="/register" style={{ fontWeight: 600 }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
