"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function GithubIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
function LinkedinIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
function XIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const TEACHERS = [
  { name: "Amir Seitkali",   role: "Lead Python Instructor",       bio: "10 years in backend engineering. Previously at Google. Built production systems serving 50M+ users.",          tags: ["Python", "Django", "APIs"],       initials: "AS", color: "from-green-500 to-emerald-700" },
  { name: "Diana Kozyreva",  role: "Frontend & React Expert",      bio: "Senior frontend engineer, 8 years. Ex-Figma, open-source UI libraries with 12k stars.",                          tags: ["React", "Next.js", "TypeScript"], initials: "DK", color: "from-blue-500 to-blue-700"    },
  { name: "Ruslan Bektenov", role: "JavaScript & Vibe Coding",     bio: "Full-stack developer turned educator. Built 30+ SaaS products. Shipped a startup in 4 hours.",                   tags: ["JS", "Vibe Coding", "LLMs"],      initials: "RB", color: "from-yellow-500 to-orange-600" },
];

const SOCIAL = [
  { Icon: GithubIcon,   label: "GitHub"   },
  { Icon: LinkedinIcon, label: "LinkedIn" },
  { Icon: XIcon,        label: "X"        },
];

export function Teachers() {
  const t = useTranslations("teachers");
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(headingRef.current, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
    });
    if (cardsRef.current) {
      gsap.fromTo(Array.from(cardsRef.current.children), { y: 60, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: "power3.out",
        scrollTrigger: { trigger: cardsRef.current, start: "top 85%" },
      });
    }
  }, []);

  return (
    <section ref={sectionRef} id="teachers" className="relative section-padding bg-white overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[200px] font-black text-slate-900/5 select-none pointer-events-none whitespace-nowrap" aria-hidden="true">TEAM</div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div ref={headingRef} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-green-200 text-green-700 text-sm font-medium mb-5">
            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" aria-hidden="true" />
            {t("badge")}
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            {t("title1")}{" "}
            <span className="gradient-text">{t("titleGreen")}</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-xl mx-auto">{t("subtitle")}</p>
        </div>

        <div ref={cardsRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEACHERS.map((teacher) => (
            <div key={teacher.name}
              className="group relative glass border border-slate-200 rounded-3xl p-6 hover:border-green-200 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />

              <div className="relative mb-5">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${teacher.color} flex items-center justify-center font-display text-2xl font-bold text-slate-900 shadow-xl`}>
                  {teacher.initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-600 border-2 border-dark flex items-center justify-center" aria-hidden="true">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>

              <h3 className="font-display font-bold text-slate-900 text-lg mb-1 group-hover:text-green-700 transition-colors">{teacher.name}</h3>
              <p className="text-green-700 text-xs font-medium mb-3">{teacher.role}</p>
              <p className="text-slate-600 text-sm leading-relaxed mb-5">{teacher.bio}</p>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {teacher.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-100">{tag}</span>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200">
                {SOCIAL.map(({ Icon, label }) => (
                  <button key={label} aria-label={label}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-600/40"
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
