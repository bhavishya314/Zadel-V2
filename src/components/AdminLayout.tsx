import React from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

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
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Reviews', path: '/admin/reviews', icon: Star },
    { label: 'Contact', path: '/admin/contact', icon: Mail },
    { label: 'Settings', path: '/admin/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-zadel-black text-foreground theme-surface flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-zadel-elevated/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zadel-gold/10 border border-zadel-gold/30 text-zadel-gold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-xl font-medium tracking-tight text-foreground">
                Zadel Admin
              </span>
              <span className="ml-2.5 rounded-md bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-emerald-400 uppercase">
                Protected Session
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-700 hover:text-foreground transition-colors"
            >
              <span>View Store Front</span>
              <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-900/50 px-3.5 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/40 hover:text-red-200 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-neutral-800/80 bg-neutral-950/40">
          <div className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 sm:space-x-2 py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-zadel-gold/15 text-zadel-gold border border-zadel-gold/30'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-foreground border border-transparent'
                      }`
                    }
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
