/** Génère les aiTags d'un voyage à la publication (matching IA). */
export function generateTripAiTags(trip: {
  destination: string;
  tripType: string;
  inclusions: string[];
  exclusions?: string[];
  physicalLevel?: string | null;
  guideLanguages?: string[];
  description?: string;
}): string[] {
  const tags = new Set<string>();

  const add = (raw: string) => {
    const t = raw
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (t.length >= 2 && t.length <= 40) tags.add(t);
  };

  add(trip.tripType);
  trip.destination.split(/[,/|]/).forEach((part) => add(part));

  for (const list of [trip.inclusions, trip.exclusions || []]) {
    for (const item of list) {
      item.split(/[,;]/).forEach((part) => add(part));
    }
  }

  if (trip.physicalLevel) add(trip.physicalLevel);

  for (const lang of trip.guideLanguages || []) {
    add(lang);
  }

  const desc = (trip.description || "").toLowerCase();
  const keywords = [
    "desert",
    "sahara",
    "famille",
    "culture",
    "aventure",
    "luxe",
    "nature",
    "religieux",
    "historique",
    "randonnee",
    "plage",
    "medina",
  ];
  for (const kw of keywords) {
    if (desc.includes(kw)) add(kw);
  }

  return Array.from(tags).slice(0, 12);
}
