// App.jsx
import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Login from "./pages/Login";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => setIsAuthenticated(true);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route
        path="/admin"
        element={isAuthenticated ? <Admin /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}
