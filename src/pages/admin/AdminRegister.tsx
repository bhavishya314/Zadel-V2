import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, saveAdminDocument, checkAdminExists } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Mail, Lock, ShieldAlert, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AdminRegister() {
  const { user, adminExists, refreshAdminStatus, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If user is already logged in, redirect to /admin
  useEffect(() => {
    if (!loading && user) {
      navigate('/admin', { replace: true });
    }
  }, [loading, user, navigate]);

  if (!loading && user) {
    return null;
  }

  // If an admin already exists, block registration!
  if (!loading && adminExists) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zadel-black px-4 py-12 text-foreground theme-surface">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-neutral-800 bg-zadel-elevated p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-950/40 border border-amber-800/40 text-amber-400">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl text-foreground">
              Registration Disabled
            </h1>
            <p className="text-sm leading-relaxed text-neutral-400">
              An administrator account already exists. Only one administrator account is permitted for this system. Further registrations are disabled.
            </p>
          </div>
          <Link
            to="/admin/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zadel-gold px-4 py-3 text-sm font-medium text-zadel-ink hover:bg-zadel-gold-light transition-colors"
          >
            Go to Admin Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill out all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setSubmitting(true);

      // Re-check Firestore to prevent race conditions
      const exists = await checkAdminExists();
      if (exists) {
        setError('An administrator account has already been registered.');
        await refreshAdminStatus();
        return;
      }

      // Create user in Firebase Auth
      const creds = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // Save authenticated admin document in `admins` collection with uid, email, and createdAt
      await saveAdminDocument(creds.user.uid, creds.user.email || email);
      await refreshAdminStatus();

      navigate('/admin', { replace: true });
    } catch (err: any) {
      console.error('Registration error:', err);
      let msg = 'Failed to create administrator account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
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
            <UserPlus className="h-5 w-5" />
          </div>
          <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">
            Initial Admin Setup
          </h1>
          <p className="text-xs tracking-widest text-neutral-400 uppercase">
            Create System Administrator Account
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-zadel-gold/30 bg-zadel-gold/5 p-3.5 text-xs text-zadel-gold-light">
          <ShieldCheck className="h-5 w-5 shrink-0 text-zadel-gold" />
          <p>
            You are setting up the sole administrator account. Once created, registration will be permanently closed.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-300">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-neutral-300">
              Admin Email
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
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 py-3 pl-10 pr-4 text-sm text-foreground placeholder-neutral-600 focus:border-zadel-gold focus:outline-none focus:ring-1 focus:ring-zadel-gold transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-neutral-300">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 py-3 pl-10 pr-4 text-sm text-foreground placeholder-neutral-600 focus:border-zadel-gold focus:outline-none focus:ring-1 focus:ring-zadel-gold transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-zadel-gold px-4 py-3 text-sm font-medium text-zadel-ink hover:bg-zadel-gold-light transition-all disabled:opacity-50 mt-6"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zadel-ink border-t-transparent" />
                Registering Account...
              </span>
            ) : (
              <>
                Register Administrator
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <div className="border-t border-neutral-800 pt-6 text-center text-xs text-neutral-400">
          Already have an admin account?{' '}
          <Link to="/admin/login" className="font-medium text-zadel-gold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
