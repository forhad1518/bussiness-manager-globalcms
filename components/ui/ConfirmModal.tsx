"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{message}</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="px-6 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition cursor-pointer"
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
