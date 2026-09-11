import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  LayoutDashboard, FileText, ClipboardList, BookOpen, 
  Calendar, BellRing, Image, Mail, Settings, Globe, 
  LogOut, Sun, Moon, Key, Menu, X, FileEdit, Users, Image as ImageIcon, Camera, Shield
} from 'lucide-react';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ to, icon, label, active, onClick }: SidebarItemProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
      active 
        ? 'bg-sky-600 text-white shadow-md shadow-sky-500/10' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-500'
    }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { to: '/pages', icon: <FileEdit size={20} />, label: 'Custom Pages' },
    { to: '/content', icon: <FileText size={20} />, label: 'Sections Content' },
    { to: '/facilities', icon: <ClipboardList size={20} />, label: 'Facilities' },
    { to: '/events', icon: <Calendar size={20} />, label: 'Workshops & Events' },
    { to: '/gallery', icon: <Camera size={20} />, label: 'Event Gallery' },
    { to: '/notices', icon: <BellRing size={20} />, label: 'Notices Board' },
    { to: '/donors', icon: <Users size={20} />, label: 'Donors' },
    { to: '/committees', icon: <Users size={20} />, label: 'Board & Committees' },
    { to: '/sliders', icon: <ImageIcon size={20} />, label: 'Sliders' },
    { to: '/media', icon: <Image size={20} />, label: 'Media Library' },
    { to: '/library', icon: <BookOpen size={20} />, label: 'Library Users' },
    { to: '/inbox', icon: <Mail size={20} />, label: 'Inquiries Inbox' },
    { to: '/admins', icon: <Shield size={20} />, label: 'Admin Users' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Website Settings' },
    { to: '/seo', icon: <Globe size={20} />, label: 'SEO & Meta Config' }
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50';
      case 'site_admin': return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50';
      case 'admin': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-900/50';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'site_admin': return 'Site Admin';
      case 'admin': return 'Admin';
      default: return 'Staff';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      
      {/* Desktop Sidebar */}
      <aside className="hidden xl:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 mb-8">
          <div className="bg-sky-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-sky-500/20">SR</div>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-white leading-tight">Sanskar Bhavan</h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Admin Control Panel</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map(item => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
            />
          ))}
        </nav>

        {user && (
          <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-400 flex items-center justify-center font-bold">
                {user.username[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate text-slate-800 dark:text-white">{user.username}</p>
                <span className={`inline-block text-[10px] px-2 py-0.5 mt-0.5 rounded-full border ${getRoleBadgeColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs xl:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 transform transition-transform duration-200 ease-in-out xl:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex justify-between items-center mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="bg-sky-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg">SR</div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-white leading-tight">Sanskar Bhavan</h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">CMS Dashboard</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(item => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Navbar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 xl:hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {navItems.find(item => item.to === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-500 hover:border-sky-300 dark:hover:border-sky-900 shadow-sm transition-all"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-300 dark:hover:border-sky-900 px-3 py-1.5 rounded-xl shadow-sm transition-all text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                <div className="w-6.5 h-6.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-400 flex items-center justify-center font-bold text-xs">
                  {user ? user.username[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline">{user?.username}</span>
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 py-2">
                    <Link 
                      to="/change-password" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 w-full text-left"
                    >
                      <Key size={16} />
                      <span>Change Password</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 w-full text-left font-medium border-t border-slate-100 dark:border-slate-800 mt-1 pt-2"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Viewport for specific page contents */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>

    </div>
  );
};
