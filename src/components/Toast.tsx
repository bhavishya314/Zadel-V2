import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../context/StoreContext';

export default function Toast() {
  const { toasts } = useStore();

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="rounded-full border border-zadel-gold/30 bg-zadel-elevated/95 px-5 py-2.5 text-xs tracking-wide text-foreground shadow-xl backdrop-blur-md"
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
