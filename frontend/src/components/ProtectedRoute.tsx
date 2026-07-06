import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#faf8ff] dark:bg-[#0b0e14]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004bca]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
