"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const REVIEWS = [
  { name: "Kamila Asanova",      role: "Frontend Developer @ Epam",    initials: "KA", color: "from-green-500 to-emerald-700",  stars: 5, text: "IT ADIS changed my life. Before the course I was a barista with zero coding experience. 6 months later I got hired as a junior frontend dev. The projects we built were better than what most bootcamps produce.", course: "Frontend Development" },
  { name: "Marat Dzhaksybekov",  role: "Python Developer @ Kaspi",     initials: "MD", color: "from-blue-500 to-blue-700",      stars: 5, text: "The Python course is insanely practical. No slides, no theory overload — just building things from day one. My mentor pushed me harder than any university professor ever did. Worth every tenge.", course: "Python Development" },
  { name: "Sofia Nazarenko",     role: "Full-Stack Developer @ Freelance", initials: "SN", color: "from-cyan-500 to-teal-700", stars: 5, text: "Vibe Coding was a game-changer for my freelance business. I now ship projects 3x faster using AI-assisted workflows. My clients think I have a whole team behind me.", course: "Vibe Coding" },
];

export function Reviews() {
  const t          = useTranslations("reviews");
  const headingRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    gsap.fromTo(headingRef.current, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
    });
  }, []);

  const goTo = (index: number) => {
    const total = REVIEWS.length;
    setCurrent(((index % total) + total) % total);
  };

  useEffect(() => {
    const id = setInterval(() => goTo(current + 1), 5000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const visible = [-1, 0, 1].map((offset) => {
    const idx = ((current + offset) % REVIEWS.length + REVIEWS.length) % REVIEWS.length;
    return { review: REVIEWS[idx], offset };
  });

  return (
    <section id="reviews" className="relative section-padding overflow-hidden"
      style={{ background: "linear-gradient(180deg, #040d07 0%, #071a0e 50%, #040d07 100%)" }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div ref={headingRef} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-green-500/30 text-green-300 text-sm font-medium mb-5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
            {t("badge")}
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            {t("title1")}{" "}
            <span className="gradient-text">{t("titleGreen")}</span>
          </h2>
          <p className="text-green-100/70 text-lg max-w-xl mx-auto">{t("subtitle")}</p>
        </div>

        {/* Carousel */}
        <div className="relative flex items-center justify-center gap-6 min-h-[360px] overflow-hidden pb-4">
          {visible.map(({ review, offset }) => (
            <div
              key={`${review.name}-${offset}`}
              onClick={() => goTo(current + offset)}
              className={cn(
                "transition-all duration-500 cursor-pointer",
                offset === 0
                  ? "z-20 scale-100 opacity-100 w-full max-w-lg"
                  : "hidden md:block z-10 scale-90 opacity-35 hover:opacity-55 w-80 shrink-0"
              )}
            >
              <div className={cn(
                "glass border rounded-3xl p-8 relative overflow-hidden",
                offset === 0 ? "border-green-500/30 glow-green-sm" : "border-green-900/30"
              )}>
                <div className="absolute top-5 right-5 text-green-500/15" aria-hidden="true">
                  <Quote size={48} />
                </div>
                <div className="flex gap-1 mb-5" aria-label={`${review.stars} stars`}>
                  {Array.from({ length: review.stars }).map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-green-100/80 leading-relaxed mb-7 text-base relative z-10">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${review.color} flex items-center justify-center font-display font-bold text-white shrink-0`}>
                    {review.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{review.name}</div>
                    <div className="text-xs text-green-400">{review.role}</div>
                    <div className="text-xs text-green-100/78 mt-0.5">Course: {review.course}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={() => goTo(current - 1)} aria-label="Previous review"
            className="w-10 h-10 rounded-full glass border border-green-900/40 text-green-400 hover:text-green-300 hover:border-green-500/40 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-green-500/40"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-2" role="tablist" aria-label="Review navigation">
            {REVIEWS.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} role="tab" aria-selected={i === current}
                aria-label={`Go to review ${i + 1}`}
                className={cn(
                  "rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500/40",
                  i === current ? "w-6 h-2 bg-green-400" : "w-2 h-2 bg-green-900/60 hover:bg-green-700"
                )}
              />
            ))}
          </div>
          <button onClick={() => goTo(current + 1)} aria-label="Next review"
            className="w-10 h-10 rounded-full glass border border-green-900/40 text-green-400 hover:text-green-300 hover:border-green-500/40 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-green-500/40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
