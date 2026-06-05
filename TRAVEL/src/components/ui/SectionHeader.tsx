import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: ReactNode;
};

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  action,
}: SectionHeaderProps) {
  const centered = align === "center";

  return (
    <div
      className={`flex flex-col gap-4 mb-12 md:mb-16 ${
        centered ? "text-center items-center" : "md:flex-row md:items-end md:justify-between"
      }`}
    >
      <div className={centered ? "max-w-2xl" : ""}>
        {eyebrow && (
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-600 mb-3">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl md:text-5xl font-black text-[#0F172A] tracking-tight leading-tight">
          {title}
        </h2>
        {description && (
          <p
            className={`mt-3 text-gray-500 font-medium text-sm md:text-base leading-relaxed ${
              centered ? "mx-auto" : "max-w-xl"
            }`}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
