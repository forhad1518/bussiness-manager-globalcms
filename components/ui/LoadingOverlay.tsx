"use client";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
}

export default function LoadingOverlay({
  loading,
  message = "Processing...",
}: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center gap-3 pointer-events-auto"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
          >
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-700">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
