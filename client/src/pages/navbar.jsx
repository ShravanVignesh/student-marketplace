import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ userName, onLogout }) {
  const nav = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    if (onLogout) onLogout();
    nav("/", { replace: true });
  }

  return (
    <div style={{ padding: 12, borderBottom: "1px solid #ddd", marginBottom: 16 }}>
      <Link to="/">Home</Link>{" | "}
      <Link to="/listings">Listings</Link>{" | "}
      <Link to="/create">Create</Link>{" | "}
      <Link to="/my-listings">My Listings</Link>

      <span style={{ marginLeft: 16 }}>
        {userName ? `Hi, ${userName}` : ""}
      </span>

      <button style={{ marginLeft: 12 }} onClick={logout}>
        Logout
      </button>
    </div>
  );
}
