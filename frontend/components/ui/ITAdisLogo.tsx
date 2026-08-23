/**
 * IT ADIS logo — geometric "A" mark with green + blue facets, "ITadis" wordmark.
 *
 * Two rules govern this file, both learned from the previous version's bugs:
 *
 * 1. No shape may be filled with a background colour. The old mark punched its
 *    crossbar gap with a `#040d07` rectangle, which is invisible only against
 *    the dark theme and shows as a black bar anywhere else. Here the gap is
 *    genuine empty space between polygons, so the mark composites correctly
 *    onto any surface.
 * 2. No text depends on a webfont. The old wordmark used <text> with Space
 *    Grotesk, so it reflowed or overflowed wherever that font had not loaded —
 *    favicons, OG images, e-mail, blocked-font browsers. Every glyph below is
 *    drawn from geometry.
 */

const GREEN = "#22c55e";
const GREEN_LIGHT = "#4ade80";
const BLUE = "#2563eb";
const BLUE_LIGHT = "#3b82f6";

type Variant = "color" | "mono";

interface Palette {
  green: string;
  greenLight: string;
  blue: string;
  blueLight: string;
}

function palette(variant: Variant): Palette {
  return variant === "mono"
    ? {
        green: "currentColor",
        greenLight: "currentColor",
        blue: "currentColor",
        blueLight: "currentColor",
      }
    : { green: GREEN, greenLight: GREEN_LIGHT, blue: BLUE, blueLight: BLUE_LIGHT };
}

/* ── The "A" mark ─────────────────────────────────────────
   Drawn in a 160 × 170 box. Four filled polygons, mirrored
   exactly about x = 80:
     · left leg + right leg   (outer stroke of the A)
     · left + right crossbar  (the bar joining the legs)
   The triangular counter above the crossbar and the open
   space below it are transparent — nothing is painted there.
   ──────────────────────────────────────────────────────── */
function MarkShapes({ p }: { p: Palette }) {
  return (
    <>
      {/* Left leg — outer edge (80,4)→(4,170), inner edge (80,52)→(46,170) */}
      <polygon points="80,4 80,52 46,170 4,170" fill={p.green} />
      {/* Right leg — exact mirror */}
      <polygon points="80,4 80,52 114,170 156,170" fill={p.blue} />

      {/* Apex facets — brighter shards that give the mark its faceted identity */}
      <polygon points="80,4 80,52 58,52" fill={p.greenLight} />
      <polygon points="80,4 80,52 102,52" fill={p.blueLight} />

      {/* Crossbar, split down the centreline. Its edges follow the legs'
          inner slopes so the joins are seamless at any size. */}
      <polygon points="62.7,112 80,112 80,134 56.4,134" fill={p.green} />
      <polygon points="80,112 97.3,112 103.6,134 80,134" fill={p.blue} />
    </>
  );
}

/* ── The "ITadis" wordmark ────────────────────────────────
   Drawn in a 200 × 52 box, baseline at y = 52.
   Cap height 52, x-height 38, stroke weight 11 throughout.
   Round letters use stroked circles/paths rather than
   even-odd rings — same geometry, far fewer rendering
   edge cases across engines.
   ──────────────────────────────────────────────────────── */
function WordmarkShapes({ p }: { p: Palette }) {
  return (
    <>
      {/* ── "IT" ── */}
      <rect x="0" y="0" width="11" height="52" fill={p.green} />
      <rect x="15" y="0" width="40" height="11" fill={p.green} />
      <rect x="29.5" y="0" width="11" height="52" fill={p.green} />

      {/* ── "a" — bowl + right stem ── */}
      <circle
        cx="86"
        cy="33"
        r="13.5"
        fill="none"
        stroke={p.blue}
        strokeWidth="11"
      />
      <rect x="94" y="14" width="11" height="38" fill={p.blue} />

      {/* ── "d" — bowl + full-height stem ── */}
      <circle
        cx="128"
        cy="33"
        r="13.5"
        fill="none"
        stroke={p.blue}
        strokeWidth="11"
      />
      <rect x="136" y="0" width="11" height="52" fill={p.blue} />

      {/* ── "i" — stem + dot ── */}
      <rect x="151" y="14" width="11" height="38" fill={p.blue} />
      <circle cx="156.5" cy="5.5" r="5.5" fill={p.blue} />

      {/* ── "s" — stroked spine ── */}
      <path
        d="M194.5 25.5 C194.5 19.5 171.5 19.5 171.5 27 C171.5 33 194.5 33 194.5 39 C194.5 46.5 171.5 46.5 171.5 40.5"
        fill="none"
        stroke={p.blue}
        strokeWidth="11"
        strokeLinecap="round"
      />
    </>
  );
}

/* ── Mark only ───────────────────────────────────────────── */
export function ITAdisMark({
  size = 40,
  variant = "color",
  className = "",
  title = "IT ADIS",
}: {
  size?: number;
  variant?: Variant;
  className?: string;
  title?: string;
}) {
  const p = palette(variant);
  return (
    <svg
      viewBox="0 0 160 170"
      width={size}
      height={(size * 170) / 160}
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <MarkShapes p={p} />
    </svg>
  );
}

/* ── Stacked lockup: mark above wordmark ─────────────────── */
export function ITAdisLogo({
  width = 120,
  variant = "color",
  className = "",
  showTagline = false,
  tagline = "ОКУУ БОРБОРУ",
}: {
  width?: number;
  variant?: Variant;
  className?: string;
  showTagline?: boolean;
  tagline?: string;
}) {
  const p = palette(variant);
  const vbH = showTagline ? 290 : 250;

  return (
    <svg
      viewBox={`0 0 200 ${vbH}`}
      width={width}
      height={(width * vbH) / 200}
      className={className}
      role="img"
      aria-label={showTagline ? `IT ADIS — ${tagline}` : "IT ADIS"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(20 0)">
        <MarkShapes p={p} />
      </g>
      <g transform="translate(0 190)">
        <WordmarkShapes p={p} />
      </g>
      {showTagline && (
        // The tagline is the one place a webfont is acceptable: it is
        // supporting copy, and a fallback sans degrades it gracefully
        // rather than breaking the brand mark itself.
        <text
          x="100"
          y="278"
          textAnchor="middle"
          fontFamily="var(--font-inter), Inter, system-ui, sans-serif"
          fontSize="17"
          letterSpacing="2.5"
          fill={variant === "mono" ? "currentColor" : "#94a3b8"}
        >
          {tagline}
        </text>
      )}
    </svg>
  );
}

/* ── Horizontal lockup for navbar / footer ───────────────── */
export function ITAdisLogoInline({
  height = 36,
  variant = "color",
  className = "",
}: {
  height?: number;
  variant?: Variant;
  className?: string;
}) {
  const p = palette(variant);
  return (
    <svg
      viewBox="0 0 170 56"
      height={height}
      width={(height * 170) / 56}
      className={className}
      role="img"
      aria-label="IT ADIS"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(0 6) scale(0.2588)">
        <MarkShapes p={p} />
      </g>
      <g transform="translate(52 13) scale(0.577)">
        <WordmarkShapes p={p} />
      </g>
    </svg>
  );
}
