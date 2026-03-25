"use client";

import { motion } from "framer-motion";

export function ModalBackdrop({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label="Close"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] m-0 cursor-default border-0 bg-black/48 p-0 backdrop-blur-sm"
      onClick={onClose}
    />
  );
}
