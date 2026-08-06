import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, verifyAdminUser } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AdminLogin() {
  const { user, adminExists, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to /admin
  if (!loading && user) {
    navigate('/admin', { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const creds = await signInWithEmailAndPassword(auth, email.trim(), password);

      // Verify the user exists inside the admins collection
      const isAdminDoc = await verifyAdminUser(creds.user.uid);
      if (!isAdminDoc) {
        await signOut(auth);
        setError('Access denied: User account is not registered in the admins collection.');
        setSubmitting(false);
        return;
      }

      navigate('/admin', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Access temporarily disabled due to too many failed attempts. Try again later.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zadel-black px-4 py-12 text-foreground theme-surface">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-neutral-800 bg-zadel-elevated p-8 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-zadel-gold">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">
            Admin Access
          </h1>
          <p className="text-xs tracking-widest text-neutral-400 uppercase">
            Zadel Quiet Luxury Portal
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-300">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-neutral-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@zadel.com"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 py-3 pl-10 pr-4 text-sm text-foreground placeholder-neutral-600 focus:border-zadel-gold focus:outline-none focus:ring-1 focus:ring-zadel-gold transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-neutral-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 py-3 pl-10 pr-4 text-sm text-foreground placeholder-neutral-600 focus:border-zadel-gold focus:outline-none focus:ring-1 focus:ring-zadel-gold transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-zadel-gold px-4 py-3 text-sm font-medium text-zadel-ink hover:bg-zadel-gold-light transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zadel-ink border-t-transparent" />
                Signing In...
              </span>
            ) : (
              <>
                Sign In to Admin Portal
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <div className="border-t border-neutral-800 pt-6 text-center text-xs text-neutral-400">
          {!adminExists ? (
            <div className="space-y-2">
              <p className="text-neutral-400">No administrator account exists yet.</p>
              <Link
                to="/admin/register"
                className="inline-flex items-center gap-1.5 font-medium text-zadel-gold hover:underline"
              >
                Register First Administrator Account
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-neutral-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Admin account registered. New signups are disabled.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
