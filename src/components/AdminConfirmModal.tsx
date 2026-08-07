import React, { useEffect } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface AdminConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function AdminConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}: AdminConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      bgIcon: 'bg-red-950/60 border-red-800/60 text-red-400',
      btn: 'bg-red-950/80 hover:bg-red-900 border-red-800 text-red-200',
    },
    warning: {
      bgIcon: 'bg-amber-950/60 border-amber-800/60 text-amber-400',
      btn: 'bg-amber-950/80 hover:bg-amber-900 border-amber-800 text-amber-200',
    },
    primary: {
      bgIcon: 'bg-zadel-gold/10 border-zadel-gold/30 text-zadel-gold',
      btn: 'bg-zadel-gold hover:bg-amber-400 text-black font-semibold',
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => !loading && onClose()}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-zadel-elevated p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={() => !loading && onClose()}
          disabled={loading}
          className="absolute top-4 right-4 text-neutral-400 hover:text-foreground rounded-lg p-1 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${variantStyles.bgIcon}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 pr-4">
            <h3 className="font-display text-lg font-medium text-foreground">
              {title}
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:text-foreground transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer ${variantStyles.btn}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
            <span>{loading ? 'Processing...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
