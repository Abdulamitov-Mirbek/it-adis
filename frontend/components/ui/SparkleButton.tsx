"use client";

import { useRef, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SparkleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
  disabled?: boolean;
}

// Tiny sparkle particle
function createSparkle(x: number, y: number, container: HTMLElement) {
  const sparkle = document.createElement("span");
  const size = Math.random() * 10 + 6; // 6–16 px
  const tx   = (Math.random() - 0.5) * 80;
  const ty   = (Math.random() - 0.5) * 80;
  const hue  = Math.random() > 0.5 ? "120" : "210"; // green or blue

  sparkle.style.cssText = `
    position:absolute;
    left:${x}px;
    top:${y}px;
    width:${size}px;
    height:${size}px;
    border-radius:50%;
    background:hsl(${hue},90%,65%);
    pointer-events:none;
    z-index:10;
    transform:translate(-50%,-50%) scale(1);
    animation:sparkle-fly 600ms ease-out forwards;
    --tx:${tx}px;
    --ty:${ty}px;
  `;
  container.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 620);
}

export function SparkleButton({
  children,
  onClick,
  className,
  variant = "primary",
  type = "button",
  disabled = false,
}: SparkleButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (let i = 0; i < 10; i++) {
      setTimeout(() => createSparkle(x, y, btn), i * 30);
    }
    onClick?.();
  };

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-300",
        "active:scale-95",
        variant === "primary" && [
          // White label on a deep green fill. The dark theme used bright
          // green-500 with near-black text, which was right there and wrong
          // here. Both gradient stops are green-700 or darker so white clears
          // 4.5:1 — green-600 only reaches 3.3:1, and a 16px semibold button
          // label counts as normal text, not large.
          "px-7 py-3.5 text-base text-white",
          "bg-gradient-to-r from-green-800 to-green-700",
          "hover:from-green-900 hover:to-green-800",
          // A tinted shadow in the button's own hue, not the old
          // `shadow-xl shadow-green-900/40`, which on white rendered as a
          // detached dark-green blob sitting under every CTA on the site.
          "shadow-[0_4px_14px_rgba(21,128,61,0.28)] hover:shadow-[0_8px_24px_rgba(21,128,61,0.34)]",
          "hover:-translate-y-0.5",
          // Shimmer sweep. The migration rewrote the old `via-white/20` to
          // `via-slate-200`, which swept a grey band across the fill instead of
          // a highlight — it needs to stay white and translucent.
          "before:absolute before:inset-0 before:-translate-x-full",
          "before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent",
          "hover:before:translate-x-full before:transition-transform before:duration-700",
          disabled && "opacity-50 cursor-not-allowed hover:translate-y-0",
        ],
        variant === "secondary" && [
          "px-7 py-3.5 text-base",
          // Hover previously went to near-black text, which read as the label
          // graying out rather than as a hover state.
          "bg-white border border-slate-200 text-green-700 shadow-soft",
          "hover:border-green-300 hover:bg-green-50 hover:text-green-800",
          "hover:-translate-y-0.5",
        ],
        className
      )}
    >
      {children}
    </button>
  );
}
