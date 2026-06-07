/**
 * Generates a URL-safe slug from a string (lowercase, hyphens, no leading/trailing hyphens).
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'category';
}

/**
 * Ensures a unique slug by appending -2, -3, ... when exists(checkSlug) returns true.
 */
export async function uniqueSlug(
  baseSlug: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug;
  let n = 2;
  while (await exists(slug)) {
    slug = `${baseSlug}-${n}`;
    n += 1;
  }
  return slug;
}
