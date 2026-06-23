"use client";

import { useState } from "react";
import Image from "next/image";
import { getFallbackImage } from "@/lib/images";

type SafeImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  destination?: string;
  priority?: boolean;
};

export default function SafeImage({
  src,
  alt,
  fill,
  className,
  sizes,
  destination = "",
  priority,
}: SafeImageProps) {
  const [current, setCurrent] = useState(src);

  return (
    <Image
      src={current}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      priority={priority}
      onError={() => setCurrent(getFallbackImage(destination || alt))}
    />
  );
}
