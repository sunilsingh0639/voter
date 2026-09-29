import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services';
import { PERMISSIONS, ROLES } from '../constants';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, UserCheck, MapPin, Vote, Upload, Star,
  FileText, BarChart3, Globe, Image, ClipboardList, User, LogOut,
  Menu, X, ChevronRight, Bell
} from 'lucide-react';

interface NavItem { key: string; labelKey: string; path: string; icon: React.ReactNode; permission?: string; roles?: string[] }

const navItems: NavItem[] = [
  { key: 'dashboard', labelKey: 'dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
  { key: 'admins', labelKey: 'admins', path: '/admin/admins', icon: <Users size={16} />, permission: PERMISSIONS.MANAGE_ADMINS, roles: [ROLES.SUPER_ADMIN] },
  { key: 'wardAdmins', labelKey: 'wardAdmins', path: '/admin/ward-admins', icon: <UserCheck size={16} />, permission: PERMISSIONS.MANAGE_WARD_ADMINS },
  { key: 'wards', labelKey: 'wards', path: '/admin/wards', icon: <MapPin size={16} />, permission: PERMISSIONS.MANAGE_WARDS },
  { key: 'voters', labelKey: 'voters', path: '/admin/voters', icon: <Vote size={16} />, permission: PERMISSIONS.VIEW_VOTERS },
  { key: 'importVoters', labelKey: 'importVoters', path: '/admin/import', icon: <Upload size={16} />, permission: PERMISSIONS.IMPORT_VOTERS },
  { key: 'interestOptions', labelKey: 'interestOptions', path: '/admin/interest-options', icon: <Star size={16} />, permission: PERMISSIONS.MANAGE_INTEREST_OPTIONS },
  { key: 'publicSubmissions', labelKey: 'publicSubmissions', path: '/admin/submissions', icon: <FileText size={16} />, permission: PERMISSIONS.VIEW_PUBLIC_SUBMISSIONS },
  { key: 'reports', labelKey: 'reports', path: '/admin/reports', icon: <BarChart3 size={16} />, permission: PERMISSIONS.VIEW_VOTERS },
  { key: 'websiteContent', labelKey: 'websiteContent', path: '/admin/content', icon: <Globe size={16} />, permission: PERMISSIONS.MANAGE_CONTENT },
  { key: 'gallery', labelKey: 'gallery', path: '/admin/gallery', icon: <Image size={16} />, permission: PERMISSIONS.MANAGE_CONTENT },
  { key: 'auditLogs', labelKey: 'auditLogs', path: '/admin/audit-logs', icon: <ClipboardList size={16} />, permission: PERMISSIONS.VIEW_AUDIT_LOGS },
];

const roleColors: Record<string, string> = {
  SuperAdmin: 'bg-[#7B1D1D] text-white',
  Admin: 'bg-[#C05621] text-white',
  WardAdmin: 'bg-[#B7791F] text-white',
};

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { user, clearAuth, hasPermission, isRole } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/admin/login');
    toast.success(t('logout'));
  };

  const isWardAdmin = isRole(ROLES.WARD_ADMIN);
  const wardAdminKeys = ['dashboard', 'voters', 'reports'];

  const visibleItems = navItems.filter((item) => {
    if (isWardAdmin && !wardAdminKeys.includes(item.key)) return false;
    if (item.roles && !item.roles.includes(user?.role || '')) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  });

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const roleLabel = user?.role === 'SuperAdmin' ? t('superAdmin') : user?.role === 'Admin' ? t('admin') : t('wardAdmin');

  return (
    <div className="flex h-screen bg-[#FFFBF5] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-[#2D2D2D]/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, #5C1414 0%, #7B1D1D 40%, #6B3F1A 100%)' }}>

        {/* Sidebar brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-[#B7791F] rounded-lg flex items-center justify-center text-white font-bold text-sm">ढ</div>
                <div>
                  <p className="text-white font-bold text-base leading-tight font-devanagari">ढढेरू</p>
                  <p className="text-[#F6AD55] text-xs leading-tight">चूरू, राजस्थान</p>
                </div>
              </div>
              <p className="text-white/50 text-xs mt-1">{t('votingInfoSystem')}</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#B7791F] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user?.role || ''] || 'bg-white/20 text-white'}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {visibleItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.key} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${active
                  ? 'bg-white/15 text-white border-l-2 border-[#F6AD55]'
                  : 'text-white/70 hover:bg-white/10 hover:text-white border-l-2 border-transparent'
                }`}>
                <span className={`flex-shrink-0 ${active ? 'text-[#F6AD55]' : 'text-white/50 group-hover:text-white/80'}`}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{t(item.labelKey)}</span>
                {active && <ChevronRight size={12} className="text-[#F6AD55] flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 py-3 border-t border-white/10 space-y-0.5">
          <Link to="/admin/profile" onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive('/admin/profile') ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <User size={16} className="flex-shrink-0 text-white/50" />
            <span>{t('profile')}</span>
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-all">
            <LogOut size={16} className="flex-shrink-0" />
            <span>{t('logout')}</span>
          </button>
        </div>

        {/* Decorative bottom */}
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-white/30 text-xs text-center">ढढेरू • चूरू • राजस्थान</p>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top navbar */}
        <header className="bg-white border-b border-[#E8D5A3] px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#7B1D1D] hover:bg-[#FEF3E2] p-1.5 rounded-lg transition-colors">
            <Menu size={20} />
          </button>

          {/* Breadcrumb / page title area */}
          <div className="flex-1 min-w-0">
            <div className="hidden lg:flex items-center gap-2 text-xs text-[#6B3F1A]/60">
              <span className="font-devanagari text-[#7B1D1D] font-semibold">ढढेरू</span>
              <ChevronRight size={12} />
              <span>{t('adminPanel')}</span>
            </div>
            <div className="lg:hidden font-bold text-[#7B1D1D] font-devanagari text-sm">ढढेरू</div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link to="/" target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B3F1A] hover:text-[#7B1D1D] bg-[#FEF3E2] hover:bg-[#F5E6C8] px-3 py-1.5 rounded-lg border border-[#E8D5A3] transition-colors">
              <Globe size={13} />
              <span>Public Site</span>
            </Link>
            <button className="relative p-2 text-[#6B3F1A] hover:bg-[#FEF3E2] rounded-lg transition-colors">
              <Bell size={16} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B1D1D] to-[#C05621] flex items-center justify-center text-white font-bold text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
