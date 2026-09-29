import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  return <>{children}</>;
};

export const RoleGuard: React.FC<{ children: React.ReactNode; roles: string[] }> = ({ children, roles }) => {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
};

export const PermissionGuard: React.FC<{ children: React.ReactNode; permission: string }> = ({ children, permission }) => {
  const { hasPermission } = useAuthStore();
  if (!hasPermission(permission)) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
};

export const PublicOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
};
