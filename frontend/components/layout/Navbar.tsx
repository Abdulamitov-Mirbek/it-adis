"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { gsap } from "gsap";
import { ITAdisLogoInline } from "@/components/ui/ITAdisLogo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { SparkleButton } from "@/components/ui/SparkleButton";

export function Navbar() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const NAV_LINKS = [
    { label: t("home"),     href: "#home" },
    { label: t("courses"),  href: "#courses" },
    { label: t("about"),    href: "#about" },
    { label: t("teachers"), href: "#teachers" },
    { label: t("reviews"),  href: "#reviews" },
    { label: t("contact"),  href: "#contact" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!navRef.current) return;
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.2 }
    );
  }, []);

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav
        ref={navRef}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "glass border-b border-green-900/40 py-3 shadow-lg shadow-black/20"
            : "bg-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* ── Logo ──────────────────────────────── */}
            <button
              onClick={() => scrollTo("#home")}
              className="flex items-center group"
              aria-label="IT ADIS home"
            >
              <div className="relative">
                <ITAdisLogoInline height={34} />
                {/* subtle glow behind logo */}
                <div className="absolute inset-0 bg-green-500 blur-2xl opacity-0 group-hover:opacity-10 transition-opacity rounded-full pointer-events-none" />
              </div>
            </button>

            {/* ── Desktop nav ───────────────────────── */}
            <ul className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className="relative px-4 py-2 text-sm font-medium text-green-100/70 hover:text-green-300 transition-colors duration-200 group"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-green-400 group-hover:w-3/4 transition-all duration-300 rounded-full" />
                  </button>
                </li>
              ))}
            </ul>

            {/* ── Right controls ────────────────────── */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher />
              <SparkleButton
                onClick={() => scrollTo("#contact")}
                className="px-5 py-2 text-sm"
              >
                {t("apply")}
              </SparkleButton>
            </div>

            {/* ── Mobile toggle ─────────────────────── */}
            <div className="md:hidden flex items-center gap-2">
              <LanguageSwitcher />
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-green-300 hover:text-green-400 hover:bg-green-900/20 transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile fullscreen menu ──────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-40 flex flex-col md:hidden transition-all duration-500",
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="absolute inset-0 bg-dark/95 backdrop-blur-2xl" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-7 px-8">
          <ITAdisLogoInline height={40} />
          {NAV_LINKS.map((link, i) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-3xl font-display font-bold text-green-100/80 hover:text-green-400 transition-colors"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              {link.label}
            </button>
          ))}
          <SparkleButton onClick={() => scrollTo("#contact")} className="mt-2 px-8 py-3 text-base">
            {t("apply")}
          </SparkleButton>
        </div>
      </div>
    </>
  );
}
