"use client";

import { useState } from "react";
import { Star, MapPin, Calendar } from "lucide-react";
import Image from "next/image";

interface ReviewCardProps {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  title: string;
  content: string;
  destination: string;
  tripDate: string;
  date: string;
  helpful?: number;
}

export default function ReviewCard({
  id,
  author,
  avatar,
  rating,
  title,
  content,
  destination,
  tripDate,
  date,
  helpful = 0,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(helpful);
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  const longContent = content.length > 220;

  const handleHelpful = async () => {
    if (voted || voting) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/reviews/${id}/helpful`, { method: "POST" });
      const data = await res.json();
      if (res.ok && typeof data.helpful === "number") {
        setHelpfulCount(data.helpful);
        setVoted(true);
      }
    } catch {
      /* ignore */
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
            {avatar ? (
              <Image
                src={avatar}
                alt={author}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              author.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{author}</h3>
            <p className="text-xs text-gray-500">{date}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={`${
                i < rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      <h4 className="font-bold text-gray-900 mb-2 text-lg">{title}</h4>

      <p
        className={`text-gray-600 text-sm mb-4 leading-relaxed ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {content}
      </p>

      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <MapPin size={14} className="text-orange-500" />
          <span>{destination}</span>
        </div>
        {tripDate && (
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-orange-500" />
            <span>{tripDate}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleHelpful}
          disabled={voted || voting}
          className={`text-xs transition-colors ${
            voted
              ? "text-orange-600 font-bold"
              : "text-gray-500 hover:text-orange-500"
          } disabled:opacity-60`}
        >
          👍 Utile ({helpfulCount})
        </button>
        {longContent && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
          >
            {expanded ? "Réduire ↑" : "Lire plus →"}
          </button>
        )}
      </div>
    </div>
  );
}
