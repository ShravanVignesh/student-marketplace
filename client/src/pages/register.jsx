import { useState } from "react";
import { api } from "../api.js";
import { Link } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/register", { name, email, password });
      setMsg(res.data.message || "Registered. Check your email to verify.");
    } catch (err) {
      setMsg(err.response?.data?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join the student marketplace today</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-md">
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Full Name</label>
            <input
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>University Email</label>
            <input
              placeholder="name@university.ac.uk"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <small style={{ color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>
              Must be a valid .ac.uk email address
            </small>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Password</label>
            <input
              placeholder="At least 8 characters"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button type="submit" disabled={loading} className="w-full mt-md">
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {msg && (
          <div className={`mt-md p-2 rounded ${msg.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
            style={{
              padding: "16px",
              borderRadius: "var(--border-radius)",
              backgroundColor: msg.toLowerCase().includes("error") ? "#fee2e2" : "#dcfce7",
              color: msg.toLowerCase().includes("error") ? "#b91c1c" : "#15803d",
              textAlign: "center"
            }}>
            <p style={{ margin: 0 }}>{msg}</p>
          </div>
        )}

        <div className="mt-md" style={{ textAlign: "center", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
          <p style={{ marginBottom: 0 }}>
            Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
