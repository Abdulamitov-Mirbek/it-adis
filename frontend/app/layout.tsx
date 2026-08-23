import type { Metadata } from "next";

// Root layout — minimal, no html/body here; locale layout handles that.
// It does own the metadataBase, because app/opengraph-image.tsx sits at this
// level: without an absolute base URL Next cannot resolve the share image and
// social platforms drop the preview silently. Set NEXT_PUBLIC_SITE_URL to the
// production domain at deploy time.
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
