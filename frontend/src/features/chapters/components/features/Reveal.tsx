import React, { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../../../../app/hooks/usePrefersReducedMotion";

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Fades and lifts content into view once. Falls back to fully visible when the
 * observer is unavailable or the visitor prefers reduced motion.
 */
export const Reveal: React.FC<RevealProps> = ({ children, className = "", delay = 0 }) => {
  const reducedMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const root = node.closest(".openedup-home") || null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root, rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};
