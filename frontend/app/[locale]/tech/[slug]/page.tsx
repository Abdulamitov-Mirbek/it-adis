import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TechIcon } from "@/components/ui/TechLinks";
import { TECHNOLOGIES, TECH_SLUGS, getTech } from "@/lib/tech-data";

type Params = { locale: string; slug: string };

interface BuildItem {
  title: string;
  desc: string;
}
interface CareerItem {
  role: string;
  salary: string;
}
interface RoadmapItem {
  phase: string;
  detail: string;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    TECH_SLUGS.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const tech = getTech(slug);
  if (!tech) return {};

  const t = await getTranslations({ locale, namespace: "tech" });
  const name = t(`items.${tech.key}.name`);
  const tagline = t(`items.${tech.key}.tagline`);

  return {
    title: `${name} — IT ADIS`,
    description: tagline,
    openGraph: {
      title: `${name} — IT ADIS`,
      description: tagline,
      type: "article",
    },
    alternates: {
      canonical: `/${locale}/tech/${slug}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}/tech/${slug}`])
      ),
    },
  };
}

export default async function TechPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const tech = getTech(slug);
  if (!tech) notFound();

  const t = await getTranslations("tech");

  const base = `items.${tech.key}`;
  const name = t(`${base}.name`);
  const tagline = t(`${base}.tagline`);
  const what = t(`${base}.what`);
  const why = t.raw(`${base}.why`) as string[];
  const build = t.raw(`${base}.build`) as BuildItem[];
  const careers = t.raw(`${base}.careers`) as CareerItem[];
  const roadmap = t.raw(`${base}.roadmap`) as RoadmapItem[];

  const accent = tech.color;
  const others = TECHNOLOGIES.filter((x) => x.slug !== tech.slug);

  return (
    <main className="bg-dark min-h-screen">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────── */}
      <header className="relative overflow-hidden pt-28 pb-12 sm:pt-40 sm:pb-24">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-[0.13] blur-3xl"
            style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 68%)` }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(74,222,128,1) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-green-300/75 hover:text-green-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 rounded"
          >
            <ArrowLeft size={15} />
            {t("backHome")}
          </Link>

          <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-5">
            <div
              className="shrink-0 grid place-items-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl glass border"
              style={{ borderColor: `${accent}44`, color: accent }}
            >
              <TechIcon tech={tech} size={40} />
            </div>

            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em] mb-2"
                style={{ color: accent }}
              >
                {t("eyebrow")}
              </p>
              <h1 className="font-display text-[2.15rem] sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08]">
                {name}
              </h1>
            </div>
          </div>

          <p className="mt-6 text-lg sm:text-xl md:text-2xl text-green-100/82 leading-relaxed max-w-3xl">
            {tagline}
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pb-20 sm:pb-24 flex flex-col gap-14 sm:gap-24">
        {/* ── What it is ─────────────────────────────── */}
        <Section title={t("sections.what")} accent={accent}>
          <p className="text-base sm:text-lg text-green-100/82 leading-relaxed max-w-3xl">
            {what}
          </p>
        </Section>

        {/* ── Why learn it ───────────────────────────── */}
        <Section title={t("sections.why")} accent={accent}>
          <ul className="flex flex-col gap-5 max-w-3xl">
            {why.map((reason, i) => (
              <li key={i} className="flex gap-4">
                <span
                  className="shrink-0 grid place-items-center w-7 h-7 rounded-lg text-xs font-bold mt-0.5"
                  style={{ background: `${accent}1f`, color: accent }}
                >
                  {i + 1}
                </span>
                <span className="text-green-100/82 leading-relaxed">{reason}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── What you'll build ──────────────────────── */}
        <Section title={t("sections.build")} accent={accent}>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
            {build.map((item) => (
              <article
                key={item.title}
                className="glass rounded-2xl p-5 sm:p-6 border transition-colors duration-200"
                style={{ borderColor: `${accent}26` }}
              >
                <div
                  className="w-9 h-9 rounded-xl grid place-items-center mb-4"
                  style={{ background: `${accent}1f`, color: accent }}
                >
                  <Check size={17} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-green-100/75 leading-relaxed">{item.desc}</p>
              </article>
            ))}
          </div>
        </Section>

        {/* ── Careers ────────────────────────────────── */}
        <Section title={t("sections.careers")} accent={accent}>
          <div className="glass rounded-2xl border border-white/8 overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_auto] gap-4 px-5 sm:px-6 py-3 text-xs uppercase tracking-wider text-green-300/65 border-b border-white/8">
              <span>{t("role")}</span>
              <span>{t("salary")}</span>
            </div>
            {careers.map((c) => (
              <div
                key={c.role}
                className="grid sm:grid-cols-[1fr_auto] gap-1 sm:gap-4 px-5 sm:px-6 py-4 border-b border-white/5 last:border-0"
              >
                <span className="font-medium text-green-50/90">{c.role}</span>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: accent }}
                >
                  {c.salary}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-green-100/55 leading-relaxed max-w-2xl">
            {t("careerNote")}
          </p>
        </Section>

        {/* ── Roadmap ────────────────────────────────── */}
        <Section title={t("sections.roadmap")} accent={accent}>
          <ol className="relative flex flex-col gap-8 pl-8">
            <span
              className="absolute left-[7px] top-2 bottom-2 w-px"
              style={{ background: `linear-gradient(${accent}66, transparent)` }}
              aria-hidden="true"
            />
            {roadmap.map((step, i) => (
              <li key={step.phase} className="relative">
                <span
                  className="absolute -left-8 top-1.5 w-[15px] h-[15px] rounded-full border-2 bg-dark"
                  style={{ borderColor: accent }}
                  aria-hidden="true"
                />
                <h3 className="font-display font-bold text-lg">
                  <span
                    className="text-xs font-mono mr-3 opacity-70"
                    style={{ color: accent }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step.phase}
                </h3>
                <p className="mt-1.5 text-green-100/78 leading-relaxed max-w-2xl">
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── CTA ────────────────────────────────────── */}
        <section
          className="relative overflow-hidden rounded-3xl glass border p-6 sm:p-12 text-center"
          style={{ borderColor: `${accent}33` }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.14]"
            style={{
              background: `radial-gradient(circle at 50% 0%, ${accent} 0%, transparent 65%)`,
            }}
            aria-hidden="true"
          />
          <div className="relative z-10">
            <h2 className="font-display text-2xl sm:text-4xl font-bold leading-tight">
              {t("ctaTitle")}
            </h2>
            <p className="mt-3 text-green-100/78 max-w-xl mx-auto">{t("ctaBody")}</p>
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3 sm:justify-center">
              <Link
                href="/#courses"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full px-7 py-3.5 font-semibold text-dark transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dark"
                style={{ background: accent, boxShadow: `0 0 34px ${accent}44` }}
              >
                {t("ctaButton")}
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/#contact"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full px-7 py-3.5 font-semibold border border-white/15 text-green-100/82 hover:border-white/30 hover:text-green-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              >
                {t("ctaSecondary")}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Other technologies ─────────────────────── */}
        <nav aria-label={t("allTech")}>
          <h2 className="font-display text-sm uppercase tracking-[0.2em] text-green-300/65 mb-5">
            {t("allTech")}
          </h2>
          <ul className="flex flex-wrap gap-3">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/tech/${other.slug}`}
                  className="inline-flex min-h-[44px] items-center gap-2.5 rounded-full glass border border-white/12 pl-4 pr-5 py-2.5 text-sm font-medium text-green-100/82 hover:border-white/20 hover:text-green-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                >
                  <span style={{ color: other.color }}>
                    <TechIcon tech={other} size={17} />
                  </span>
                  {t(`items.${other.key}.name`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <Footer />
    </main>
  );
}

/* ── Section heading + body ──────────────────────────── */
function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl sm:text-3xl font-bold mb-6 sm:mb-7 flex items-center gap-3">
        <span
          className="w-1.5 h-7 rounded-full shrink-0"
          style={{ background: accent }}
          aria-hidden="true"
        />
        {title}
      </h2>
      {children}
    </section>
  );
}
