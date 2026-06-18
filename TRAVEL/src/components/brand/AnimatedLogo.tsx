"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useId, useState } from "react";

// ─── Public API ───────────────────────────────────────────────────────────────
export type LogoVariant = "full" | "icon" | "loading";
export type LogoTheme   = "light" | "dark";
export type LogoSize    = "sm" | "md" | "lg";

interface AnimatedLogoProps {
  variant?:          LogoVariant;
  theme?:            LogoTheme;
  size?:             LogoSize;
  href?:             string;
  className?:        string;
  disableAnimation?: boolean;
}

const SIZES: Record<LogoSize, { px: number; text: string; gap: string }> = {
  sm: { px: 28, text: "text-[15px]", gap: "gap-2"   },
  md: { px: 36, text: "text-xl",     gap: "gap-2.5" },
  lg: { px: 52, text: "text-[28px]", gap: "gap-3.5" },
};

// ─── "Orbital M" geometry ─────────────────────────────────────────────────────
//
//  ViewBox: 0 0 100 100
//
//  M — custom bezier letterform, not a font.
//  Slightly concave diagonals + inward-tapering legs = "carved" luxury feel.
//    Left leg:  (15,78) → (18,18)   slight inward lean at peak
//    L-diagonal:(18,18) → (50,52)   gently concave (bows toward x=50)
//    R-diagonal:(50,52) → (82,18)   symmetric concave
//    Right leg: (82,18) → (85,78)
//
//  Orbit ellipse — center (50,47), rx=39, ry=29, CCW direction
//  Full closed path (for animateMotion):
//    right → top → left → bottom → right
//  Partial visual arc 270°, gap at bottom:
//    from lower-right (78,68) → over top → lower-left (22,68)
//
//  Plane — abstract motion symbol, auto-rotates with path tangent
// ─────────────────────────────────────────────────────────────────────────────

const M_STROKE =
  "M15,78 C15,62 17,32 18,18 C28,24 48,46 50,52 C72,24 52,46 82,18 C83,32 85,62 85,78";

const ORBIT_PATH =
  "M89,47 A39,29,0,0,0,50,18 A39,29,0,0,0,11,47 A39,29,0,0,0,50,76 A39,29,0,0,0,89,47 Z";

const ORBIT_ARC =
  "M78,68 A39,29,0,0,0,89,47 A39,29,0,0,0,50,18 A39,29,0,0,0,11,47 A39,29,0,0,0,22,68";

// Minimal jet silhouette — right-pointing; rotate="auto" aligns it to path tangent
const PLANE_PATH = "M7,0 L-5,-2.8 L-3.5,0 L-5,2.8 Z";

// Ease-in-out per quarter of orbit (organic, non-linear motion)
const SPLINE_TIMES = "0;0.25;0.5;0.75;1";
const SPLINE_KEYS  = "0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1";

// Comet trail particles: [begin-offset, radius, opacity]
const TRAIL: [string, number, number][] = [
  ["-0.8s",  2.2, 0.55],
  ["-1.5s",  1.7, 0.30],
  ["-2.1s",  1.2, 0.16],
  ["-2.6s",  0.8, 0.07],
];

// ─── LogoMark ─────────────────────────────────────────────────────────────────
interface MarkProps {
  px:    number;
  theme: LogoTheme;
  anim:  boolean;
  hover: boolean;
  uid:   string;
}

