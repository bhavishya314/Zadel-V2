import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AdminToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function AdminToast({ toasts, onDismiss }: AdminToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200 ${
              isSuccess
                ? 'bg-emerald-950/90 border-emerald-800/80 text-emerald-200'
                : isError
                ? 'bg-red-950/90 border-red-800/80 text-red-200'
                : 'bg-neutral-900/95 border-neutral-700 text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
              {isError && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
              {!isSuccess && !isError && <Info className="h-4 w-4 text-zadel-gold shrink-0" />}
              <span className="text-xs font-medium leading-tight truncate">
                {toast.message}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 text-neutral-400 hover:text-foreground rounded-lg shrink-0 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
