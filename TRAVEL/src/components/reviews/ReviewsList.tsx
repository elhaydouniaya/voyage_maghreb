"use client";

import { useState } from "react";
import { Star, Filter } from "lucide-react";
import ReviewCard from "./ReviewCard";

// Sample reviews data
const sampleReviews = [
  {
    id: "1",
    author: "Fatima Ben",
    avatar: undefined,
    rating: 5,
    title: "Une expérience magique à Marrakech!",
    content:
      "C'était absolument incroyable! Le guide était très professionnel, les hôtels choisis étaient luxueux et les paysages désertiques sont unforgettable. Je recommande vivement cette agence pour tous ceux qui veulent découvrir le Maroc authentique.",
    destination: "Marrakech",
    tripDate: "Avril 2026",
    date: "Il y a 2 semaines",
    helpful: 24,
  },
  {
    id: "2",
    author: "Ahmed Slimani",
    avatar: undefined,
    rating: 4,
    title: "Très bon rapport qualité-prix",
    content:
      "Excellent choix pour un voyage en famille. Les activités étaient variées et adaptées à tous les âges. Le seul petit point négatif était le timing un peu serré sur le premier jour, mais globalement merveilleux.",
    destination: "Agadir",
    tripDate: "Mars 2026",
    date: "Il y a 1 mois",
    helpful: 18,
  },
  {
    id: "3",
    author: "Leila Mansouri",
    avatar: undefined,
    rating: 5,
    title: "Du Sahara à l'Atlantique, un voyage de rêve",
    content:
      "J'ai découvert des endroits que je n'aurais jamais trouvés seule. L'organisation était impeccable, l'accueil chaleureux, et les découvertes culinaires délicieuses. Ce voyage m'a transformée. Merci!",
    destination: "Tour complet Maroc",
    tripDate: "Février 2026",
    date: "Il y a 3 mois",
    helpful: 42,
  },
  {
    id: "4",
    author: "Mohammed Karim",
    avatar: undefined,
    rating: 4,
    title: "Belle découverte de Tanger et Tétouan",
    content:
      "Les villes du nord sont magnifiques et souvent oubliées par les touristes. Cette agence m'a fait découvrir une autre facette du Maroc. Guide accompagnateur très culture et attachant.",
    destination: "Tanger, Tétouan",
    tripDate: "Janvier 2026",
    date: "Il y a 4 mois",
    helpful: 15,
  },
  {
    id: "5",
    author: "Sara Daoudi",
    avatar: undefined,
    rating: 5,
    title: "Le séjour balnéaire parfait",
    content:
      "Destinations balnéaires sélectionnées avec goût, hôtels confortables face à la mer, et une équipe disponible 24/7. De plus, ils proposent des excursions intéressantes pour ne pas rester que sur la plage.",
    destination: "Casablanca & Plages",
    tripDate: "Décembre 2025",
    date: "Il y a 5 mois",
    helpful: 31,
  },
  {
    id: "6",
    author: "Youssef El Idrissi",
    avatar: undefined,
    rating: 4,
    title: "Authenticité garantie",
    content:
      "C'est vraiment une agence qui met l'accent sur l'authenticité et la rencontre avec la population locale. Les repas chez l'habitant étaient un point fort. Merci pour cette belle expérience d'immersion culturelle.",
    destination: "Anti-Atlas",
    tripDate: "Novembre 2025",
    date: "Il y a 6 mois",
    helpful: 22,
  },
];

export default function ReviewsList() {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("recent");

  const filteredReviews = selectedRating
    ? sampleReviews.filter((review) => review.rating === selectedRating)
    : sampleReviews;

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === "rating-high") return b.rating - a.rating;
    if (sortBy === "rating-low") return a.rating - b.rating;
    if (sortBy === "helpful") return (b.helpful || 0) - (a.helpful || 0);
    return 0;
  });

  const avgRating =
    (sampleReviews.reduce((sum, r) => sum + r.rating, 0) /
      sampleReviews.length).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8">
      {/* Stats Header */}
      <div className="mb-8 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl p-6 md:p-8 border border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {sampleReviews.length} avis clients
            </h2>
            <p className="text-gray-600 flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={`${
                      i < Math.round(parseFloat(avgRating))
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold">{avgRating}/5</span> sur la base en ligne
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Rating Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedRating(null)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              selectedRating === null
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tous les avis
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setSelectedRating(rating)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                selectedRating === rating
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {rating} ⭐
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="md:ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="recent">Plus récents</option>
            <option value="rating-high">Notes plus élevées</option>
            <option value="rating-low">Notes plus basses</option>
            <option value="helpful">Plus utiles</option>
          </select>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {sortedReviews.map((review) => (
          <ReviewCard key={review.id} {...review} />
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center gap-4">
        <button className="px-8 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors">
          Charger plus d'avis
        </button>
      </div>
    </div>
  );
}
