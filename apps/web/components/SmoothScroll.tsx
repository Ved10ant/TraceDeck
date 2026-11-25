"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.08,
      duration: 1.25,
      smoothWheel: true,
      anchors: {
        offset: -84,
      },
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
