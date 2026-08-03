import type { ReviewPublic, ReviewDetailPublic, ReviewAdminListItem, ReviewAdminTableRow } from '../types/review';
/** Submit review (verified purchasers only; one per user per product). */
export declare function submitReview(userId: number, productId: number, data: {
    rating: number;
    title?: string | null;
    body?: string | null;
    image_path?: string | null;
}): Promise<ReviewDetailPublic>;
/** Update own review (rating and/or comment). */
export declare function updateReview(userId: number, reviewId: number, data: {
    rating?: number;
    title?: string | null;
    body?: string | null;
    image_path?: string | null;
}): Promise<ReviewDetailPublic>;
/** Public list of reviews for a product (not hidden). */
export declare function listByProduct(productId: number, options?: {
    limit?: number;
    offset?: number;
}): Promise<{
    reviews: ReviewPublic[];
    total: number;
}>;
/** Admin: all reviews for a product (moderation). */
export declare function listByProductAdmin(productId: number, options?: {
    limit?: number;
    offset?: number;
}): Promise<{
    reviews: ReviewAdminListItem[];
    total: number;
}>;
/** Admin: all reviews with optional category filter (omit = all; 0 = uncategorized). */
export declare function listAllAdmin(categoryId: number | undefined, options?: {
    limit?: number;
    offset?: number;
}): Promise<{
    reviews: ReviewAdminTableRow[];
    total: number;
}>;
/** Admin: hide or unhide a review (soft delete / restore). */
export declare function setReviewHidden(reviewId: number, hidden: boolean): Promise<ReviewDetailPublic>;
/** Public: newest published reviews across the catalogue, including product links. */
export declare function listAllPublic(options?: {
    limit?: number;
    offset?: number;
}): Promise<{
    reviews: Array<ReviewPublic & {
        product_name: string;
        product_slug: string;
    }>;
    total: number;
}>;
/** Admin: create a published testimonial without requiring a customer account or order. */
export declare function createAdminReview(data: {
    product_id: number;
    reviewer_name: string;
    rating: number;
    title?: string | null;
    body?: string | null;
    image_path?: string | null;
}): Promise<ReviewDetailPublic>;
/** Get single review as detail (for owner or admin). */
export declare function getReviewDetail(reviewId: number, userId?: number, isAdmin?: boolean): Promise<ReviewDetailPublic>;
//# sourceMappingURL=reviewService.d.ts.map