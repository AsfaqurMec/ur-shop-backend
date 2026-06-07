import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import pool from '../database/pool';
import type { CouponRow, CouponType } from '../types/coupon';

export async function findByCode(code: string): Promise<CouponRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, code, type, value, min_order_amount, max_uses, max_uses_per_user, used_count,
            valid_from, valid_until, is_active, created_at, updated_at, deleted_at
     FROM coupons WHERE code = ? AND deleted_at IS NULL LIMIT 1`,
    [code.trim().toUpperCase()]
  );
  return (rows[0] as CouponRow) ?? null;
}

export async function findById(id: number): Promise<CouponRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, code, type, value, min_order_amount, max_uses, max_uses_per_user, used_count,
            valid_from, valid_until, is_active, created_at, updated_at, deleted_at
     FROM coupons WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [id]
  );
  return (rows[0] as CouponRow) ?? null;
}

export async function codeExists(code: string, excludeId?: number): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    excludeId
      ? 'SELECT 1 FROM coupons WHERE code = ? AND deleted_at IS NULL AND id != ? LIMIT 1'
      : 'SELECT 1 FROM coupons WHERE code = ? AND deleted_at IS NULL LIMIT 1',
    excludeId ? [code.trim().toUpperCase(), excludeId] : [code.trim().toUpperCase()]
  );
  return rows.length > 0;
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
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO coupons (code, type, value, min_order_amount, max_uses, max_uses_per_user, valid_from, valid_until, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.code.trim().toUpperCase(),
      data.type,
      data.value,
      data.min_order_amount ?? null,
      data.max_uses ?? null,
      data.max_uses_per_user ?? null,
      data.valid_from ?? null,
      data.valid_until ?? null,
      data.is_active,
    ]
  );
  return result.insertId;
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
  const updates: string[] = [];
  const values: (number | string | null)[] = [];
  const map: Record<string, keyof typeof data> = {
    code: 'code',
    type: 'type',
    value: 'value',
    min_order_amount: 'min_order_amount',
    max_uses: 'max_uses',
    max_uses_per_user: 'max_uses_per_user',
    valid_from: 'valid_from',
    valid_until: 'valid_until',
    is_active: 'is_active',
  };
  for (const [key, prop] of Object.entries(map)) {
    if (data[prop] !== undefined) {
      updates.push(`${key} = ?`);
      const v = data[prop];
      values.push(key === 'code' && typeof v === 'string' ? v.trim().toUpperCase() : (v as number | string | null));
    }
  }
  if (updates.length === 0) return;
  values.push(id);
  await pool.execute(
    `UPDATE coupons SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
}

export async function softDelete(id: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE coupons SET deleted_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return result.affectedRows > 0;
}

export async function countUsagesByUser(couponId: number, userId: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM coupon_usages WHERE coupon_id = ? AND user_id = ?',
    [couponId, userId]
  );
  return (rows[0] as { total: number }).total;
}

export async function incrementUsedCount(couponId: number): Promise<void> {
  await pool.execute(
    'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
    [couponId]
  );
}

export async function recordUsage(couponId: number, orderId: number, userId: number, discountAmount: number): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO coupon_usages (coupon_id, order_id, user_id, discount_amount) VALUES (?, ?, ?, ?)',
    [couponId, orderId, userId, discountAmount]
  );
  return result.insertId;
}

export async function recordUsageWithConnection(
  conn: PoolConnection,
  couponId: number,
  orderId: number,
  userId: number,
  discountAmount: number
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    'INSERT INTO coupon_usages (coupon_id, order_id, user_id, discount_amount) VALUES (?, ?, ?, ?)',
    [couponId, orderId, userId, discountAmount]
  );
  return result.insertId;
}

export async function incrementUsedCountWithConnection(conn: PoolConnection, couponId: number): Promise<void> {
  await conn.execute(
    'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
    [couponId]
  );
}

export async function findCouponIdsUsedByOrderId(orderId: number): Promise<number[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT coupon_id FROM coupon_usages WHERE order_id = ?',
    [orderId]
  );
  return (rows as { coupon_id: number }[]).map((r) => r.coupon_id);
}

export async function deleteCouponUsagesForOrder(orderId: number): Promise<void> {
  await pool.execute('DELETE FROM coupon_usages WHERE order_id = ?', [orderId]);
}

export async function decrementUsedCountById(couponId: number): Promise<void> {
  await pool.execute(
    'UPDATE coupons SET used_count = GREATEST(0, used_count - 1) WHERE id = ?',
    [couponId]
  );
}

/** Remove coupon_usages for an order and decrement global used_count (one per distinct coupon). */
export async function rollbackCouponsForOrder(orderId: number): Promise<void> {
  const ids = await findCouponIdsUsedByOrderId(orderId);
  if (ids.length === 0) return;
  const unique = [...new Set(ids)];
  await deleteCouponUsagesForOrder(orderId);
  for (const couponId of unique) {
    await decrementUsedCountById(couponId);
  }
}

// ---- coupon_products ----
export async function setCouponProducts(couponId: number, productIds: number[]): Promise<void> {
  await pool.execute('DELETE FROM coupon_products WHERE coupon_id = ?', [couponId]);
  if (productIds.length === 0) return;
  for (const productId of productIds) {
    await pool.execute('INSERT INTO coupon_products (coupon_id, product_id) VALUES (?, ?)', [couponId, productId]);
  }
}

export async function getCouponProductIds(couponId: number): Promise<number[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT product_id FROM coupon_products WHERE coupon_id = ?',
    [couponId]
  );
  return (rows as { product_id: number }[]).map((r) => r.product_id);
}

// ---- coupon_categories ----
export async function setCouponCategories(couponId: number, categoryIds: number[]): Promise<void> {
  await pool.execute('DELETE FROM coupon_categories WHERE coupon_id = ?', [couponId]);
  if (categoryIds.length === 0) return;
  for (const categoryId of categoryIds) {
    await pool.execute('INSERT INTO coupon_categories (coupon_id, category_id) VALUES (?, ?)', [couponId, categoryId]);
  }
}

export async function getCouponCategoryIds(couponId: number): Promise<number[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT category_id FROM coupon_categories WHERE coupon_id = ?',
    [couponId]
  );
  return (rows as { category_id: number }[]).map((r) => r.category_id);
}

export async function findAll(): Promise<CouponRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, code, type, value, min_order_amount, max_uses, max_uses_per_user, used_count,
            valid_from, valid_until, is_active, created_at, updated_at, deleted_at
     FROM coupons WHERE deleted_at IS NULL ORDER BY created_at DESC`
  );
  return rows as CouponRow[];
}
