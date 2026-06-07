import { AppError } from '../middlewares/errorHandler';
import * as couponRepo from '../repositories/couponRepository';
import type {
  CouponPublic,
  CouponValidationResult,
  CouponEligibleItem,
  CouponType,
  CouponRow,
} from '../types/coupon';

function toPublic(row: CouponRow): CouponPublic {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: Number(row.value),
    min_order_amount: row.min_order_amount != null ? Number(row.min_order_amount) : null,
    max_uses: row.max_uses != null ? row.max_uses : null,
    max_uses_per_user: row.max_uses_per_user != null ? row.max_uses_per_user : null,
    used_count: row.used_count,
    valid_from: row.valid_from ? row.valid_from.toISOString() : null,
    valid_until: row.valid_until ? row.valid_until.toISOString() : null,
    is_active: Boolean(row.is_active),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export async function create(data: {
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
}): Promise<CouponPublic> {
  if (await couponRepo.codeExists(data.code)) {
    throw new AppError(409, 'Coupon code already exists');
  }
  if (data.type === 'percentage' && (data.value <= 0 || data.value > 100)) {
    throw new AppError(400, 'Percentage value must be between 1 and 100');
  }
  if (data.type === 'fixed_amount' && data.value <= 0) {
    throw new AppError(400, 'Fixed amount must be greater than 0');
  }
  const id = await couponRepo.create({
    code: data.code,
    type: data.type,
    value: data.value,
    min_order_amount: data.min_order_amount ?? null,
    max_uses: data.max_uses ?? null,
    max_uses_per_user: data.max_uses_per_user ?? null,
    valid_from: data.valid_from ?? null,
    valid_until: data.valid_until ?? null,
    is_active: data.is_active !== false ? 1 : 0,
  });
  if (data.product_ids?.length) await couponRepo.setCouponProducts(id, data.product_ids);
  if (data.category_ids?.length) await couponRepo.setCouponCategories(id, data.category_ids);
  const row = await couponRepo.findById(id);
  if (!row) throw new AppError(500, 'Failed to create coupon');
  return toPublic(row);
}

export async function update(
  id: number,
  data: {
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
  }
): Promise<CouponPublic> {
  const existing = await couponRepo.findById(id);
  if (!existing) throw new AppError(404, 'Coupon not found');
  if (data.code !== undefined && data.code !== existing.code && (await couponRepo.codeExists(data.code, id))) {
    throw new AppError(409, 'Coupon code already exists');
  }
  if (data.type === 'percentage' && data.value !== undefined && (data.value <= 0 || data.value > 100)) {
    throw new AppError(400, 'Percentage value must be between 1 and 100');
  }
  if (data.type === 'fixed_amount' && data.value !== undefined && data.value <= 0) {
    throw new AppError(400, 'Fixed amount must be greater than 0');
  }
  const updates: Parameters<typeof couponRepo.update>[1] = {};
  if (data.code !== undefined) updates.code = data.code;
  if (data.type !== undefined) updates.type = data.type;
  if (data.value !== undefined) updates.value = data.value;
  if (data.min_order_amount !== undefined) updates.min_order_amount = data.min_order_amount;
  if (data.max_uses !== undefined) updates.max_uses = data.max_uses;
  if (data.max_uses_per_user !== undefined) updates.max_uses_per_user = data.max_uses_per_user;
  if (data.valid_from !== undefined) updates.valid_from = data.valid_from;
  if (data.valid_until !== undefined) updates.valid_until = data.valid_until;
  if (data.is_active !== undefined) updates.is_active = data.is_active ? 1 : 0;
  if (Object.keys(updates).length > 0) await couponRepo.update(id, updates);
  if (data.product_ids !== undefined) await couponRepo.setCouponProducts(id, data.product_ids);
  if (data.category_ids !== undefined) await couponRepo.setCouponCategories(id, data.category_ids);
  const row = await couponRepo.findById(id);
  if (!row) throw new AppError(404, 'Coupon not found');
  return toPublic(row);
}

export async function setActive(id: number, isActive: boolean): Promise<CouponPublic> {
  return update(id, { is_active: isActive });
}

export async function remove(id: number): Promise<void> {
  const existing = await couponRepo.findById(id);
  if (!existing) throw new AppError(404, 'Coupon not found');
  const ok = await couponRepo.softDelete(id);
  if (!ok) throw new AppError(404, 'Coupon not found');
}

export async function list(): Promise<CouponPublic[]> {
  const rows = await couponRepo.findAll();
  return rows.map(toPublic);
}

export async function getById(id: number): Promise<CouponPublic & { product_ids: number[]; category_ids: number[] }> {
  const row = await couponRepo.findById(id);
  if (!row) throw new AppError(404, 'Coupon not found');
  const [product_ids, category_ids] = await Promise.all([
    couponRepo.getCouponProductIds(id),
    couponRepo.getCouponCategoryIds(id),
  ]);
  return { ...toPublic(row), product_ids, category_ids };
}

/**
 * Validate a coupon for cart/checkout. Reusable from cart preview or checkout.
 * @param code - Coupon code (case-insensitive)
 * @param userId - Current user id (for per-user usage limit)
 * @param subtotal - Cart/order subtotal
 * @param items - Optional cart/order lines for product/category restrictions
 */
export async function validateCoupon(
  code: string,
  userId: number,
  subtotal: number,
  items?: CouponEligibleItem[]
): Promise<CouponValidationResult> {
  const coupon = await couponRepo.findByCode(code);
  if (!coupon) {
    return { valid: false, message: 'Invalid coupon code' };
  }
  if (!coupon.is_active) {
    return { valid: false, message: 'Coupon is not active' };
  }
  const now = new Date();
  if (coupon.valid_from && now < coupon.valid_from) {
    return { valid: false, message: 'Coupon is not yet valid' };
  }
  if (coupon.valid_until && now > coupon.valid_until) {
    return { valid: false, message: 'Coupon has expired' };
  }
  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
    return { valid: false, message: 'Coupon has reached maximum uses' };
  }
  const userUsageCount = await couponRepo.countUsagesByUser(coupon.id, userId);
  if (coupon.max_uses_per_user != null && userUsageCount >= coupon.max_uses_per_user) {
    return { valid: false, message: 'You have already used this coupon the maximum number of times' };
  }
  const minOrder = coupon.min_order_amount != null ? Number(coupon.min_order_amount) : null;
  let eligibleSubtotal = subtotal;
  const productIds = await couponRepo.getCouponProductIds(coupon.id);
  const categoryIds = await couponRepo.getCouponCategoryIds(coupon.id);
  const hasRestriction = productIds.length > 0 || categoryIds.length > 0;
  if (hasRestriction && items && items.length > 0) {
    eligibleSubtotal = items
      .filter(
        (item) =>
          productIds.includes(item.product_id) ||
          (item.category_id != null && categoryIds.includes(item.category_id))
      )
      .reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    if (eligibleSubtotal <= 0) {
      return { valid: false, message: 'Coupon does not apply to any items in your cart' };
    }
  }
  if (minOrder != null && eligibleSubtotal < minOrder) {
    return {
      valid: false,
      message: `Minimum order amount for this coupon is ${minOrder}`,
    };
  }
  let discountAmount: number;
  if (coupon.type === 'percentage') {
    discountAmount = (eligibleSubtotal * Number(coupon.value)) / 100;
  } else {
    discountAmount = Math.min(Number(coupon.value), eligibleSubtotal);
  }
  discountAmount = Math.round(discountAmount * 100) / 100;
  return {
    valid: true,
    coupon: toPublic(coupon),
    discount_amount: discountAmount,
    eligible_subtotal: Math.round(eligibleSubtotal * 100) / 100,
  };
}

/**
 * Record coupon usage after order is placed. Call from checkout/order service.
 */
export async function applyCoupon(
  couponId: number,
  orderId: number,
  userId: number,
  discountAmount: number
): Promise<void> {
  await couponRepo.recordUsage(couponId, orderId, userId, discountAmount);
  await couponRepo.incrementUsedCount(couponId);
}
