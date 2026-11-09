import { useId } from "react";

/**
 * Krishna Medicose mark: a healthcare cross with Krishna's peacock feather.
 * Mirrors /public/brand/km-mark.svg (used for favicons and app icons).
 */
export const LogoIcon = ({ size = 40, className = "", tile = true }) => {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Krishna Medicose"
    >
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0F766E" />
          <stop offset="1" stopColor="#083344" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#99F6E4" />
          <stop offset="0.55" stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id={`${id}v`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#0E7490" />
          <stop offset="1" stopColor="#065F46" />
        </linearGradient>
        <radialGradient id={`${id}e`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#FDE68A" />
          <stop offset="1" stopColor="#F59E0B" />
        </radialGradient>
      </defs>
      {tile && <rect width="512" height="512" rx="116" fill={`url(#${id}t)`} />}
      <rect x="190" y="84" width="132" height="344" rx="66" fill={`url(#${id}c)`} />
      <rect x="84" y="190" width="344" height="132" rx="66" fill={`url(#${id}c)`} />
      <path d="M330 128 C 392 196 352 300 222 372 C 236 292 262 196 330 128 Z" fill={`url(#${id}v)`} opacity="0.92" />
      <path d="M212 392 Q 262 300 326 150" fill="none" stroke="#083344" strokeWidth="9" strokeLinecap="round" />
      <g transform="rotate(32 300 220)">
        <ellipse cx="300" cy="220" rx="36" ry="48" fill={`url(#${id}e)`} />
        <ellipse cx="300" cy="224" rx="22" ry="30" fill="#0E7490" />
        <ellipse cx="300" cy="228" rx="10" ry="14" fill="#0B1E3F" />
      </g>
    </svg>
  );
};

const SIZES = {
  sm: { icon: 36, name: "text-[17px]", sub: "text-[9.5px]" },
  md: { icon: 44, name: "text-xl", sub: "text-[11px]" },
  lg: { icon: 56, name: "text-2xl", sub: "text-xs" },
  xl: { icon: 64, name: "text-3xl", sub: "text-sm" },
};

export const FullLogo = ({ size = "md", className = "", theme = "light" }) => {
  const s = SIZES[size] || SIZES.md;
  const dark = theme === "dark";
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoIcon size={s.icon} />
      <div className="flex flex-col leading-none">
        <span className={`font-display font-extrabold tracking-tight ${s.name} ${dark ? "text-white" : "text-ink-900"}`}>
          Krishna
        </span>
        <span
          className={`font-display font-bold uppercase tracking-[0.28em] mt-1 ${s.sub} ${dark ? "text-brand-300" : "text-brand-600"}`}
        >
          Medicose
        </span>
      </div>
    </div>
  );
};
