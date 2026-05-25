/**
 * Slug generation utility as per Module E of the CDC.
 */
export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .slice(0, 60); // Limit length
}

/**
 * Handle collisions by adding a suffix (mock logic for client-side demo)
 */
export function generateUniqueSlug(title: string, existingSlugs: string[] = []): string {
  const base = toSlug(title);
  let slug = base;
  let counter = 2;
  
  while (existingSlugs.includes(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }
  
  return slug;
}
