"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const easeOut = [0.22, 1, 0.36, 1] as const;

/**
 * Enter-only transition (no AnimatePresence `mode="wait"`).
 * `wait` can strand navigations in production when exit lifecycles do not finish before the next route mounts.
 */
export function PageTransition({
  children,
  home,
}: {
  children: React.ReactNode;
  home?: boolean;
}) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
      animate={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.26, ease: easeOut },
      }}
      className={cn(
        "flex flex-1 flex-col",
        home ? "min-h-0 h-full overflow-hidden" : undefined,
      )}
    >
      {children}
    </motion.div>
  );
}
