import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "sample" | "success" | "danger" | "warning" | "info" | "neutral" | "section";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  size = "sm",
  className = "",
}: BadgeProps) {
  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-[11px]",
    md: "px-3.5 py-1 text-xs",
  };

  const variantStyles = {
    sample:
      "bg-amber-500/10 text-cosmo-gold border border-amber-400/30 uppercase tracking-wider font-mono backdrop-blur-sm",
    section:
      "bg-white/5 text-cosmo-silver border border-white/10 uppercase tracking-widest font-mono shadow-[inset_0_0_2px_1px_rgba(255,255,255,0.06)] backdrop-blur-md",
    success:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
    danger:
      "bg-rose-500/10 text-rose-400 border border-rose-500/25",
    warning:
      "bg-amber-500/10 text-amber-400 border border-amber-500/25",
    info:
      "bg-cosmo-blue/15 text-blue-300 border border-cosmo-blue/30",
    neutral:
      "bg-white/10 text-cosmo-silver border border-white/15",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-pill ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
