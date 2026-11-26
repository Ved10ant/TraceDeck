
"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useReducedMotion,
  useAnimationFrame,
} from "framer-motion";

function wrap(min: number, max: number, v: number): number {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

export function MarqueeSection() {
  const prefersReducedMotion = useReducedMotion();

  const baseX = useMotionValue(0);

  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });

  // -1 = Right to Left
  // +1 = Left to Right
  const directionFactor = useRef<number>(-1);

  // Smooth direction transitions
  const smoothDirection = useSpring(-1, {
    stiffness: 35,
    damping: 20,
  });

  useAnimationFrame((_t, delta) => {
    if (prefersReducedMotion) return;

    const vel = smoothVelocity.get();

    // Detect scroll direction only
    if (vel < -5) {
      directionFactor.current = 1;
    } else if (vel > 5) {
      directionFactor.current = -1;
    }

    // Smoothly transition direction
    smoothDirection.set(directionFactor.current);

    // Fixed and slow animation speed
    const baseSpeed = 2.5; // Percentage per second

    const moveBy =
      smoothDirection.get() * baseSpeed * (delta / 1000);

    baseX.set(baseX.get() + moveBy);
  });

  // Seamless infinite looping
  const x = useTransform(
    baseX,
    (v) => `${wrap(-50, 0, v)}%`
  );

  const techs = [
    {
      id: "nextjs",
      title: "Next.js",
      category: "Frontend & RSC",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-label="Next.js">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8.5 16V8L16.5 18.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15.5 8V13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "typescript",
      title: "TypeScript",
      category: "Type Safety",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-label="TypeScript">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7.5 11.5H12M9.75 11.5V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16.5 12.2C16 11.6 14.5 11.4 14 12.3C13.6 13.1 14.6 13.7 15.6 14C16.7 14.4 17 15.6 16.2 16.4C15.4 17.2 13.8 16.9 13.3 16.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "express",
      title: "Express",
      category: "REST API v1",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-label="Express">
          <path d="M3.5 12.5H11C11 9.8 9.2 8 7.2 8C4.8 8 3.2 10 3.2 12.5C3.2 15.2 5 17 7.6 17C9.3 17 10.4 16.2 11 15.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 9L20.5 16.5M20.5 9L14 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "postgresql",
      title: "PostgreSQL",
      category: "Partial Unique Index",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-label="PostgreSQL">
          <ellipse cx="12" cy="6.5" rx="7.5" ry="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4.5 6.5V12C4.5 13.7 7.8 15 12 15C16.2 15 19.5 13.7 19.5 12V6.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4.5 12V17.5C4.5 19.2 7.8 20.5 12 20.5C16.2 20.5 19.5 19.2 19.5 17.5V12" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ),
    },
    {
      id: "redis",
      title: "Redis",
      category: "Job Queue Store",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-label="Redis">
          <path d="M12 3.5L20 7.2L12 11L4 7.2L12 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M4 11.8L12 15.5L20 11.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16.3L12 20L20 16.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: "bullmq",
      title: "BullMQ",
      category: "Deterministic Workers",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-label="BullMQ">
          <path d="M5 7C5 4.8 7 3.5 8.5 5.5L10.5 8H13.5L15.5 5.5C17 3.5 19 4.8 19 7C19 9.5 17 11 16 12.5V16.5C16 18.7 14.2 20.5 12 20.5C9.8 20.5 8 18.7 8 16.5V12.5C7 11 5 9.5 5 7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="10" cy="13.5" r="0.9" fill="currentColor" />
          <circle cx="14" cy="13.5" r="0.9" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "prisma",
      title: "Prisma",
      category: "Type-Safe ORM",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-label="Prisma">
          <path d="M12.5 3.5L4.5 16.8L12.5 20.5L19.5 16.2L12.5 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M12.5 3.5V20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "undici",
      title: "Undici",
      category: "Socket IP Validation",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-label="Undici">
          <path d="M12 3L4.5 6.5V11.8C4.5 16.4 7.7 20.4 12 21.5C16.3 20.4 19.5 16.4 19.5 11.8V6.5L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M12.5 7.5L9.5 12.5H12.5L11.5 16.5L15 11.5H12L12.5 7.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: "docker",
      title: "Docker",
      category: "Container Runtime",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-label="Docker">
          <rect x="6" y="10" width="3" height="2.8" stroke="currentColor" strokeWidth="1.4" />
          <rect x="9.8" y="10" width="3" height="2.8" stroke="currentColor" strokeWidth="1.4" />
          <rect x="13.6" y="10" width="3" height="2.8" stroke="currentColor" strokeWidth="1.4" />
          <rect x="9.8" y="6.5" width="3" height="2.8" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3.5 14C3.5 17.8 7 20 11.8 20C16.8 20 19.8 17.2 20.5 13.8C19.2 13.6 18.2 13.9 17.5 14.3H3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-10 overflow-hidden select-none relative">

      {/* Left and right fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-cosmo-bg to-transparent z-10" />

      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-cosmo-bg to-transparent z-10" />

      {/* Section heading */}
      <div className="max-w-6xl mx-auto px-4 mb-6 text-center">
        <span className="text-[11px] uppercase tracking-widest font-mono font-semibold text-cosmo-muted">
          Built with production-grade open source stack
        </span>
      </div>

      {/* Marquee */}
      <div className="flex overflow-hidden">
        <motion.div
          style={{ x }}
          className="flex items-center gap-12 sm:gap-16 whitespace-nowrap will-change-transform"
        >
          {techs.concat(techs).map((t, idx) => (
            <div
              key={`${t.id}-${idx}`}
              title={t.title}
              className="flex flex-col items-center justify-center gap-2.5 px-3 py-1 text-cosmo-silver/80 hover:text-white transition-colors duration-200 group shrink-0"
            >
              <div className="transition-transform duration-200 group-hover:scale-110 group-hover:text-cta">
                {t.icon}
              </div>

              <span className="text-[11px] font-mono tracking-wide text-cosmo-muted group-hover:text-cosmo-silver transition-colors">
                {t.category}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

    </section>
  );
}
