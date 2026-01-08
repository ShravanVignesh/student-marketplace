import { useEffect, useState } from "react";
import { api } from "../api.js";

import { useSearchParams, Link } from "react-router-dom";

export default function Verify() {
  const [params] = useSearchParams();
  const [msg, setMsg] = useState("Verifying...");

  useEffect(() => {
    const id = params.get("id");
    const token = params.get("token");

    async function run() {
      try {
        const res = await api.get(`/api/auth/verify?id=${id}&token=${token}`);
        setMsg(res.data.message);
      } catch (err) {
        setMsg(err.response?.data?.message || "Verification failed");
      }
    }

    if (!id || !token) setMsg("Missing verification link details");
    else run();
  }, [params]);

  return (
    <div style={{ padding: 20, maxWidth: 520 }}>
      <h2>Email Verification</h2>
      <p>{msg}</p>
      <p style={{ marginTop: 16 }}>
        <Link to="/login">Go to login</Link>
      </p>
    </div>
  );
}
