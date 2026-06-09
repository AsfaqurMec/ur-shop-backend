"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.uniqueSlug = uniqueSlug;
/**
 * Generates a URL-safe slug from a string (lowercase, hyphens, no leading/trailing hyphens).
 */
function slugify(text) {
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
async function uniqueSlug(baseSlug, exists) {
    let slug = baseSlug;
    let n = 2;
    while (await exists(slug)) {
        slug = `${baseSlug}-${n}`;
        n += 1;
    }
    return slug;
}
//# sourceMappingURL=slugHelpers.js.map