function LogoMark({ px, theme, anim, hover, uid }: MarkProps) {
  const isDark  = theme === "dark";
  const mColor  = isDark ? "#f8fafc" : "#0F172A";
  const amber   = "#f59e0b";
  const orange  = "#f97316";
  const orangeD = "#ea580c";

  const orbitId = `${uid}-op`;
  const glowId  = `${uid}-gw`;
  const gradId  = `${uid}-gr`;
  const radId   = `${uid}-rg`;
  const mgwId   = `${uid}-mg`;

  return (
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
        {/* Animatable orbit reference (full closed ellipse) */}
        <path id={orbitId} d={ORBIT_PATH} />

        {/* Soft glow for the plane */}
        <filter id={glowId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Diffuse background bloom for M on dark theme */}
        <filter id={mgwId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>

        {/* Gradient along orbit: amber → orange → deep orange */}
        <linearGradient id={gradId} x1="11" y1="18" x2="89" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={amber}   stopOpacity="0.9"  />
          <stop offset="50%"  stopColor={orange}  stopOpacity="1"    />
          <stop offset="100%" stopColor={orangeD} stopOpacity="0.85" />
        </linearGradient>

        {/* Radial bloom that follows the plane */}
        <radialGradient id={radId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={orange} stopOpacity="0.7" />
          <stop offset="100%" stopColor={orange} stopOpacity="0"   />
        </radialGradient>
      </defs>

      {/* ── M diffuse background glow (dark only) ── */}
      {isDark && (
        <path
          d={M_STROKE}
          stroke={orange}
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.07"
          filter={`url(#${mgwId})`}
        />
      )}

      {/* ── Orbit guide ring (subtle base layer) ── */}
      {anim ? (
        <>
          <motion.path
            d={ORBIT_ARC}
            stroke={isDark ? "#334155" : "#e2e8f0"}
            strokeWidth="0.75"
            strokeLinecap="round"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          />
          <motion.path
            d={ORBIT_ARC}
            stroke={`url(#${gradId})`}
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: hover ? 0.65 : 0.3 }}
            transition={{
              pathLength: { delay: 0.9, duration: 1.1, ease: [0.25, 0.1, 0.25, 1] },
              opacity:    { delay: 0.9, duration: 0.7 },
            }}
          />
        </>
      ) : (
        <path d={ORBIT_ARC} stroke={`url(#${gradId})`} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.28" />
      )}

      {/* ── M letterform ── */}
      {anim ? (
        <motion.path
          d={M_STROKE}
          stroke={mColor}
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 1.1, ease: [0.25, 0.1, 0.25, 1] },
            opacity:    { duration: 0.05 },
          }}
        />
      ) : (
        <path d={M_STROKE} stroke={mColor} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}

      {/* ── Comet trail ── */}
      {anim && TRAIL.map(([begin, r, opacity], i) => (
        <circle key={i} r={r} fill={i === 0 ? orange : amber} opacity={opacity}>
          <animateMotion
            dur="5s"
            begin={begin}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes={SPLINE_TIMES}
            keySplines={SPLINE_KEYS}
          >
            <mpath href={`#${orbitId}`} />
          </animateMotion>
        </circle>
      ))}

      {/* ── Glow bloom (radial gradient circle tracking the plane) ── */}
      {anim && (
        <circle r="9" fill={`url(#${radId})`} opacity={hover ? 0.9 : 0.6}>
          <animateMotion
            dur="5s"
            begin="0s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes={SPLINE_TIMES}
            keySplines={SPLINE_KEYS}
          >
            <mpath href={`#${orbitId}`} />
          </animateMotion>
        </circle>
      )}

      {/* ── Plane / motion symbol ──
            SVG native animateMotion — Framer Motion has no path-motion API.
            rotate="auto" aligns the jet to the path tangent direction.        */}
      {anim ? (
        <g filter={`url(#${glowId})`}>
          <path d={PLANE_PATH} fill={isDark ? "white" : "#1e293b"} stroke={amber} strokeWidth="0.5">
            <animateMotion
              dur="5s"
              begin="0s"
              repeatCount="indefinite"
              rotate="auto"
              calcMode="spline"
              keyTimes={SPLINE_TIMES}
              keySplines={SPLINE_KEYS}
            >
              <mpath href={`#${orbitId}`} />
            </animateMotion>
          </path>
        </g>
      ) : (
        /* Static: plane parked at rightmost point (89,47), facing up for CCW orbit */
        <g transform="translate(89,47) rotate(-90)">
          <path d={PLANE_PATH} fill={orange} opacity="0.9" />
        </g>
      )}
    </svg>
  );
}

// ─── AnimatedLogo ─────────────────────────────────────────────────────────────
export default function AnimatedLogo({
  variant          = "full",
  theme            = "light",
  size             = "md",
  href             = "/",
  className        = "",
  disableAnimation = false,
}: AnimatedLogoProps) {
  const rawId             = useId();
  const uid               = rawId.replace(/:/g, "mv");
  const { px, text, gap } = SIZES[size];
  const prefersReduced    = useReducedMotion();
  const anim              = !disableAnimation && !prefersReduced;
  const textColor         = theme === "dark" ? "text-white" : "text-[#0F172A]";
  const [hovered, setHovered] = useState(false);

  const mark = (scale = 1, suffix = "") => (
    <div className="inline-flex shrink-0">
      <LogoMark
        px={Math.round(px * scale)}
        theme={theme}
        anim={anim}
        hover={hovered}
        uid={uid + suffix}
      />
    </div>
  );

  if (variant === "icon") {
    return (
      <Link
        href={href}
        aria-label="MaghrebVoyage"
        className={`inline-flex ${className}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {mark()}
      </Link>
    );
  }

  if (variant === "loading") {
    return (
      <div className={`flex flex-col items-center gap-6 ${className}`}>
        {mark(1.6, "l")}
        <div className="text-center">
          <p className={`font-black tracking-tight ${text} ${textColor}`}>
            Maghreb<span className="text-orange-500">Voyage</span>
          </p>
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400 mt-1.5">
            Chargement&hellip;
          </p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      aria-label="MaghrebVoyage"
      className={`flex items-center ${gap} group ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {mark()}
      <span className={`font-black tracking-tight ${text} ${textColor} select-none`}>
        Maghreb<span className="text-orange-500">Voyage</span>
      </span>
    </Link>
  );
}
