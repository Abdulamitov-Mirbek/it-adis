"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Mail, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { SparkleButton } from "@/components/ui/SparkleButton";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { BranchMap } from "@/components/sections/BranchMap";
import { BRANCH_2GIS_MAIN, CONTACT_EMAIL, CONTACT_PHONE_HREF } from "@/lib/contact";

gsap.registerPlugin(ScrollTrigger);

export function Contact() {
  const t          = useTranslations("contact");
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef    = useRef<HTMLDivElement>(null);
  const rightRef   = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", program: "", message: "" });
  const [programs, setPrograms] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const courses = await api.getCourses();
        const programNames = courses
          .filter(course => course.isActive)
          .sort((a, b) => a.order - b.order)
          .map(course => course.title);
        setPrograms(programNames);
      } catch (err) {
        console.error('Failed to fetch programs:', err);
        // Fallback to hardcoded programs
        setPrograms([
          "Python Development",
          "JavaScript & TypeScript",
          "Frontend Development",
          "Vibe Coding",
          "Flutter & Mobile Development",
        ]);
      }
    };

    fetchPrograms();
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    gsap.fromTo(leftRef.current, { x: -60, opacity: 0 }, {
      x: 0, opacity: 1, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
    });
    gsap.fromTo(rightRef.current, { x: 60, opacity: 0 }, {
      x: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 0.15,
      scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await api.submitApplication(form);
      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", program: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
      console.error('Application submission failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "px-4 py-3 rounded-xl bg-white/5 border border-green-900/40 text-white placeholder-green-100/30 text-sm focus:outline-none focus:border-green-500/60 focus:bg-white/8 transition-all";

  return (
    <section ref={sectionRef} id="contact" className="relative section-padding bg-dark overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #22c55e, transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
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

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Info */}
          <div ref={leftRef} className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              {[
                { Icon: Mail,   label: t("email"),   value: t("emailVal"),   sub: t("emailSub"),   href: `mailto:${CONTACT_EMAIL}` },
                { Icon: Phone,  label: t("phone"),   value: t("phoneVal"),   sub: t("phoneSub"),   href: `tel:${CONTACT_PHONE_HREF}` },
                { Icon: MapPin, label: t("address"), value: t("addressVal"), sub: t("addressSub"), href: BRANCH_2GIS_MAIN },
              ].map(({ Icon, label, value, sub, href }) => (
                <a
                  key={label}
                  href={href}
                  {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex items-start gap-4 glass border border-green-900/30 rounded-2xl p-5 hover:border-green-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-green-500/40"
                >
                  <div className="p-3 rounded-xl bg-green-500/10 text-green-400 shrink-0" aria-hidden="true">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-green-400 font-medium mb-0.5">{label}</div>
                    <div className="font-semibold text-white">{value}</div>
                    <div className="text-xs text-green-100/78 mt-0.5">{sub}</div>
                  </div>
                </a>
              ))}
            </div>

          </div>

          {/* Form */}
          <div ref={rightRef}>
            {submitted ? (
              <div className="glass border border-green-500/30 rounded-3xl p-12 flex flex-col items-center justify-center gap-5 text-center min-h-[500px]">
                <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center animate-pulse-green">
                  <CheckCircle2 size={36} className="text-green-400" aria-hidden="true" />
                </div>
                <h3 className="font-display text-2xl font-bold text-white">{t("success.title")}</h3>
                <p className="text-green-100/75 max-w-sm">{t("success.desc")}</p>
                <button onClick={() => setSubmitted(false)}
                  className="mt-2 px-6 py-3 rounded-xl text-sm font-medium glass border border-green-500/30 text-green-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-green-500/40"
                >
                  {t("success.again")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass border border-green-900/30 rounded-3xl p-8 flex flex-col gap-5" noValidate>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-sm font-medium text-green-100/70">{t("form.name")} *</label>
                    <input id="name" type="text" name="name" value={form.name} onChange={handleChange} required placeholder={t("form.namePh")} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-sm font-medium text-green-100/70">{t("form.email")} *</label>
                    <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required placeholder={t("form.emailPh")} className={inputCls} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="phone" className="text-sm font-medium text-green-100/70">{t("form.phone")}</label>
                  <input id="phone" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder={t("form.phonePh")} className={inputCls} />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="program" className="text-sm font-medium text-green-100/70">{t("form.program")} *</label>
                  <select id="program" name="program" value={form.program} onChange={handleChange} required
                    className="px-4 py-3 rounded-xl bg-dark-card border border-green-900/40 text-white text-sm focus:outline-none focus:border-green-500/60 transition-all appearance-none"
                  >
                    <option value="" disabled>{t("form.programPh")}</option>
                    {programs.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-sm font-medium text-green-100/70">{t("form.message")}</label>
                  <textarea id="message" name="message" value={form.message} onChange={handleChange} rows={4}
                    placeholder={t("form.messagePh")}
                    className={cn(inputCls, "resize-none")}
                  />
                </div>

                <SparkleButton type="submit" disabled={loading} className="py-4 text-base w-full justify-center">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : t("form.submit")}
                </SparkleButton>

                {error && (
                  <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <p className="text-xs text-center text-green-100/75">{t("form.privacy")}</p>
              </form>
            )}
          </div>
        </div>

        <BranchMap />
      </div>
    </section>
  );
}
