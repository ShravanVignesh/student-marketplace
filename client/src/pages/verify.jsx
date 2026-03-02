import { useEffect, useState, useRef } from "react";
import { api } from "../api.js";
import { useSearchParams, Link } from "react-router-dom";

export default function Verify() {
  const [params] = useSearchParams();
  const [msg, setMsg] = useState("Verifying your email...");
  const [status, setStatus] = useState("loading"); // loading, success, error
  const hasFetched = useRef(false);

  useEffect(() => {
    const id = params.get("id");
    const token = params.get("token");

    async function run() {
      if (hasFetched.current) return;
      hasFetched.current = true;

      try {
        const res = await api.get(`/api/auth/verify?id=${id}&token=${token}`);
        setMsg(res.data.message);
        setStatus("success");
      } catch (err) {
        setMsg(err.response?.data?.message || "Verification failed");
        setStatus("error");
      }
    }

    if (!id || !token) {
      setMsg("Invalid verification link");
      setStatus("error");
    } else {
      run();
    }
  }, [params]);

  return (
    <div className="auth-container">
      <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
        <h2 style={{ marginBottom: "16px" }}>Email Verification</h2>

        <div style={{
          margin: "24px 0",
          fontSize: "1.1rem",
          color: status === "error" ? "var(--danger-color)" : (status === "success" ? "var(--success-color)" : "var(--text-color)")
        }}>
          {msg}
        </div>

        {status === "success" && (
          <Link to="/login">
            <button className="w-full">Proceed to Login</button>
          </Link>
        )}

        {status === "error" && (
          <Link to="/register">
            <button className="w-full" style={{ backgroundColor: "var(--secondary-color)" }}>Back to Registration</button>
          </Link>
        )}
      </div>
    </div>
  );
}
