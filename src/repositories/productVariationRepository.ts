import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import pool from '../database/pool';
import { combinationSignature, parseCombination } from '../utils/combinationSignature';
import { AppError } from '../middlewares/errorHandler';

export interface ProductVariationRow {
  id: number;
  product_id: number;
  sku: string | null;
  quantity: number | null;
  price: number;
  compare_at_price: number | null;
  enabled: number;
  sort_order: number;
  combination: Record<string, string>;
  combination_signature: string;
}

export interface VariationReplaceInput {
  combination: Record<string, string>;
  sku: string | null;
  quantity: number | null;
  price: number;
  compare_at_price: number | null;
  enabled: boolean;
  sort_order: number;
}

function rowToVariation(r: RowDataPacket): ProductVariationRow {
  return {
    id: r.id,
    product_id: r.product_id,
    sku: r.sku ?? null,
    quantity: r.quantity != null ? Number(r.quantity) : null,
    price: Number(r.price),
    compare_at_price: r.compare_at_price != null ? Number(r.compare_at_price) : null,
    enabled: r.enabled,
    sort_order: r.sort_order,
    combination: parseCombination(r.combination),
    combination_signature: String(r.combination_signature),
  };
}

export async function findVariationsByProductId(productId: number): Promise<ProductVariationRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, product_id, sku, quantity, price, compare_at_price, enabled, sort_order, combination, combination_signature
     FROM product_variations WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
    [productId]
  );
  return (rows as RowDataPacket[]).map(rowToVariation);
}

export async function findVariationById(id: number): Promise<ProductVariationRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, product_id, sku, quantity, price, compare_at_price, enabled, sort_order, combination, combination_signature
     FROM product_variations WHERE id = ? LIMIT 1`,
    [id]
  );
  const r = rows[0] as RowDataPacket | undefined;
  return r ? rowToVariation(r) : null;
}

export async function countEnabledVariations(productId: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS c FROM product_variations WHERE product_id = ? AND enabled = 1',
    [productId]
  );
  return Number((rows[0] as { c: number }).c);
}

/** Adjust variation quantity by delta (negative = sold). Null quantity means unlimited/no stock tracking. */
/** Set absolute stock for a variation (used to mirror license pool availability). */
export async function setVariationQuantityAbsolute(variationId: number, quantity: number): Promise<void> {
  await pool.execute('UPDATE product_variations SET quantity = ? WHERE id = ?', [quantity, variationId]);
}

export async function adjustVariationQuantity(
  conn: PoolConnection,
  variationId: number,
  delta: number
): Promise<void> {
  if (delta === 0) return;
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT id, quantity FROM product_variations WHERE id = ? FOR UPDATE',
    [variationId]
  );
  const r = rows[0] as { id: number; quantity: number | null } | undefined;
  if (!r) throw new AppError(400, 'Product option not found');
  if (r.quantity == null) return;
  const next = Number(r.quantity) + delta;
  if (next < 0) {
    throw new AppError(400, 'Not enough stock for this product option');
  }
  await conn.execute('UPDATE product_variations SET quantity = ? WHERE id = ?', [next, variationId]);
}

export async function deleteAllForProduct(conn: PoolConnection, productId: number): Promise<void> {
  await conn.execute('UPDATE products SET default_variation_id = NULL WHERE id = ? AND default_variation_id IS NOT NULL', [
    productId,
  ]);
  await conn.execute('DELETE FROM product_variations WHERE product_id = ?', [productId]);
}

export async function replaceVariationsForProduct(
  conn: PoolConnection,
  productId: number,
  inputs: VariationReplaceInput[]
): Promise<void> {
  await deleteAllForProduct(conn, productId);
  for (const v of inputs) {
    const sig = combinationSignature(v.combination);
    const comboJson = JSON.stringify(v.combination);
    // Plain string for JSON column — CAST(? AS JSON) with bound params often fails on mysql2/MySQL.
    await conn.execute(
      `INSERT INTO product_variations (product_id, sku, quantity, price, compare_at_price, enabled, sort_order, combination, combination_signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        v.sku ?? null,
        v.quantity ?? null,
        v.price,
        v.compare_at_price ?? null,
        v.enabled ? 1 : 0,
        v.sort_order,
        comboJson,
        sig,
      ]
    );
  }
}

/** Insert any Cartesian combinations missing (enabled by default). */
export async function insertGeneratedCombinations(
  conn: PoolConnection,
  productId: number,
  combos: Record<string, string>[],
  defaultPrice: number
): Promise<number> {
  let added  = 0;
  let order = 0;
  const [maxRow] = await conn.execute<RowDataPacket[]>(
    'SELECT COALESCE(MAX(sort_order), -1) AS m FROM product_variations WHERE product_id = ?',
    [productId]
  );
  order = Number((maxRow[0] as { m: number })?.m) + 1;

  for (const combo of combos) {
    const sig = combinationSignature(combo);
    const [exists] = await conn.execute<RowDataPacket[]>(
      'SELECT id FROM product_variations WHERE product_id = ? AND combination_signature = ? LIMIT 1',
      [productId, sig]
    );
    if (exists.length > 0) continue;
    await conn.execute(
      `INSERT INTO product_variations (product_id, sku, quantity, price, compare_at_price, enabled, sort_order, combination, combination_signature)
       VALUES (?, NULL, NULL, ?, NULL, 1, ?, ?, ?)`,
      [productId, defaultPrice, order, JSON.stringify(combo), sig]
    );
    order += 1;
    added += 1;
  }
  return added;
}
