import Link from "next/link";

// ─── StaticLogo — server-safe, zero JS animations ─────────────────────────────
// Use for: SSR-only pages, email templates, og-image generation, print CSS.
// Identical visual design to AnimatedLogo but no Framer Motion dependency.

export type LogoTheme = "light" | "dark";
export type LogoSize  = "sm" | "md" | "lg";

interface StaticLogoProps {
  theme?:     LogoTheme;
  size?:      LogoSize;
  href?:      string;
  className?: string;
  showText?:  boolean;
}

const SIZES: Record<LogoSize, { px: number; text: string; gap: string }> = {
  sm: { px: 28, text: "text-[15px]", gap: "gap-2"   },
  md: { px: 36, text: "text-xl",     gap: "gap-2.5" },
  lg: { px: 52, text: "text-[28px]", gap: "gap-3.5" },
};

const M_STROKE   = "M15,78 C15,62 17,32 18,18 C28,24 48,46 50,52 C72,24 52,46 82,18 C83,32 85,62 85,78";
const ORBIT_ARC  = "M78,68 A39,29,0,0,0,89,47 A39,29,0,0,0,50,18 A39,29,0,0,0,11,47 A39,29,0,0,0,22,68";
const PLANE_PATH = "M7,0 L-5,-2.8 L-3.5,0 L-5,2.8 Z";

export default function StaticLogo({
  theme     = "light",
  size      = "md",
  href      = "/",
  className = "",
  showText  = true,
}: StaticLogoProps) {
  const { px, text, gap } = SIZES[size];
  const isDark    = theme === "dark";
  const mColor    = isDark ? "#f8fafc" : "#0F172A";
  const textColor = isDark ? "text-white" : "text-[#0F172A]";

  const mark = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      overflow="visible"
    >
      <defs>
        <linearGradient id="sl-gr" x1="11" y1="18" x2="89" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.9"  />
          <stop offset="50%"  stopColor="#f97316" stopOpacity="1"    />
          <stop offset="100%" stopColor="#ea580c" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path d={ORBIT_ARC} stroke="url(#sl-gr)" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.28" />
      <path d={M_STROKE}  stroke={mColor} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Plane parked at rightmost orbit point, facing up (CCW orbit direction) */}
      <g transform="translate(89,47) rotate(-90)">
        <path d={PLANE_PATH} fill="#f97316" opacity="0.9" />
      </g>
    </svg>
  );

  if (!showText) {
    return (
      <Link href={href} aria-label="MaghrebVoyage" className={`inline-flex ${className}`}>
        {mark}
      </Link>
    );
  }

  return (
    <Link href={href} aria-label="MaghrebVoyage" className={`flex items-center ${gap} ${className}`}>
      {mark}
      <span className={`font-black tracking-tight ${text} ${textColor} select-none`}>
        Maghreb<span className="text-orange-500">Voyage</span>
      </span>
    </Link>
  );
}
