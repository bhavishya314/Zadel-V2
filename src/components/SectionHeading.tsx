import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { luxuryEase } from '../lib/motion';

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionTo?: string;
  align?: 'left' | 'center';
}

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  actionTo,
  align = 'left',
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: luxuryEase }}
      className={`mb-10 flex flex-col gap-4 md:mb-14 ${
        align === 'center'
          ? 'items-center text-center'
          : 'md:flex-row md:items-end md:justify-between'
      }`}
    >
      <div className={align === 'center' ? 'mx-auto max-w-xl text-center flex flex-col items-center' : ''}>
        {eyebrow && (
          <p className="mb-3 text-[11px] font-medium tracking-[0.3em] text-zadel-gold uppercase text-center">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-3xl tracking-wide text-foreground md:text-4xl text-center">{title}</h2>
        {subtitle && (
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-foreground/45 text-center">{subtitle}</p>
        )}
      </div>
      {actionLabel && actionTo && align !== 'center' && (
        <Link
          to={actionTo}
          className="shrink-0 text-[11px] font-medium tracking-[0.22em] text-foreground/60 uppercase transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-zadel-gold"
        >
          {actionLabel} →
        </Link>
      )}
    </motion.div>
  );
}
