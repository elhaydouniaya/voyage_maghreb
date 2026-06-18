// ─── IconOnlyM — pure stylized M lettermark ───────────────────────────────────
// Use for: app icons, favicons, avatar placeholders, any context where
// the orbit would be too small to render clearly (< 24px).

export type LogoTheme = "light" | "dark";

interface IconOnlyMProps {
  size?:       number;
  theme?:      LogoTheme;
  className?:  string;
  withAccent?: boolean; // show orange destination dot
}

// Same custom bezier M as AnimatedLogo — proportioned for square viewBox
const M_MARK = "M10,52 C10,40 12,20 13,12 C21,16 32,30 32,30 C32,30 43,16 51,12 C52,20 54,40 54,52";

export default function IconOnlyM({
  size       = 40,
  theme      = "light",
  className  = "",
  withAccent = true,
}: IconOnlyMProps) {
  const isDark  = theme === "dark";
  const mColor  = isDark ? "#f8fafc" : "#0F172A";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MaghrebVoyage"
      role="img"
    >
      <path
        d={M_MARK}
        stroke={mColor}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {withAccent && (
        <>
          {/* Orange destination dot — bottom-right leg tip */}
          <circle cx="54" cy="52" r="6"   fill="#f97316" />
          <circle cx="54" cy="52" r="3"   fill="white"   />
        </>
      )}
    </svg>
  );
}
