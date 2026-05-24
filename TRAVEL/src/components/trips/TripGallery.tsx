"use client";

import { COUNTRY_IMAGES } from "@/lib/images";
import SafeImage from "@/components/ui/SafeImage";

interface TripGalleryProps {
  images: string[];
  title: string;
  destination?: string;
}

export default function TripGallery({
  images = [],
  title,
  destination = "",
}: TripGalleryProps) {
  const destKey = title.toUpperCase().includes("MAROC")
    ? "MAROC"
    : title.toUpperCase().includes("TUNISIE")
      ? "TUNISIE"
      : "ALGERIE";

  const img1 = images[0] || COUNTRY_IMAGES[destKey][0];
  const img2 = images[1] || COUNTRY_IMAGES[destKey][1] || COUNTRY_IMAGES[destKey][0];
  const img3 = images[2] || COUNTRY_IMAGES[destKey][2] || COUNTRY_IMAGES[destKey][0];
  const dest = destination || title;

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[500px]">
      <div className="col-span-3 row-span-2 rounded-[2rem] overflow-hidden shadow-xl bg-gray-100 group relative">
        <SafeImage
          src={img1}
          alt={title}
          destination={dest}
          fill
          sizes="75vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="rounded-[1.5rem] overflow-hidden shadow-lg bg-gray-100 group relative">
        <SafeImage
          src={img2}
          alt={title}
          destination={dest}
          fill
          sizes="25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>
      <div className="relative rounded-[1.5rem] overflow-hidden shadow-lg bg-gray-100 group">
        <SafeImage
          src={img3}
          alt={title}
          destination={dest}
          fill
          sizes="25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {images.length > 3 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center text-white font-black text-xl pointer-events-none">
            +{images.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}
