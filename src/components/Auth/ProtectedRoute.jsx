import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Doctor Route Guard:
 * - Requires authentication
 * - If status === 'pending' -> redirects to /pending
 * - If status === 'suspended' | 'rejected' -> redirects to /status
 */
export function DoctorProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin isolation: Admins must NEVER see or open Doctor routes
  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (profile?.status === 'pending') {
    return <Navigate to="/pending" replace />;
  }

  if (profile?.status === 'suspended' || profile?.status === 'rejected') {
    return <Navigate to="/status" replace />;
  }

  return children;
}

/**
 * Admin Route Guard:
 * - Requires authentication
 * - Requires role === 'admin'
 * - Doctors are strictly blocked and redirected to /
 */
export function AdminProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Doctor isolation: Doctors cannot access administrative governance
  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
