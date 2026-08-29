"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, MapPin, Navigation } from "lucide-react";

/**
 * The two IT ADIS campuses in Bishkek.
 *
 * Coordinates come from the 2GIS place pages the short links resolve to, so the
 * OpenStreetMap embed and the "Open in 2GIS" button always point at the same
 * door. OSM is used for the inline frame because it needs no API key; the 2GIS
 * link is kept alongside it since that is what people here actually navigate
 * with.
 */
const BRANCHES = [
  {
    id: "branch1",
    lat: 42.880189,
    lon: 74.588257,
    twogis: "https://go.2gis.com/mo1pG",
  },
  {
    id: "branch2",
    lat: 42.880557,
    lon: 74.623709,
    twogis: "https://go.2gis.com/dwDxu",
  },
] as const;

/** Half-width of the embed viewport, in degrees — roughly a 500 m box. */
const SPAN_LON = 0.006;
const SPAN_LAT = 0.003;

function embedUrl(lat: number, lon: number) {
  const bbox = [lon - SPAN_LON, lat - SPAN_LAT, lon + SPAN_LON, lat + SPAN_LAT].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

function directionsUrl(lat: number, lon: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

export function BranchMap() {
  const t = useTranslations("contact.map");
  const [active, setActive] = useState<(typeof BRANCHES)[number]["id"]>("branch1");
  const branch = BRANCHES.find((b) => b.id === active) ?? BRANCHES[0];

  return (
    <div className="mt-16">
      <div className="flex flex-col gap-2 mb-7">
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">{t("title")}</h3>
        <p className="text-slate-600 text-sm sm:text-base">{t("subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        {/* Map */}
        <div className="glass border border-slate-200 rounded-3xl overflow-hidden relative h-[300px] sm:h-[420px]">
          <iframe
            key={branch.id}
            title={t(`${branch.id}` as "branch1")}
            src={embedUrl(branch.lat, branch.lon)}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-slate-900/5"
            aria-hidden="true"
          />
        </div>

        {/* Branch picker */}
        <div className="flex flex-col gap-4">
          {BRANCHES.map((b) => {
            const isActive = b.id === active;
            return (
              <div
                key={b.id}
                className={`glass rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 border ${
                  isActive
                    ? "border-green-300 bg-green-50 ring-1 ring-green-600/15"
                    : "border-slate-200 hover:border-green-200"
                }`}
              >
                {/* Selecting a branch is the card's own control rather than a
                    click handler on the wrapper, so the 2GIS and directions
                    links below stay independently focusable. */}
                <button
                  type="button"
                  onClick={() => setActive(b.id)}
                  aria-pressed={isActive}
                  className="flex items-start gap-3 text-left rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600/40"
                >
                  <span
                    className={`p-2.5 rounded-xl shrink-0 ${
                      isActive ? "bg-green-100 text-green-700" : "bg-green-50 text-green-700"
                    }`}
                    aria-hidden="true"
                  >
                    <MapPin size={18} />
                  </span>
                  <span className="block">
                    <span className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                      {t(`${b.id}` as "branch1")}
                      {isActive && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse-green"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span className="block text-sm text-slate-600 mt-0.5">
                      {t(`${b.id}Addr` as "branch1Addr")}
                    </span>
                  </span>
                </button>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={b.twogis}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-green-600/40"
                  >
                    <ExternalLink size={13} aria-hidden="true" />
                    {t("open")}
                  </a>
                  <a
                    href={directionsUrl(b.lat, b.lon)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:border-green-200 hover:text-green-700 transition-all focus:outline-none focus:ring-2 focus:ring-green-600/40"
                  >
                    <Navigation size={13} aria-hidden="true" />
                    {t("directions")}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
