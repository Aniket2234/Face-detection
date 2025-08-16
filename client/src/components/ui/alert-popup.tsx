import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertPopupProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
}

export function AlertPopup({
  isOpen,
  onClose,
  type,
  title,
  message,
  autoClose = true,
  duration = 4000,
}: AlertPopupProps) {
  // Auto close functionality
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: X,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: "bg-green-500/90 border-green-400 text-white",
    error: "bg-red-500/90 border-red-400 text-white",
    warning: "bg-yellow-500/90 border-yellow-400 text-white",
    info: "bg-blue-500/90 border-blue-400 text-white",
  };

  const IconComponent = icons[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-4 left-4 right-4 z-50 flex justify-center"
        >
          <div
            className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-lg max-w-md",
              colors[type]
            )}
          >
            <IconComponent className="w-6 h-6 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-sm opacity-90">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}