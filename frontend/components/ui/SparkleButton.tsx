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
          "px-7 py-3.5 text-base text-white",
          "bg-gradient-to-r from-green-600 to-green-500",
          "hover:from-green-500 hover:to-green-400",
          "shadow-xl shadow-green-900/40 hover:shadow-green-700/50",
          "hover:scale-105",
          // shimmer sweep overlay
          "before:absolute before:inset-0 before:-translate-x-full",
          "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "hover:before:translate-x-full before:transition-transform before:duration-700",
          disabled && "opacity-50 cursor-not-allowed hover:scale-100",
        ],
        variant === "secondary" && [
          "px-7 py-3.5 text-base",
          "glass border border-green-500/30 text-green-300",
          "hover:text-white hover:border-green-400/60 hover:scale-105",
        ],
        className
      )}
    >
      {children}
    </button>
  );
}
