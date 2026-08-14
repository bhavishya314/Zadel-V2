import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldCheck,
  LogOut,
  ExternalLink,
  LayoutDashboard,
  Package,
  Layers,
  Star,
  Mail,
  Settings as SettingsIcon,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
  ShoppingBag,
} from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', end: true, icon: LayoutDashboard },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Hero Section', path: '/admin/hero', icon: Sparkles },
    { label: 'Reviews', path: '/admin/reviews', icon: Star },
    { label: 'Contact', path: '/admin/contact', icon: Mail },
    { label: 'Settings', path: '/admin/settings', icon: SettingsIcon },
  ];

  const currentPage = navItems.find((item) =>
    item.end
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path)
  ) || navItems[0];

  return (
    <div className="min-h-screen bg-zadel-black text-foreground theme-surface flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-neutral-800 bg-zadel-elevated/95 px-4 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-foreground active:bg-neutral-800 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zadel-gold/10 border border-zadel-gold/30 text-zadel-gold shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-medium tracking-tight text-foreground truncate">
              Zadel Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-foreground transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-zadel-gold" />
            ) : (
              <Moon className="h-4 w-4 text-zadel-gold" />
            )}
          </button>
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-foreground transition-colors"
            title="View Store Front"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-red-950/40 border border-red-900/50 px-3 text-xs font-medium text-red-300 hover:bg-red-900/40 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu */}
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-neutral-800 bg-zadel-elevated p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zadel-gold/10 border border-zadel-gold/30 text-zadel-gold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-display text-lg font-medium text-foreground block">
                      Zadel Admin
                    </span>
                    <span className="text-[10px] text-emerald-400 uppercase font-mono tracking-wider">
                      Protected Session
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Nav Links */}
              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-zadel-gold/15 text-zadel-gold border border-zadel-gold/30'
                            : 'text-neutral-400 hover:bg-neutral-900 hover:text-foreground border border-transparent'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="pt-6 border-t border-neutral-800 space-y-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-between w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-300 hover:border-neutral-700 hover:text-foreground transition-colors cursor-pointer"
              >
                <span className="font-medium">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
                {theme === 'dark' ? (
                  <Sun className="h-3.5 w-3.5 text-zadel-gold" />
                ) : (
                  <Moon className="h-3.5 w-3.5 text-zadel-gold" />
                )}
              </button>

              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 text-xs text-neutral-300 hover:border-neutral-700 hover:text-foreground transition-colors"
              >
                <span>View Store Front</span>
                <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-red-950/40 border border-red-900/50 py-2.5 text-xs font-medium text-red-300 hover:bg-red-900/40 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out Admin</span>
              </button>

              <p className="text-[10px] text-center text-neutral-500 font-mono pt-1">
                {user?.email}
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-neutral-800 lg:bg-zadel-elevated lg:p-6">
        <div className="flex flex-col justify-between h-full">
          <div className="space-y-8">
            {/* Logo / Header */}
            <div className="space-y-3 border-b border-neutral-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zadel-gold/10 border border-zadel-gold/30 text-zadel-gold">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-display text-xl font-medium tracking-tight text-foreground block">
                    ZADEL
                  </span>
                  <span className="text-[10px] text-zadel-gold tracking-widest uppercase font-mono">
                    Admin Portal
                  </span>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 text-[10px] font-medium tracking-wide text-emerald-400 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Protected Session</span>
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 px-3 block mb-2">
                Navigation
              </span>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-zadel-gold/15 text-zadel-gold border border-zadel-gold/30 shadow-sm'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-foreground border border-transparent'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Desktop Footer Actions */}
          <div className="border-t border-neutral-800 pt-5 space-y-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-between w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-300 hover:border-neutral-700 hover:text-foreground transition-colors group cursor-pointer"
            >
              <span className="font-medium">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
              {theme === 'dark' ? (
                <Sun className="h-3.5 w-3.5 text-zadel-gold" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-zadel-gold" />
              )}
            </button>

            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-300 hover:border-neutral-700 hover:text-foreground transition-colors group"
            >
              <span className="font-medium">View Store Front</span>
              <ExternalLink className="h-3.5 w-3.5 text-neutral-400 group-hover:text-zadel-gold transition-colors" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-red-950/40 border border-red-900/50 py-2.5 text-xs font-medium text-red-300 hover:bg-red-900/40 hover:text-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out Admin</span>
            </button>

            <div className="text-[10px] text-neutral-500 font-mono truncate px-1 text-center" title={user?.email || ''}>
              {user?.email}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Desktop Header bar */}
        <header className="hidden lg:flex h-16 items-center justify-between border-b border-neutral-800 bg-zadel-elevated/50 px-8 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
              Current Module:
            </span>
            <span className="text-sm font-medium text-zadel-gold flex items-center gap-1.5">
              <currentPage.icon className="h-4 w-4" />
              <span>{currentPage.label}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-neutral-300 hover:text-foreground hover:border-neutral-700 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-zadel-gold" />
                  <span className="font-mono text-[11px]">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-zadel-gold" />
                  <span className="font-mono text-[11px]">Dark Mode</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1 text-neutral-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-[11px] truncate max-w-[180px]">
                {user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

