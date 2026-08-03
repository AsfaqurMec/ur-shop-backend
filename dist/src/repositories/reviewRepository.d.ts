import type { ReviewRow } from '../types/review';
export declare function create(data: {
    product_id: number;
    user_id: number;
    order_id: number | null;
    rating: number;
    title: string | null;
    body: string | null;
    image_path?: string | null;
    reviewer_name?: string | null;
}): Promise<number>;
export declare function findById(id: number): Promise<ReviewRow | null>;
export declare function findByUserAndProduct(userId: number, productId: number): Promise<ReviewRow | null>;
export interface ReviewListRow {
    id: number;
    product_id: number;
    user_id: number;
    order_id: number | null;
    rating: number;
    title: string | null;
    body: string | null;
    image_path: string | null;
    reviewer_name: string | null;
    status: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}
export declare function findByProductIdPublic(productId: number, options?: {
    limit?: number;
    offset?: number;
}): Promise<ReviewListRow[]>;
export declare function countByProductIdPublic(productId: number): Promise<number>;
export interface ReviewAdminTableJoinRow extends ReviewListRow {
    product_name: string;
    product_slug: string;
    category_id: number | null;
    category_name: string | null;
}
/** Public review enriched with the product needed to link from the homepage. */
export interface ReviewPublicJoinRow extends ReviewListRow {
    product_name: string;
    product_slug: string;
}
export declare function findAllAdmin(categoryId: number | undefined, options?: {
    limit?: number;
    offset?: number;
}): Promise<ReviewAdminTableJoinRow[]>;
export declare function countAllAdmin(categoryId: number | undefined): Promise<number>;
/** Latest non-hidden reviews across all existing products, for storefront testimonials. */
export declare function findAllPublic(options?: {
    limit?: number;
    offset?: number;
}): Promise<ReviewPublicJoinRow[]>;
export declare function countAllPublic(): Promise<number>;
export declare function findByProductIdAdmin(productId: number, options?: {
    limit?: number;
    offset?: number;
}): Promise<ReviewListRow[]>;
export declare function countByProductIdAdmin(productId: number): Promise<number>;
export declare function update(id: number, data: {
    rating?: number;
    title?: string | null;
    body?: string | null;
    image_path?: string | null;
}): Promise<boolean>;
export declare function setHidden(id: number, hidden: boolean): Promise<boolean>;
//# sourceMappingURL=reviewRepository.d.ts.map