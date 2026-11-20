import { useEffect, useRef, useState } from "react";

/**
 * Pause a 3D canvas when it scrolls out of view or the tab is hidden.
 * Returns a ref for the wrapper element and whether rendering should run.
 */
export function useActiveCanvas<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return { ref, active: inView && tabVisible };
}
