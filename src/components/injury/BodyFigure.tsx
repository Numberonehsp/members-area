"use client";

import { useState } from "react";
import { regionsFor, type Region, type View } from "@/lib/injury/regions";

type Props = { selected: string[]; onToggle: (id: string) => void };

const FLIP = "translate(200 0) scale(-1 1)";

function ShapeEl({ shape }: { shape: Region["shape"] }) {
  if (shape.kind === "path") return <path d={shape.d} />;
  return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} />;
}

// Faint anatomy lines drawn over the areas: purely decorative.
const DETAIL: Record<View, string[]> = {
  front: [
    "M100 78 L100 158",
    "M80 77 Q100 85 120 77",
    "M76 100 Q100 114 124 100",
    "M84 124 L116 124",
    "M85 137 L115 137",
    "M87 149 L113 149",
    "M108 196 Q112 226 112 254",
    "M92 196 Q88 226 88 254",
  ],
  back: [
    "M100 72 L100 156",
    "M80 84 Q86 104 98 108",
    "M120 84 Q114 104 102 108",
    "M100 160 L100 192",
    "M112 200 Q116 228 114 254",
    "M88 200 Q84 228 86 254",
    "M114 292 Q118 312 116 334",
    "M86 292 Q82 312 84 334",
  ],
};

function Figure({ view, selected, onToggle, className }: { view: View; className: string } & Props) {
  const regions = regionsFor(view);
  return (
    <figure className={`flex-1 min-w-0 ${className}`}>
      <svg viewBox="0 0 200 400" className="w-full max-w-[300px] mx-auto h-auto" role="group" aria-label={`Body, ${view} view`}>
        <defs>
          <radialGradient id={`glow-${view}`} cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#1f6f86" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0c141b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="200" height="400" fill={`url(#glow-${view})`} />

        {/* Solid body underneath, so the areas read as one figure */}
        <g aria-hidden="true" fill="#15485a" stroke="#15485a" strokeWidth="4" strokeLinejoin="round">
          {regions.map((r) => (
            <g key={`base-${r.id}`} transform={r.flip ? FLIP : undefined}>
              <ShapeEl shape={r.shape} />
            </g>
          ))}
        </g>

        {/* Tappable areas */}
        {regions.map((r) => {
          const on = selected.includes(r.id);
          return (
            <g
              key={`${view}-${r.id}`}
              transform={r.flip ? FLIP : undefined}
              role="button"
              tabIndex={0}
              aria-pressed={on}
              aria-label={r.label}
              onClick={() => onToggle(r.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggle(r.id);
                }
              }}
              className={`cursor-pointer outline-none stroke-[1.5] [stroke-linejoin:round] transition-colors focus-visible:stroke-white ${
                on ? "fill-red-500/70 stroke-red-300" : "fill-sky-400/25 stroke-sky-300/60 hover:fill-sky-300/50"
              }`}
            >
              <ShapeEl shape={r.shape} />
            </g>
          );
        })}

        <g aria-hidden="true" fill="none" stroke="#bfe9f5" strokeOpacity="0.25" strokeWidth="1" strokeLinecap="round" pointerEvents="none">
          {DETAIL[view].map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </svg>
      <figcaption className="text-center text-xs text-sky-200/80 mt-1 capitalize">{view}</figcaption>
    </figure>
  );
}

// Front and back figure on a dark panel. Tap an area to select it, tap again to
// clear it. Small screens show one view at a time, larger screens show both.
export default function BodyFigure({ selected, onToggle }: Props) {
  const [view, setView] = useState<View>("front");
  const tab = (v: View) =>
    `min-h-11 px-5 rounded-lg text-sm font-medium capitalize ${view === v ? "bg-sky-400/25 text-white" : "text-sky-200/80"}`;
  return (
    <div className="rounded-2xl bg-[#0c141b] p-3">
      <div className="flex justify-center gap-2 mb-2 md:hidden" role="tablist" aria-label="Body view">
        {(["front", "back"] as View[]).map((v) => (
          <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)} className={tab(v)}>
            {v}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Figure view="front" selected={selected} onToggle={onToggle} className={view === "front" ? "" : "hidden md:block"} />
        <Figure view="back" selected={selected} onToggle={onToggle} className={view === "back" ? "" : "hidden md:block"} />
      </div>
      <p className="text-center text-[11px] text-sky-200/60 mt-1">Red areas are selected.</p>
    </div>
  );
}
