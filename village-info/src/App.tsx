import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './utils/i18n';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthGuard, PublicOnlyGuard, RoleGuard, PermissionGuard } from './guards';
import { PERMISSIONS, ROLES } from './constants';
import { Spinner } from './components/ui';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const WardsPage = lazy(() => import('./pages/wards/WardsPage'));
const VotersPage = lazy(() => import('./pages/voters/VotersPage'));
const ImportPage = lazy(() => import('./pages/imports/ImportPage'));
const InterestOptionsPage = lazy(() => import('./pages/interest-options/InterestOptionsPage'));
const SubmissionsPage = lazy(() => import('./pages/reports/SubmissionsPage'));
const AuditLogsPage = lazy(() => import('./pages/audit-logs/AuditLogsPage'));
const ProfilePage = lazy(() => import('./pages/users/ProfilePage'));
const ContentPage = lazy(() => import('./pages/content/ContentPage'));
const GalleryPageLazy = lazy(() => import('./pages/content/ContentPage').then(m => ({ default: m.GalleryPage })));
const PublicWebsite = lazy(() => import('./pages/public/PublicWebsite'));
const AdminsPage = lazy(() => import('./pages/users/UsersPage').then(m => ({ default: () => <m.default targetRole="Admin" /> })));
const WardAdminsPage = lazy(() => import('./pages/users/UsersPage').then(m => ({ default: () => <m.default targetRole="WardAdmin" /> })));

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
);

const App: React.FC = () => (
  <QueryClientProvider client={qc}>
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<PublicWebsite />} />
          <Route path="/admin/login" element={<PublicOnlyGuard><LoginPage /></PublicOnlyGuard>} />

          <Route path="/admin/dashboard" element={
            <AuthGuard><AdminLayout><DashboardPage /></AdminLayout></AuthGuard>
          } />
          <Route path="/admin/profile" element={
            <AuthGuard><AdminLayout><ProfilePage /></AdminLayout></AuthGuard>
          } />
          <Route path="/admin/admins" element={
            <AuthGuard><RoleGuard roles={[ROLES.SUPER_ADMIN]}><AdminLayout><AdminsPage /></AdminLayout></RoleGuard></AuthGuard>
          } />
          <Route path="/admin/ward-admins" element={
            <AuthGuard><PermissionGuard permission={PERMISSIONS.MANAGE_WARD_ADMINS}><AdminLayout><WardAdminsPage /></AdminLayout></PermissionGuard></AuthGuard>
          } />
          <Route path="/admin/wards" element={
            <AuthGuard><PermissionGuard permission={PERMISSIONS.MANAGE_WARDS}><AdminLayout><WardsPage /></AdminLayout></PermissionGuard></AuthGuard>
          } />
          <Route path="/admin/voters" element={
            <AuthGuard><PermissionGuard permission={PERMISSIONS.VIEW_VOTERS}><AdminLayout><VotersPage /></AdminLayout></PermissionGuard></AuthGuard>
          } />
          <Route path="/admin/import" element={
            <AuthGuard><PermissionGuard permission={PERMISSIONS.IMPORT_VOTERS}><AdminLayout><ImportPage /></AdminLayout></PermissionGuard></AuthGuard>
          } />
          <Route path="/admin/interest-options" element={
            <AuthGuard><PermissionGuard permission={PERMISSIONS.MANAGE_INTEREST_OPTIONS}><AdminLayout><InterestOptionsPage /></AdminLayout></PermissionGuard></AuthGuard>
          } />
          <Route path="/admin/submissions" element={
            <AuthGuard><PermissionGuard permission={PERMISSIONS.VIEW_PUBLIC_SUBMISSIONS}><AdminLayout><SubmissionsPage /></AdminLayout></PermissionGuard></AuthGuard>
          } />
          <Route path="/admin/reports" element={
            <AuthGuard><PermissionGuard permission={PERMISSIONS.VIEW_VOTERS}><AdminLayout><SubmissionsPage /></AdminLayout></PermissionGuard></AuthGuard>
          } />
          <Route path="/admin/content" element={
            <AuthGuard><PermissionGuard permission={PERMISSIONS.MANAGE_CONTENT}><AdminLayout><ContentPage /></AdminLayout></PermissionGuard></AuthGuard>
          } />
          <Route path="/admin/gallery" element={
            <AuthGuard><PermissionGuard permission={PERMISSIONS.MANAGE_CONTENT}><AdminLayout><GalleryPageLazy /></AdminLayout></PermissionGuard></AuthGuard>
          } />
          <Route path="/admin/audit-logs" element={
            <AuthGuard><PermissionGuard permission={PERMISSIONS.VIEW_AUDIT_LOGS}><AdminLayout><AuditLogsPage /></AdminLayout></PermissionGuard></AuthGuard>
          } />

          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
