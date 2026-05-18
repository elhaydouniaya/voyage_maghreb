"use client";

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
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
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

      {/* Title */}
      <h4 className="font-bold text-gray-900 mb-2 text-lg">{title}</h4>

      {/* Content */}
      <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
        {content}
      </p>

      {/* Trip Info */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <MapPin size={14} className="text-orange-500" />
          <span>{destination}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={14} className="text-orange-500" />
          <span>{tripDate}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button className="text-xs text-gray-500 hover:text-orange-500 transition-colors">
          👍 Utile ({helpful})
        </button>
        <button className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
          Lire plus →
        </button>
      </div>
    </div>
  );
}
