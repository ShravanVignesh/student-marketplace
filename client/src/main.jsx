import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Register from "./pages/register.jsx";
import Login from "./pages/login.jsx";
import Verify from "./pages/verify.jsx";

function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Student Marketplace</h1>
      <p>
        <Link to="/register">Register</Link> | <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// import React from "react";
// import ReactDOM from "react-dom/client";

// function Home() {
//   return (
//     <div style={{ padding: 20 }}>
//       <h1>Student Marketplace</h1>
//       <p>Main is rendering fine.</p>
//     </div>
//   );
// }

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <Home />
//   </React.StrictMode>
// );
