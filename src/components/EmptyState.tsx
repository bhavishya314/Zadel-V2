import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-foreground/10 bg-zadel-surface">
        <Icon size={24} className="text-zadel-gold/80" strokeWidth={1.25} />
      </div>
      <h3 className="font-display text-xl tracking-wide text-foreground">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-foreground/45">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          onClick={onAction}
          className="btn-luxury mt-6 inline-flex items-center rounded-full border border-zadel-gold/40 px-6 py-2.5 text-[11px] font-medium tracking-[0.2em] text-zadel-gold uppercase hover:bg-zadel-gold hover:text-zadel-ink"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className="btn-luxury mt-6 inline-flex items-center rounded-full border border-zadel-gold/40 px-6 py-2.5 text-[11px] font-medium tracking-[0.2em] text-zadel-gold uppercase hover:bg-zadel-gold hover:text-zadel-ink"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
