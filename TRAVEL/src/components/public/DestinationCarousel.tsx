"use client";

import { useState, useEffect } from "react";
import { getFallbackImage } from "@/lib/images";

interface DestinationCarouselProps {
  images: string[];
  alt: string;
}

export default function DestinationCarousel({ images, alt }: DestinationCarouselProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images]);

  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
        onError={(e) => {
          (e.target as HTMLImageElement).src = getFallbackImage(alt);
        }}
      />
    );
  }

  return (
    <div className="relative w-full h-full">
      {images.map((img, index) => (
        <img
          key={index}
          src={img}
          alt={`${alt} - ${index + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100" : "opacity-0"
          } transition-transform duration-[2000ms] group-hover:scale-110`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = getFallbackImage(alt);
          }}
        />
      ))}
      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === current ? "bg-white w-6" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
