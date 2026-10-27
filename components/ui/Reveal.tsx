"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// The "window opening" entrance: scale 0.96 to 1, a fade and a 12px rise, once.
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reduce ? 0.2 : 0.42, ease: [0.23, 1, 0.32, 1], delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}
