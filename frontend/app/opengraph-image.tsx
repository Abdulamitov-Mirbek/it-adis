import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "IT ADIS — Advanced Digital Innovation School";

// The mark is embedded as a data URI rather than inline SVG children: Satori
// (which renders this image) handles <img src="data:image/svg+xml"> far more
// predictably than arbitrary nested SVG geometry.
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 170" width="160" height="170">
  <polygon points="80,4 80,52 46,170 4,170" fill="#22c55e"/>
  <polygon points="80,4 80,52 114,170 156,170" fill="#2563eb"/>
  <polygon points="80,4 80,52 58,52" fill="#4ade80"/>
  <polygon points="80,4 80,52 102,52" fill="#3b82f6"/>
  <polygon points="62.7,112 80,112 80,134 56.4,134" fill="#22c55e"/>
  <polygon points="80,112 97.3,112 103.6,134 80,134" fill="#2563eb"/>
</svg>`;

const markSrc = `data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 20%, #0d2818 0%, #040d07 55%, #030a06 100%)",
        }}
      >
        <img src={markSrc} width={150} height={159} alt="" />

        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: -3,
          }}
        >
          <span style={{ color: "#22c55e" }}>IT</span>
          <span style={{ color: "#3b82f6" }}>adis</span>
        </div>

        <div
          style={{
            marginTop: 14,
            fontSize: 32,
            color: "#bbf7d0",
            opacity: 0.85,
          }}
        >
          Advanced Digital Innovation School
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 24,
            color: "#4ade80",
            letterSpacing: 4,
          }}
        >
          PYTHON · JAVASCRIPT · FRONTEND · AI · DATA
        </div>
      </div>
    ),
    size
  );
}
