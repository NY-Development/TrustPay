import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';

import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';

// Public pages
import HomePage from './pages/HomePage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LegalPage from './pages/LegalPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// Dashboard pages
import DashboardPage from './pages/dashboard/DashboardPage';
import VerificationPage from './pages/dashboard/VerificationPage';
import ManualVerificationPage from './pages/dashboard/ManualVerificationPage';
import VerificationDetailPage from './pages/dashboard/VerificationDetailPage';
import AuditPage from './pages/dashboard/AuditPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import ExportPage from './pages/dashboard/ExportPage';
import ProfilePage from './pages/dashboard/ProfilePage';

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/legal" element={<LegalPage />} />
      </Route>

      {/* Auth Pages (Only accessible when NOT logged in) */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>
      </Route>

      {/* Dashboard Pages (Only accessible when logged in) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/verify" element={<VerificationPage />} />
          <Route path="/dashboard/verify/manual" element={<ManualVerificationPage />} />
          <Route path="/dashboard/verify/:id" element={<VerificationDetailPage />} />
          <Route path="/dashboard/audit" element={<AuditPage />} />
          <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
          <Route path="/dashboard/notifications" element={<NotificationsPage />} />
          <Route path="/dashboard/export" element={<ExportPage />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
