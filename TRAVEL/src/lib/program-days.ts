export type ProgramDayItem = {
  day: string;
  title: string;
  desc: string;
};

const CANCEL_POLICY_MARKER = "--- Politique d'annulation ---";

export function splitProgramAndCancelPolicy(programDays?: string | null): {
  programText: string;
  cancelPolicy: string;
} {
  const raw = (programDays || "").trim();
  if (!raw) return { programText: "", cancelPolicy: "" };

  const idx = raw.indexOf(CANCEL_POLICY_MARKER);
  if (idx === -1) {
    return { programText: raw, cancelPolicy: "" };
  }

  return {
    programText: raw.slice(0, idx).trim(),
    cancelPolicy: raw.slice(idx + CANCEL_POLICY_MARKER.length).trim(),
  };
}

export function parseProgramDays(programDays?: string | null): ProgramDayItem[] {
  const { programText } = splitProgramAndCancelPolicy(programDays);
  if (!programText) return [];

  const blocks = programText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const items: ProgramDayItem[] = [];

  for (const block of blocks) {
    const match = block.match(
      /^(?:jour\s*)?(\d+(?:\s*[-–]\s*\d+)?|dernier\s*jour)\s*[:\-–]\s*(.+)$/i
    );
    if (match) {
      const rest = match[2].trim();
      const dotIdx = rest.indexOf(". ");
      if (dotIdx > 0 && dotIdx < 80) {
        items.push({
          day: `Jour ${match[1]}`,
          title: rest.slice(0, dotIdx),
          desc: rest.slice(dotIdx + 2),
        });
      } else {
        items.push({
          day: `Jour ${match[1]}`,
          title: rest,
          desc: "",
        });
      }
      continue;
    }

    items.push({
      day: items.length === 0 ? "Programme" : `Étape ${items.length + 1}`,
      title: block,
      desc: "",
    });
  }

  return items;
}

export const PHYSICAL_LEVEL_LABELS: Record<string, string> = {
  EASY: "Facile",
  MEDIUM: "Modéré",
  SPORT: "Sportif",
  EXPERT: "Expert",
};
