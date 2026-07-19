"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string; // Tailwind max-w class, e.g. "max-w-md"
}

export default function Drawer({
  open,
  onClose,
  title,
  children,
  width = "max-w-md",
}: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`fixed top-0 right-0 h-full w-full ${width} bg-white z-50 shadow-2xl p-6 overflow-y-auto`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{title}</h2>
              <button
                onClick={onClose}
                className="hover:bg-gray-100 p-1 rounded"
              >
                <X size={24} />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
