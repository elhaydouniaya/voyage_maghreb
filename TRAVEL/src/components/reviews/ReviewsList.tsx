"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import ReviewCard from "./ReviewCard";

type ReviewItem = {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  destination: string;
  tripDate: string;
  date: string;
  createdAt?: string;
  helpful?: number;
};

export default function ReviewsList() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/reviews");
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
          setStats(data.stats || { count: 0, average: 0 });
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredReviews = selectedRating
    ? reviews.filter((review) => review.rating === selectedRating)
    : reviews;

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === "rating-high") return b.rating - a.rating;
    if (sortBy === "rating-low") return a.rating - b.rating;
    if (sortBy === "helpful") return (b.helpful || 0) - (a.helpful || 0);
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const avgRating = stats.average.toFixed(1);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400 font-bold">
        Chargement des avis...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8">
      <div className="mb-8 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl p-6 md:p-8 border border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {stats.count} avis clients
            </h2>
            <p className="text-gray-600 flex items-center gap-2">
              <span className="flex gap-1">
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
              </span>
              <span className="font-bold">{avgRating}/5</span> sur la base en ligne
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
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

      {sortedReviews.length === 0 ? (
        <p className="text-center text-gray-500 font-medium py-12">
          Aucun avis pour le moment. Soyez le premier à partager votre expérience !
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {sortedReviews.map((review) => (
            <ReviewCard key={review.id} {...review} />
          ))}
        </div>
      )}
    </div>
  );
}
