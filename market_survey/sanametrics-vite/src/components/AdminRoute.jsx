// src/components/AdminRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../api/useAuth";

/**
 * Usage:
 * <Route element={<AdminRoute />}>
 *   <Route path="/templates-admin" element={<TemplatesAdmin />} />
 * </Route>
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />; // ou page "403"
  return children ?? <Outlet />;
}
