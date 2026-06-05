// Utility for sorting trips by season

export type Season = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' | 'OTHER';

export const SEASON_ORDER: Record<Season, number> = {
  SPRING: 1,   // Printemps (Mars-Mai)
  SUMMER: 2,   // Été (Juin-Août)
  AUTUMN: 3,   // Automne (Septembre-Novembre)
  WINTER: 4,   // Hiver (Décembre-Février)
  OTHER: 5,
};

export const SEASON_LABELS: Record<Season, string> = {
  SPRING: '🌸 Printemps',
  SUMMER: '☀️ Été',
  AUTUMN: '🍂 Automne',
  WINTER: '❄️ Hiver',
  OTHER: 'Toute l\'année',
};

export const SEASON_DESCRIPTIONS: Record<Season, string> = {
  SPRING: 'Mars à Mai',
  SUMMER: 'Juin à Août',
  AUTUMN: 'Septembre à Novembre',
  WINTER: 'Décembre à Février',
  OTHER: 'Consulter les dates',
};

// Determine season from a date
export function getSeasonFromDate(date: Date): Season {
  const month = date.getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'SPRING';
  if (month >= 6 && month <= 8) return 'SUMMER';
  if (month >= 9 && month <= 11) return 'AUTUMN';
  if (month === 12 || month === 1 || month === 2) return 'WINTER';
  
  return 'OTHER';
}

// Sort trips by season
export function sortTripsBySeason<T extends { season?: Season }>(trips: T[]): T[] {
  return [...trips].sort((a, b) => {
    const seasonA = a.season || 'OTHER';
    const seasonB = b.season || 'OTHER';
    return (SEASON_ORDER[seasonA] || 5) - (SEASON_ORDER[seasonB] || 5);
  });
}

// Group trips by season
export function groupTripsBySeason<T extends { season?: Season }>(
  trips: T[]
): Record<Season, T[]> {
  const grouped: Record<Season, T[]> = {
    SPRING: [],
    SUMMER: [],
    AUTUMN: [],
    WINTER: [],
    OTHER: [],
  };

  trips.forEach((trip) => {
    const season = trip.season || 'OTHER';
    grouped[season].push(trip);
  });

  return grouped;
}
