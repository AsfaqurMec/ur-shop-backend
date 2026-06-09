import type { CouponPublic, CouponValidationResult, CouponEligibleItem, CouponType } from '../types/coupon';
export declare function create(data: {
    code: string;
    type: CouponType;
    value: number;
    min_order_amount?: number | null;
    max_uses?: number | null;
    max_uses_per_user?: number | null;
    valid_from?: Date | null;
    valid_until?: Date | null;
    is_active?: boolean;
    product_ids?: number[];
    category_ids?: number[];
}): Promise<CouponPublic>;
export declare function update(id: number, data: {
    code?: string;
    type?: CouponType;
    value?: number;
    min_order_amount?: number | null;
    max_uses?: number | null;
    max_uses_per_user?: number | null;
    valid_from?: Date | null;
    valid_until?: Date | null;
    is_active?: boolean;
    product_ids?: number[];
    category_ids?: number[];
}): Promise<CouponPublic>;
export declare function setActive(id: number, isActive: boolean): Promise<CouponPublic>;
export declare function remove(id: number): Promise<void>;
export declare function list(): Promise<CouponPublic[]>;
export declare function getById(id: number): Promise<CouponPublic & {
    product_ids: number[];
    category_ids: number[];
}>;
/**
 * Validate a coupon for cart/checkout. Reusable from cart preview or checkout.
 * @param code - Coupon code (case-insensitive)
 * @param userId - Current user id (for per-user usage limit)
 * @param subtotal - Cart/order subtotal
 * @param items - Optional cart/order lines for product/category restrictions
 */
export declare function validateCoupon(code: string, userId: number, subtotal: number, items?: CouponEligibleItem[]): Promise<CouponValidationResult>;
/**
 * Record coupon usage after order is placed. Call from checkout/order service.
 */
export declare function applyCoupon(couponId: number, orderId: number, userId: number, discountAmount: number): Promise<void>;
//# sourceMappingURL=couponService.d.ts.map