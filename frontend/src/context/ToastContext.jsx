import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const ICONS = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
const COLORS = {
  success: "bg-success-dim border-success/20 text-success",
  error:   "bg-danger-dim border-danger/20 text-danger",
  warning: "bg-warning-dim border-warning/20 text-warning",
  info:    "bg-accent-dim border-accent/20 text-accent",
};

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-glow-md backdrop-blur-md ${COLORS[toast.type]}`}
    >
      <span className="font-bold">{ICONS[toast.type]}</span>
      <p className="text-[0.85rem] font-medium leading-relaxed">{toast.message}</p>
      <button onClick={onDismiss} className="ml-2 text-current opacity-70 hover:opacity-100 text-[1.1rem] leading-none pb-0.5">
        ×
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
