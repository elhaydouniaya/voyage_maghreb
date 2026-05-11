/**
 * AI Service for MaghrebVoyage
 * Implements Module C of the CDC: Structuration and Matching.
 */

export interface TravelRequestData {
  destination: string;
  isDateFlexible: boolean;
  startDate?: string;
  endDate?: string;
  duration?: number;
  budgetMax: number;
  tripType: string[];
  tripStyle?: string[];
  numberOfTravelers: number;
  accommodation?: string;
  transportIncluded?: boolean;
  activities?: string[];
  constraints?: string;
}

export interface StructuredDemand {
  summary: string;
  tags: string[];
  complexity: 1 | 2 | 3 | 4 | 5;
  destinationNormalized: string;
  budgetLevel: 'low' | 'medium' | 'high' | 'premium';
  dominantTripType: string;
  targetDuration: number;
  startDate?: Date;
  numberOfSeats: number;
  budgetMax: number;
}

export interface TripScore {
  tripId: string;
  score: number;
  compatibility: number;
  reasons: string[];
}

export class AIService {
  /**
   * C.1 - Structuration de la demande via LLM
   * Normalise les entrées du formulaire pour le matching.
   */
  static async structureDemand(request: TravelRequestData): Promise<StructuredDemand> {
    // In production, this calls GPT-4o-mini to produce a structured JSON.
    // We normalize the destination and identify the dominant theme.
    
    return {
      summary: `Voyage à ${request.destination} pour ${request.numberOfTravelers} personnes. Budget: ${request.budgetMax}€.`,
      tags: [...request.tripType, ...(request.activities || [])].map(t => t.toLowerCase()),
      complexity: 2,
      destinationNormalized: request.destination.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
      budgetLevel: request.budgetMax < 800 ? 'low' : request.budgetMax < 1800 ? 'medium' : 'high',
      dominantTripType: request.tripType[0] || "AVENTURE",
      targetDuration: request.duration || 7,
      startDate: request.startDate ? new Date(request.startDate) : undefined,
      numberOfSeats: request.numberOfTravelers,
      budgetMax: request.budgetMax
    };
  }

  /**
   * C.2 - Algorithme de Matching (Phase 1, 2, 3)
   * Score sur 18 points selon le CDC MaghrebVoyage vFinal.
   */
  static async matchTrips(demand: StructuredDemand, trips: any[]): Promise<TripScore[]> {
    const scoredTrips = trips.map(trip => {
      let score = 0;
      const reasons: string[] = [];

      // --- PHASE 1: Filtres durs (Éliminatoires) ---
      if (trip.status !== "PUBLISHED") return null;
      if (trip.bookedSpots >= trip.totalSpots) return null;
      
      const tripStartDate = new Date(trip.startDate);
      const now = new Date();
      if (tripStartDate <= now) return null;

      // --- PHASE 2: Score de pertinence (Max 18 pts) ---
      
      // 1. Destination (+4)
      const tripDest = trip.destination.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (tripDest.includes(demand.destinationNormalized) || demand.destinationNormalized.includes(tripDest)) {
        score += 4;
        reasons.push("Destination correspondante");
      }

      // 2. Dates compatibles (+3 + 1 bonus)
      if (demand.startDate) {
        const diffTime = Math.abs(tripStartDate.getTime() - demand.startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 14) {
          score += 3;
          reasons.push("Dates proches de vos souhaits");
          if (diffDays <= 7) {
             // Logic says +3 base. We can add +1 if really close or if client is flexible as per CDC
             score += 1; 
          }
        }
      } else {
        // If no date provided, we give a base score for future trips
        score += 2;
      }

      // 3. Budget compatible (+3 + 1 bonus)
      const tripPrice = Number(trip.totalPrice);
      if (tripPrice <= demand.budgetMax) {
        score += 3;
        reasons.push("Respecte votre budget");
        if (tripPrice <= demand.budgetMax * 0.8) {
          score += 1; // Bonus +1 if well under budget
          reasons.push("Excellent rapport qualité/prix");
        }
      }

      // 4. Type de voyage (+2)
      if (trip.tripType === demand.dominantTripType) {
        score += 2;
        reasons.push(`${trip.tripType} : Votre style favori`);
      }

      // 5. Tags en commun (+1/tag, Max +4)
      const tripTags = trip.aiTags || [];
      const commonTags = tripTags.filter((t: string) => demand.tags.includes(t.toLowerCase()));
      const tagPoints = Math.min(commonTags.length, 4);
      score += tagPoints;
      if (tagPoints > 0) reasons.push("Correspond à vos centres d'intérêt");

      // 6. Places suffisantes (+1)
      if (trip.totalSpots - trip.bookedSpots >= demand.numberOfSeats) {
        score += 1;
      }

      // Final Compatibility %
      const maxScore = 18;
      const compatibility = Math.min(Math.round((score / maxScore) * 100), 100);

      return {
        tripId: trip.id,
        score,
        compatibility,
        reasons: Array.from(new Set(reasons)) // Unique reasons
      };
    }).filter(Boolean) as TripScore[];

    // --- PHASE 3: Tri et Sélection ---
    let results = scoredTrips
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // Priority to closest start date on equal score
        const tripA = trips.find(t => t.id === a.tripId);
        const tripB = trips.find(t => t.id === b.tripId);
        return new Date(tripA.startDate).getTime() - new Date(tripB.startDate).getTime();
      })
      .slice(0, 3);

    // C.2.Fallback : Si 0 résultat -> Afficher les 3 prochains départs
    if (results.length === 0) {
      const nextTrips = trips
        .filter(t => t.status === "PUBLISHED" && new Date(t.startDate) > new Date())
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 3)
        .map(t => ({
          tripId: t.id,
          score: 0,
          compatibility: 0,
          reasons: ["Prochain départ disponible"]
        }));
      results = nextTrips;
    }

    return results;
  }
}

