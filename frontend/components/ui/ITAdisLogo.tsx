// Real IT ADIS logo — geometric "A" with green + blue shards, "ITadis" wordmark
// Faithfully reproduced from the brand identity

interface LogoProps {
  /** total width of the rendered logo */
  width?: number;
  className?: string;
  /** show the "ОКУУ БОРБОРУ" tagline below wordmark */
  showTagline?: boolean;
  tagline?: string;
}

export function ITAdisLogo({
  width = 120,
  className = "",
  showTagline = false,
  tagline = "ОКУУ БОРБОРУ",
}: LogoProps) {
  // We use a viewBox of 0 0 200 200 for the mark + 0 0 200 260 when tagline shown
  const vbH = showTagline ? 260 : 200;

  return (
    <svg
      viewBox={`0 0 200 ${vbH}`}
      width={width}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="IT ADIS logo"
    >
      {/* ── "A" mark ─────────────────────────────────────── */}
      {/* Outer A silhouette — two legs + crossbar */}
      {/* Left green shard — outer left edge of A */}
      <polygon points="20,170 65,50 80,80 45,170"  fill="#22c55e" />
      {/* Right blue shard — outer right edge of A */}
      <polygon points="180,170 135,50 120,80 155,170" fill="#2563eb" />
      {/* Top green shard — left half of apex */}
      <polygon points="65,50 100,10 100,55 80,80"   fill="#22c55e" />
      {/* Top blue shard — right half of apex */}
      <polygon points="135,50 100,10 100,55 120,80"  fill="#2563eb" />
      {/* Inner left green fill */}
      <polygon points="80,80 100,55 100,120 82,120"  fill="#4ade80" opacity="0.85" />
      {/* Inner right blue fill */}
      <polygon points="120,80 100,55 100,120 118,120" fill="#3b82f6" opacity="0.85" />
      {/* Crossbar gap (white / transparent cutout) */}
      <rect x="55" y="118" width="90" height="14" fill="#040d07" />
      {/* ── Wordmark ─────────────────────────────────────── */}
      {/* "IT" in green */}
      <text
        x="28"
        y="210"
        fontFamily="'Space Grotesk', sans-serif"
        fontWeight="700"
        fontSize="52"
        fill="#22c55e"
        letterSpacing="-1"
      >
        IT
      </text>
      {/* "adis" in blue */}
      <text
        x="95"
        y="210"
        fontFamily="'Space Grotesk', sans-serif"
        fontWeight="700"
        fontSize="52"
        fill="#2563eb"
        letterSpacing="-1"
      >
        adis
      </text>
      {/* Optional tagline */}
      {showTagline && (
        <text
          x="100"
          y="245"
          textAnchor="middle"
          fontFamily="'Inter', sans-serif"
          fontWeight="400"
          fontSize="18"
          fill="#94a3b8"
          letterSpacing="2"
        >
          {tagline}
        </text>
      )}
    </svg>
  );
}

/** Compact single-line variant for navbar */
export function ITAdisLogoInline({
  height = 36,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 300 60"
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="IT ADIS"
    >
      {/* mini A mark */}
      <polygon points="4,52 20,8 25,18 13,52"   fill="#22c55e" />
      <polygon points="46,52 30,8 35,18 41,52"   fill="#2563eb" />
      <polygon points="20,8 25,4 28,15 25,18"    fill="#22c55e" />
      <polygon points="30,8 25,4 22,15 25,18"    fill="#2563eb" />
      <polygon points="25,18 28,15 28,35 25,35"  fill="#4ade80" opacity="0.9" />
      <polygon points="25,18 22,15 22,35 25,35"  fill="#3b82f6" opacity="0.9" />
      <rect x="14" y="34" width="28" height="4"  fill="#040d07" />
      {/* IT in green */}
      <text
        x="58"
        y="46"
        fontFamily="'Space Grotesk', sans-serif"
        fontWeight="700"
        fontSize="40"
        fill="#22c55e"
        letterSpacing="-1"
      >
        IT
      </text>
      {/* adis in blue */}
      <text
        x="116"
        y="46"
        fontFamily="'Space Grotesk', sans-serif"
        fontWeight="700"
        fontSize="40"
        fill="#2563eb"
        letterSpacing="-1"
      >
        adis
      </text>
    </svg>
  );
}
