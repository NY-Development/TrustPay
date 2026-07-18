import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';

import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';
import { ThemeToggle } from './components/ThemeToggle';

// Public pages
const HomePage = lazy(() => import('./pages/HomePage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const SecurityPage = lazy(() => import('./pages/SecurityPage'));
const TermsPage = lazy(() => import('./pages/TermsOfUsePage'));

// Dashboard pages
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const VerificationPage = lazy(() => import('./pages/dashboard/VerificationPage'));
const ManualVerificationPage = lazy(() => import('./pages/dashboard/ManualVerificationPage'));
const VerificationDetailPage = lazy(() => import('./pages/dashboard/VerificationDetailPage'));
const AuditPage = lazy(() => import('./pages/dashboard/AuditPage'));
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage'));
const NotificationsPage = lazy(() => import('./pages/dashboard/NotificationsPage'));
const ExportPage = lazy(() => import('./pages/dashboard/ExportPage'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));
const BranchesPage = lazy(() => import('./pages/dashboard/BranchesPage'));
const BranchDetailPage = lazy(() => import('./pages/dashboard/BranchDetailPage'));
const EmployeesPage = lazy(() => import('./pages/dashboard/EmployeesPage'));
const EmployeeDetailPage = lazy(() => import('./pages/dashboard/EmployeeDetailPage'));
const CommunicationsPage = lazy(() => import('./pages/dashboard/CommunicationsPage'));

// Admin pages
import { AdminLayout } from './layouts/AdminLayout';
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminVerificationsPage = lazy(() => import('./pages/admin/AdminVerificationsPage'));
const AdminSubscriptionsPage = lazy(() => import('./pages/admin/AdminSubscriptionsPage'));
const AdminAuditLogsPage = lazy(() => import('./pages/admin/AdminAuditLogsPage'));
const AdminLicensesPage = lazy(() => import('./pages/admin/AdminLicensesPage'));

const RouteFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#faf8ff] dark:bg-[#0b0e14]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004bca]" />
  </div>
);

export default function App() {
  return (
    <>
    <Suspense fallback={<RouteFallback />}>
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
    </Suspense>
    <ThemeToggle />
    </>
  );
}
