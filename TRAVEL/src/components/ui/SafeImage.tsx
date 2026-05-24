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
};

export default function SafeImage({
  src,
  alt,
  fill,
  className,
  sizes,
  destination = "",
}: SafeImageProps) {
  const [current, setCurrent] = useState(src);

  return (
    <Image
      src={current}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      onError={() => setCurrent(getFallbackImage(destination || alt))}
    />
  );
}
