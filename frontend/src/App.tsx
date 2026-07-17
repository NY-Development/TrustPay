import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';

import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';
import { ThemeToggle } from './components/ThemeToggle';

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
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import SecurityPage from './pages/SecurityPage';
import TermsPage from './pages/TermsOfUsePage';

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
import BranchesPage from './pages/dashboard/BranchesPage';
import BranchDetailPage from './pages/dashboard/BranchDetailPage';
import EmployeesPage from './pages/dashboard/EmployeesPage';
import EmployeeDetailPage from './pages/dashboard/EmployeeDetailPage';
import CommunicationsPage from './pages/dashboard/CommunicationsPage';

// Admin pages
import { AdminLayout } from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminVerificationsPage from './pages/admin/AdminVerificationsPage';
import AdminSubscriptionsPage from './pages/admin/AdminSubscriptionsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminLicensesPage from './pages/admin/AdminLicensesPage';

export default function App() {
  return (
    <>
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
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
          <Route path="/dashboard/pricing" element={<PricingPage />} />
          <Route path="/dashboard/branches" element={<BranchesPage />} />
          <Route path="/dashboard/branches/:id" element={<BranchDetailPage />} />
          <Route path="/dashboard/employees" element={<EmployeesPage />} />
          <Route path="/dashboard/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="/dashboard/communications" element={<CommunicationsPage />} />
        </Route>
      </Route>

      {/* Admin Pages (Only accessible when logged in, role checked in AdminLayout) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/verifications" element={<AdminVerificationsPage />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
          <Route path="/admin/audit" element={<AdminAuditLogsPage />} />
          <Route path="/admin/licenses" element={<AdminLicensesPage />} />
        </Route>
      </Route>

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ThemeToggle />
    </>
  );
}
