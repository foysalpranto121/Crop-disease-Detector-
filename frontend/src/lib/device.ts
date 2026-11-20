type NetworkInfo = { saveData?: boolean; effectiveType?: string };
type NavigatorWithHints = Navigator & { connection?: NetworkInfo; deviceMemory?: number };

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function isTouchDevice(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Decide whether this device should render the 3D scenes (FRONTEND_PLAN §4.5).
 * Returns false on reduced motion, Data Saver, 2G/3G, ≤2 GB RAM, or no WebGL.
 */
export function deviceCanRender3D(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  const nav = navigator as NavigatorWithHints;
  if (nav.connection?.saveData) return false;
  const type = nav.connection?.effectiveType;
  if (type && ["slow-2g", "2g", "3g"].includes(type)) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) return false;
  return hasWebGL();
}
