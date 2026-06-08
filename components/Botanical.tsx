/**
 * Hand-drawn-feel botanical line art and ornaments used across the site.
 * All strokes inherit `currentColor` so they can be tinted from CSS.
 */

import type { ReactNode } from "react";

export function Sprig({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 220"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M60 214 C60 150 60 90 60 8" />
      {[
        [60, 36],
        [60, 70],
        [60, 104],
        [60, 138],
        [60, 172],
      ].map(([x, y], i) => (
        <g key={y}>
          <path d={`M${x} ${y} C${x + 22} ${y - 8} ${x + 40} ${y + 6} ${x + 44} ${y + 26}`} />
          <path
            d={`M${x} ${y} C${x + 24} ${y + 4} ${x + 36} ${y + 18} ${x + 38} ${y + 30} C${x + 24} ${y + 26} ${x + 8} ${y + 18} ${x} ${y}`}
            fill="currentColor"
            fillOpacity={i % 2 ? 0.1 : 0.16}
          />
          <path d={`M${x} ${y + 6} C${x - 22} ${y - 2} ${x - 40} ${y + 12} ${x - 44} ${y + 32}`} />
          <path
            d={`M${x} ${y + 6} C${x - 24} ${y + 10} ${x - 36} ${y + 24} ${x - 38} ${y + 36} C${x - 24} ${y + 32} ${x - 8} ${y + 24} ${x} ${y + 6}`}
            fill="currentColor"
            fillOpacity={i % 2 ? 0.16 : 0.1}
          />
        </g>
      ))}
      <path d="M60 8 C54 2 66 2 60 8" fill="currentColor" fillOpacity="0.18" />
    </svg>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`divider ${className}`.trim()} role="presentation">
      <span className="divider-line" />
      <svg
        className="divider-mark"
        viewBox="0 0 64 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M32 6 C32 18 32 26 32 34" />
        <path d="M32 14 C24 10 16 12 10 18 C18 22 26 22 32 18" fill="currentColor" fillOpacity="0.14" />
        <path d="M32 14 C40 10 48 12 54 18 C46 22 38 22 32 18" fill="currentColor" fillOpacity="0.14" />
        <path d="M32 24 C26 21 20 22 15 27 C21 30 27 30 32 27" fill="currentColor" fillOpacity="0.1" />
        <path d="M32 24 C38 21 44 22 49 27 C43 30 37 30 32 27" fill="currentColor" fillOpacity="0.1" />
        <circle cx="32" cy="5" r="2.4" fill="currentColor" fillOpacity="0.5" stroke="none" />
      </svg>
      <span className="divider-line" />
    </div>
  );
}

const icons: Record<string, ReactNode> = {
  rings: (
    <>
      <circle cx="9" cy="14" r="6" />
      <circle cx="15" cy="14" r="6" />
      <path d="M9 5 l3 3 l3 -3 l-3 -2 Z" fill="currentColor" fillOpacity="0.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 9 h18 M8 3 v4 M16 3 v4" />
      <circle cx="8.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  pin: (
    <>
      <path d="M12 22 C12 22 5 14.5 5 9.5 A7 7 0 0 1 19 9.5 C19 14.5 12 22 12 22 Z" />
      <circle cx="12" cy="9.5" r="2.6" />
    </>
  ),
  dress: (
    <>
      <path d="M9 3 h6 l-1 4 c3 2 4 8 4 14 H6 c0 -6 1 -12 4 -14 Z" />
      <path d="M9 3 c1 2 5 2 6 0" />
      <path d="M12 7 v14" strokeOpacity="0.5" />
    </>
  ),
  bus: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2.5" />
      <path d="M3 11 h18 M8 5 v6 M16 5 v6" />
      <circle cx="8" cy="19" r="1.6" />
      <circle cx="16" cy="19" r="1.6" />
    </>
  ),
};

export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <svg
      className={`line-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}
