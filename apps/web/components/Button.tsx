"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  withArrow?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  href,
  withArrow = false,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] select-none rounded-pill focus-visible:outline-none";

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3.5 text-base gap-2.5",
  };

  // Orange is reserved ONLY for primary conversion buttons
  const variantStyles = {
    primary:
      "bg-cta hover:bg-cta-hover text-white shadow-glow hover:shadow-lg hover:shadow-cta/40 group border border-white/15",
    secondary:
      "bg-warm-ink hover:bg-black text-white dark:bg-white/10 dark:hover:bg-white/15 dark:border dark:border-white/15 backdrop-blur-md shadow-[inset_0_0_2px_1px_rgba(255,255,255,0.08)]",
    outline:
      "border border-warm-border hover:border-warm-muted/60 text-warm-ink bg-white/80 hover:bg-white dark:border-white/15 dark:hover:border-white/30 dark:text-white dark:bg-cosmo-surface/60 dark:hover:bg-cosmo-surface backdrop-blur-md",
    ghost:
      "text-warm-muted hover:text-warm-ink hover:bg-warm-border/50 dark:text-cosmo-muted dark:hover:text-white dark:hover:bg-white/5",
  };

  const combinedClasses = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  const content = (
    <>
      <span>{children}</span>
      {withArrow && (
        <span className="w-5 h-5 rounded-full bg-white text-cta flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
          <ArrowRight className="w-3 h-3 stroke-[2.5]" />
        </span>
      )}
    </>
  );

  if (href) {
    const isExternal = href.startsWith("http");
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={combinedClasses}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={combinedClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {content}
    </button>
  );
}
