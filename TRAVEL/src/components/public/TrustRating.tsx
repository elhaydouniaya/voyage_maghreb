"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

export default function TrustRating() {
  const [stats, setStats] = useState({ average: 0, count: 0 });

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
      })
      .catch(() => {});
  }, []);

  const displayRating = stats.count > 0 ? stats.average.toFixed(1) : "—";

  return (
    <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-12 text-center space-y-8">
      <div className="text-5xl font-black text-white tracking-tighter">
        {displayRating}/5
      </div>
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={20}
            className={
              stats.count > 0 && i <= Math.round(stats.average)
                ? "fill-orange-500 text-orange-500"
                : "text-white/20"
            }
          />
        ))}
      </div>
      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
        {stats.count > 0
          ? `Note moyenne · ${stats.count} avis vérifiés`
          : "Avis voyageurs bientôt disponibles"}
      </p>
      <div className="pt-8 border-t border-white/5 flex justify-center items-center gap-6 opacity-30 grayscale brightness-200">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
          alt="Stripe"
          height={24}
          className="h-6 w-auto"
          style={{ width: "auto", height: "1.5rem" }}
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
          alt="Mastercard"
          height={24}
          className="h-6 w-auto"
          style={{ width: "auto", height: "1.5rem" }}
        />
      </div>
    </div>
  );
}
