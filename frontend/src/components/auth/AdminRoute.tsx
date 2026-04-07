
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

const AdminRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (user?.role !== UserRole.ADMIN) return <Navigate to="/" replace />;
  return <Outlet />;
};

export default AdminRoute;
