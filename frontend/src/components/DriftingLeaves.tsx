import { useMemo } from "react";

const COLORS = ["#55C46B", "#8EDB8F", "#22A447", "#E9C46A", "#B07A4F"];

/** A few slow falling leaves. Decorative only — hidden in Lite mode and with reduced motion. */
export function DriftingLeaves({ count = 9 }: { count?: number }) {
  const leaves = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 97) % 100,
        size: 14 + ((i * 37) % 18),
        duration: 16 + ((i * 53) % 14),
        delay: -((i * 29) % 20),
        color: COLORS[i % COLORS.length],
      })),
    [count],
  );

  return (
    <div className="decorative-motion pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {leaves.map((l, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="animate-drift absolute top-0"
          style={{ left: `${l.left}%`, width: l.size, height: l.size, animationDuration: `${l.duration}s`, animationDelay: `${l.delay}s` }}
        >
          <path fill={l.color} d="M12 2C6 6 4 12 6 18c1.5 2.5 4 4 6 4 0-6 2-11 6-15-3 0-5 1-6 2 0-3 1-5 2-7-1 0-1.3 0-2 0Z" opacity="0.85" />
        </svg>
      ))}
    </div>
  );
}
