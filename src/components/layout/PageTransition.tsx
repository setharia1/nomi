"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const easeOut = [0.22, 1, 0.36, 1] as const;

const variants = {
  initial: { opacity: 0, y: 8, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.28, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -6,
    filter: "blur(4px)",
    transition: { duration: 0.2, ease: easeOut },
  },
};

export function PageTransition({
  children,
  home,
}: {
  children: React.ReactNode;
  home?: boolean;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          "flex flex-1 flex-col",
          home ? "min-h-0 h-full overflow-hidden" : undefined,
        )}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
