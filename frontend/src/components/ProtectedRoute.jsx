import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

/**
 * Guards a route by authentication and, optionally, by role.
 * Usage: <ProtectedRoute allowedRole="patient"><PatientDashboard /></ProtectedRoute>
 *
 * This is the single place that decides who can reach a patient-only or
 * doctor-only page — keep all role-gating logic here rather than scattering
 * checks across individual pages.
 */
export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null; // could render a full-page LoadingState here
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // Logged in, but as the wrong role — send them to their own dashboard
    // rather than a generic error.
    const fallback = role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return children;
}
