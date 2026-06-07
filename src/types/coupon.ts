export type CouponType = 'percentage' | 'fixed_amount';

export interface CouponRow {
  id: number;
  code: string;
  type: CouponType;
  value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  max_uses_per_user: number | null;
  used_count: number;
  valid_from: Date | null;
  valid_until: Date | null;
  is_active: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CouponPublic {
  id: number;
  code: string;
  type: CouponType;
  value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  max_uses_per_user: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Input line for coupon validation (e.g. from cart/checkout) */
export interface CouponEligibleItem {
  product_id: number;
  category_id: number | null;
  quantity: number;
  unit_price: number;
}

/** Result of validating a coupon for a cart/checkout */
export interface CouponValidationResult {
  valid: boolean;
  message?: string;
  coupon?: CouponPublic;
  discount_amount?: number;
  eligible_subtotal?: number;
}
