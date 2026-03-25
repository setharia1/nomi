"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type ButtonProps = Omit<
  React.ComponentProps<"button">,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"
>;

export function GlowButton({
  className,
  children,
  variant = "primary",
  ...props
}: ButtonProps & { variant?: "primary" | "ghost" | "subtle" }) {
  if (variant === "ghost") {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white/88",
          "border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.12] transition-colors",
          "glow-focus",
          className,
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
  if (variant === "subtle") {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "rounded-xl px-4 py-3 font-medium text-white/80",
          "bg-transparent hover:bg-white/5 transition-colors",
          className,
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "rounded-lg px-4 py-2.5 text-sm font-semibold text-white",
        "bg-gradient-to-r from-violet-600/92 to-cyan-500/85",
        "border border-white/[0.09] glow-cta glow-cta-hover",
        "glow-focus",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
