"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) return;

    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Capture in local vars so TS knows they're non-null inside closures
    const dotEl  = dot;
    const ringEl = ring;

    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;
    let raf: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dotEl.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
    };

    const onEnter = () => {
      ringEl.style.width   = "60px";
      ringEl.style.height  = "60px";
      ringEl.style.opacity = "0.6";
    };

    const onLeave = () => {
      ringEl.style.width   = "36px";
      ringEl.style.height  = "36px";
      ringEl.style.opacity = "1";
    };

    const animate = () => {
      ringX += (mouseX - ringX - 18) * 0.12;
      ringY += (mouseY - ringY - 18) * 0.12;
      ringEl.style.transform = `translate(${ringX}px, ${ringY}px)`;
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    window.addEventListener("mousemove", onMouseMove);

    const interactables = document.querySelectorAll<Element>(
      "a, button, [data-cursor]"
    );
    interactables.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      interactables.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cursor-dot  hidden md:block" />
      <div ref={ringRef} className="cursor-ring hidden md:block" />
    </>
  );
}
