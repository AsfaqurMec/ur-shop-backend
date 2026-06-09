/**
 * Generates a URL-safe slug from a string (lowercase, hyphens, no leading/trailing hyphens).
 */
export declare function slugify(text: string): string;
/**
 * Ensures a unique slug by appending -2, -3, ... when exists(checkSlug) returns true.
 */
export declare function uniqueSlug(baseSlug: string, exists: (slug: string) => Promise<boolean>): Promise<string>;
//# sourceMappingURL=slugHelpers.d.ts.map