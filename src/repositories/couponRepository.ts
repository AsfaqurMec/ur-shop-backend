import {
  CouponCategoryModel,
  CouponModel,
  CouponProductModel,
  CouponUsageModel,
} from '../database/models';
import { nextId } from '../database/counter';
import type { CouponRow, CouponType } from '../types/coupon';

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function row(doc: any): CouponRow {
  return {
    id: Number(doc.id),
    code: String(doc.code),
    type: doc.type as CouponType,
    value: Number(doc.value ?? 0),
    min_order_amount: doc.min_order_amount != null ? Number(doc.min_order_amount) : null,
    max_uses: doc.max_uses != null ? Number(doc.max_uses) : null,
    max_uses_per_user: doc.max_uses_per_user != null ? Number(doc.max_uses_per_user) : null,
    used_count: Number(doc.used_count ?? 0),
    valid_from: doc.valid_from ? date(doc.valid_from) : null,
    valid_until: doc.valid_until ? date(doc.valid_until) : null,
    is_active: Number(doc.is_active ?? 1),
    created_at: date(doc.created_at),
    updated_at: date(doc.updated_at),
    deleted_at: doc.deleted_at ? date(doc.deleted_at) : null,
  };
}

export async function findByCode(code: string): Promise<CouponRow | null> {
  const doc = await CouponModel.findOne({ code: code.trim().toUpperCase(), deleted_at: null }).lean();
  return doc ? row(doc) : null;
}

export async function findById(id: number): Promise<CouponRow | null> {
  const doc = await CouponModel.findOne({ id, deleted_at: null }).lean();
  return doc ? row(doc) : null;
}

export async function codeExists(code: string, excludeId?: number): Promise<boolean> {
  const query: Record<string, unknown> = { code: code.trim().toUpperCase(), deleted_at: null };
  if (excludeId != null) query.id = { $ne: excludeId };
  return Boolean(await CouponModel.exists(query));
}

export async function create(data: {
  code: string;
  type: CouponType;
  value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  max_uses_per_user: number | null;
  valid_from: Date | null;
  valid_until: Date | null;
  is_active: number;
}): Promise<number> {
  const id = await nextId('coupons');
  await CouponModel.create({
    id,
    ...data,
    code: data.code.trim().toUpperCase(),
    used_count: 0,
    deleted_at: null,
  });
  return id;
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
    is_active?: number;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) updateData[key] = key === 'code' && typeof value === 'string' ? value.trim().toUpperCase() : value;
  }
  if (Object.keys(updateData).length === 0) return;
  await CouponModel.updateOne({ id, deleted_at: null }, { $set: updateData });
}

export async function softDelete(id: number): Promise<boolean> {
  const result = await CouponModel.updateOne({ id, deleted_at: null }, { $set: { deleted_at: new Date() } });
  return result.modifiedCount > 0;
}

export async function countUsagesByUser(couponId: number, userId: number): Promise<number> {
  return CouponUsageModel.countDocuments({ coupon_id: couponId, user_id: userId });
}

export async function incrementUsedCount(couponId: number): Promise<void> {
  await CouponModel.updateOne({ id: couponId }, { $inc: { used_count: 1 } });
}

export async function recordUsage(couponId: number, orderId: number, userId: number | null, discountAmount: number): Promise<number> {
  const id = await nextId('coupon_usages');
  await CouponUsageModel.create({ id, coupon_id: couponId, order_id: orderId, user_id: userId, discount_amount: discountAmount });
  return id;
}

export async function recordUsageWithConnection(
  _conn: unknown,
  couponId: number,
  orderId: number,
  userId: number | null,
  discountAmount: number
): Promise<number> {
  return recordUsage(couponId, orderId, userId, discountAmount);
}

export async function incrementUsedCountWithConnection(_conn: unknown, couponId: number): Promise<void> {
  await incrementUsedCount(couponId);
}

export async function findCouponIdsUsedByOrderId(orderId: number): Promise<number[]> {
  const rows = await CouponUsageModel.find({ order_id: orderId }).lean();
  return rows.map((r: any) => Number(r.coupon_id));
}

export async function deleteCouponUsagesForOrder(orderId: number): Promise<void> {
  await CouponUsageModel.deleteMany({ order_id: orderId });
}

export async function decrementUsedCountById(couponId: number): Promise<void> {
  await CouponModel.updateOne({ id: couponId }, { $inc: { used_count: -1 } });
  const doc = await CouponModel.findOne({ id: couponId }).lean();
  if (doc && Number(doc.used_count ?? 0) < 0) {
    await CouponModel.updateOne({ id: couponId }, { $set: { used_count: 0 } });
  }
}

export async function rollbackCouponsForOrder(orderId: number): Promise<void> {
  const ids = await findCouponIdsUsedByOrderId(orderId);
  if (ids.length === 0) return;
  const unique = [...new Set(ids)];
  await deleteCouponUsagesForOrder(orderId);
  for (const couponId of unique) await decrementUsedCountById(couponId);
}

export async function setCouponProducts(couponId: number, productIds: number[]): Promise<void> {
  await CouponProductModel.deleteMany({ coupon_id: couponId });
  for (const productId of productIds) {
    await CouponProductModel.create({ id: await nextId('coupon_products'), coupon_id: couponId, product_id: productId });
  }
}

export async function getCouponProductIds(couponId: number): Promise<number[]> {
  const rows = await CouponProductModel.find({ coupon_id: couponId }).lean();
  return rows.map((r: any) => Number(r.product_id));
}

export async function setCouponCategories(couponId: number, categoryIds: number[]): Promise<void> {
  await CouponCategoryModel.deleteMany({ coupon_id: couponId });
  for (const categoryId of categoryIds) {
    await CouponCategoryModel.create({ id: await nextId('coupon_categories'), coupon_id: couponId, category_id: categoryId });
  }
}

export async function getCouponCategoryIds(couponId: number): Promise<number[]> {
  const rows = await CouponCategoryModel.find({ coupon_id: couponId }).lean();
  return rows.map((r: any) => Number(r.category_id));
}

export async function findAll(): Promise<CouponRow[]> {
  const rows = await CouponModel.find({ deleted_at: null }).sort({ created_at: -1 }).lean();
  return rows.map(row);
}
