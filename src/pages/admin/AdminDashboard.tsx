import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, User, Activity, Database, Lock, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-zadel-elevated p-5 sm:p-8">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zadel-gold">
            <Lock className="h-3.5 w-3.5" />
            <span>Administrator Portal</span>
          </div>
          <h1 className="font-display text-2xl font-normal text-foreground sm:text-3xl lg:text-4xl break-words">
            Welcome back, {user?.email || 'Administrator'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
            Firebase Authentication and single-admin security governance active. All routes under /admin are strictly protected and persisted across sessions.
          </p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Admin Account Details */}
        <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-zadel-gold" />
              <h2 className="text-xs sm:text-sm font-medium uppercase tracking-wider text-neutral-300">
                Account Identity
              </h2>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Authenticated
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-neutral-500 block mb-0.5">Primary Email</span>
              <span className="font-mono text-neutral-200 break-all">{user?.email}</span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-0.5">Firebase UID</span>
              <span className="font-mono text-neutral-400 break-all">{user?.uid}</span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-0.5">Auth Provider</span>
              <span className="font-mono text-neutral-300 uppercase">
                {user?.providerData[0]?.providerId || 'email'}
              </span>
            </div>
          </div>
        </div>

        {/* System Security */}
        <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-zadel-gold" />
              <h2 className="text-xs sm:text-sm font-medium uppercase tracking-wider text-neutral-300">
                Access Restrictions
              </h2>
            </div>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              Enforced
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2 text-neutral-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Admins collection security verification enabled</span>
            </div>
            <div className="flex items-start gap-2 text-neutral-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Public signups disabled on /admin/register</span>
            </div>
            <div className="flex items-start gap-2 text-neutral-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Browser Local Persistence configured</span>
            </div>
          </div>
        </div>

        {/* Firebase Connection */}
        <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-5 sm:p-6 space-y-4 md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-zadel-gold" />
              <h2 className="text-xs sm:text-sm font-medium uppercase tracking-wider text-neutral-300">
                Firebase Services
              </h2>
            </div>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
              Connected
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-neutral-500 block mb-0.5">Authentication</span>
              <span className="text-emerald-400 font-medium">Email & Password Enabled</span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-0.5">Firestore Collections</span>
              <span className="text-neutral-300 font-mono break-all">admins, system/admin_config</span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-0.5">Session Status</span>
              <span className="text-neutral-300">Persistent across tab & browser reloads</span>
            </div>
          </div>
        </div>
      </div>

      {/* Administration Overview Panel */}
      <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-zadel-gold" />
            <h3 className="font-display text-lg sm:text-xl text-foreground">
              Protected Admin Routes Status
            </h3>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-lg bg-neutral-900/60 border border-neutral-800/60 text-xs text-neutral-400 space-y-2.5 leading-relaxed">
          <p>
            • All admin routes (<code className="bg-neutral-800 px-1.5 py-0.5 rounded text-zadel-gold font-mono text-[11px]">/admin</code>, <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-zadel-gold font-mono text-[11px]">/admin/products</code>, <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-zadel-gold font-mono text-[11px]">/admin/categories</code>, <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-zadel-gold font-mono text-[11px]">/admin/reviews</code>, <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-zadel-gold font-mono text-[11px]">/admin/contact</code>, <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-zadel-gold font-mono text-[11px]">/admin/settings</code>) are guarded by <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-zadel-gold font-mono text-[11px]">ProtectedRoute</code>.
          </p>
          <p>
            • Unauthenticated visitors attempting to access any admin URL are immediately redirected to <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-zadel-gold font-mono text-[11px]">/admin/login</code>.
          </p>
          <p>
            • Customer frontend UI is strictly unaffected.
          </p>
        </div>
      </div>
    </div>
  );
}
