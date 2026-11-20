import { motion, useReducedMotion } from "motion/react";
import { Leaf } from "lucide-react";

const PIECES = 16;
const COLORS = ["text-leaf-400", "text-leaf-500", "text-wheat-400", "text-leaf-300"];

/** Leaves bursting outward — shown once for a healthy result. */
export function Celebration() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div className="decorative-motion pointer-events-none absolute inset-0 z-10" aria-hidden>
      {Array.from({ length: PIECES }, (_, i) => {
        const angle = (i / PIECES) * Math.PI * 2;
        const dist = 90 + (i % 4) * 30;
        return (
          <motion.span
            key={i}
            className={`absolute top-1/2 left-1/2 ${COLORS[i % COLORS.length]}`}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 20, scale: 1, opacity: 0, rotate: 200 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 + i * 0.015 }}
          >
            <Leaf className="size-5 fill-current" />
          </motion.span>
        );
      })}
    </div>
  );
}
