"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const LOCALES = [
  { code: "en", label: "EN", full: "English" },
  { code: "ru", label: "RU", full: "Русский" },
  { code: "kg", label: "KG", full: "Кыргызча" },
] as const;

export function LanguageSwitcher() {
  const locale  = useLocale();
  const router  = useRouter();
  const path    = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchLocale = (code: string) => {
    setOpen(false);
    // Replace /en/ or /ru/ or /kg/ prefix in path
    const segments = path.split("/");
    segments[1] = code;
    router.push(segments.join("/") || "/");
  };

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200",
          "glass border border-slate-200 text-green-700 hover:text-slate-600 hover:border-green-200",
          open && "border-green-200 text-slate-600"
        )}
        aria-label="Switch language"
      >
        <span>{current.label}</span>
        <ChevronDown
          size={13}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-36 glass border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-black/30 z-50">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => switchLocale(l.code)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-150",
                l.code === locale
                  ? "text-green-700 bg-green-50"
                  : "text-slate-500 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              <span className="font-semibold">{l.label}</span>
              <span className="text-xs opacity-60">{l.full}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
