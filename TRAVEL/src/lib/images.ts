
export const COUNTRY_IMAGES = {
  ALGERIE: [
    "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=2070&auto=format&fit=crop", // Taghit
    "https://images.unsplash.com/photo-1504233529578-6d46baba6d34?q=80&w=2070&auto=format&fit=crop", // Djanet
    "https://images.unsplash.com/photo-1544085311-11a028465b03?q=80&w=2070&auto=format&fit=crop", // Kabylie
  ],
  MAROC: [
    "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=2070&auto=format&fit=crop", // Marrakech
    "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?q=80&w=2067&auto=format&fit=crop", // Ouarzazate
    "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=1973&auto=format&fit=crop", // Fès
  ],
  TUNISIE: [
    "https://images.unsplash.com/photo-1549877452-9c387954fbc2?q=80&w=2070&auto=format&fit=crop", // Douz
    "https://images.unsplash.com/photo-1561553590-267fc716698a?q=80&w=2052&auto=format&fit=crop", // Djerba
    "https://images.unsplash.com/photo-1509233725247-49e657c54213?q=80&w=2000&auto=format&fit=crop", // Sidi Bou Said
  ],
  MAURITANIE: [
    "https://images.unsplash.com/photo-1505051508008-923feaf90180?q=80&w=2070&auto=format&fit=crop", // Chinguetti
  ],
  LIBYE: [
    "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=2070&auto=format&fit=crop", // Generic Desert
  ]
};

export function getFallbackImage(destination: string = ""): string {
  const dest = destination.toUpperCase();
  if (dest.includes("MAROC")) return COUNTRY_IMAGES.MAROC[0];
  if (dest.includes("TUNISIE")) return COUNTRY_IMAGES.TUNISIE[0];
  if (dest.includes("ALGERIE") || dest.includes("ALGÉRIE")) return COUNTRY_IMAGES.ALGERIE[0];
  if (dest.includes("MAURITANIE")) return COUNTRY_IMAGES.MAURITANIE[0];
  if (dest.includes("LIBYE")) return COUNTRY_IMAGES.LIBYE[0];
  
  // Default fallback
  return "https://images.unsplash.com/photo-1505051508008-923feaf90180?q=80&w=2070&auto=format&fit=crop";
}
