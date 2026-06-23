/** Available seats = total − confirmed − temporary holds (PENDING_PAYMENT). */
export function getSpotsLeft(trip: {
  totalSpots: number;
  bookedSpots: number;
  reservedSpots?: number | null;
}): number {
  const reserved = trip.reservedSpots ?? 0;
  return Math.max(0, trip.totalSpots - trip.bookedSpots - reserved);
}

export function hasSpotsAvailable(
  trip: {
    totalSpots: number;
    bookedSpots: number;
    reservedSpots?: number | null;
  },
  seats = 1
): boolean {
  return getSpotsLeft(trip) >= seats;
}
