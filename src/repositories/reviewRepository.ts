import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../database/pool';
import type { ReviewRow } from '../types/review';

export async function create(data: {
  product_id: number;
  user_id: number;
  order_id: number | null;
  rating: number;
  title: string | null;
  body: string | null;
}): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO reviews (product_id, user_id, order_id, rating, title, body, status)
     VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
    [
      data.product_id,
      data.user_id,
      data.order_id ?? null,
      data.rating,
      data.title ?? null,
      data.body ?? null,
    ]
  );
  return result.insertId;
}

export async function findById(id: number): Promise<ReviewRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, product_id, user_id, order_id, rating, title, body, status, created_at, updated_at, deleted_at
     FROM reviews WHERE id = ? LIMIT 1`,
    [id]
  );
  return (rows[0] as ReviewRow) ?? null;
}

export async function findByUserAndProduct(userId: number, productId: number): Promise<ReviewRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, product_id, user_id, order_id, rating, title, body, status, created_at, updated_at, deleted_at
     FROM reviews WHERE user_id = ? AND product_id = ? LIMIT 1`,
    [userId, productId]
  );
  return (rows[0] as ReviewRow) ?? null;
}

export interface ReviewListRow {
  id: number;
  product_id: number;
  user_id: number;
  order_id: number | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/** Public list: not hidden (admin can hide; no separate approval step). */
export async function findByProductIdPublic(
  productId: number,
  options: { limit?: number; offset?: number } = {}
): Promise<ReviewListRow[]> {
  const limit = Math.min(options.limit ?? 50, 100);
  const offset = options.offset ?? 0;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, product_id, user_id, order_id, rating, title, body, status, created_at, updated_at, deleted_at
     FROM reviews
     WHERE product_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [productId, limit, offset]
  );
  return rows as ReviewListRow[];
}

export async function countByProductIdPublic(productId: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM reviews
     WHERE product_id = ? AND deleted_at IS NULL`,
    [productId]
  );
  return Number((rows[0] as { total: number }).total);
}

export interface ReviewAdminTableJoinRow extends ReviewListRow {
  product_name: string;
  product_slug: string;
  category_id: number | null;
  category_name: string | null;
}

function adminListWhereClause(categoryId?: number): { clause: string; params: (number | null)[] } {
  let clause = 'WHERE p.deleted_at IS NULL';
  const params: (number | null)[] = [];
  if (categoryId === 0) {
    clause += ' AND p.category_id IS NULL';
  } else if (categoryId != null && categoryId > 0) {
    clause += ' AND p.category_id = ?';
    params.push(categoryId);
  }
  return { clause, params };
}

/** Admin: paginated list with optional category filter (omit = all; 0 = uncategorized). */
export async function findAllAdmin(
  categoryId: number | undefined,
  options: { limit?: number; offset?: number } = {}
): Promise<ReviewAdminTableJoinRow[]> {
  const limit = Math.min(options.limit ?? 10, 100);
  const offset = options.offset ?? 0;
  const { clause, params: whereParams } = adminListWhereClause(categoryId);
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT r.id, r.product_id, r.user_id, r.order_id, r.rating, r.title, r.body, r.status,
            r.created_at, r.updated_at, r.deleted_at,
            p.name AS product_name, p.slug AS product_slug, p.category_id AS category_id, c.name AS category_name
     FROM reviews r
     INNER JOIN products p ON p.id = r.product_id
     LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL
     ${clause}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...whereParams, limit, offset]
  );
  return rows as ReviewAdminTableJoinRow[];
}

export async function countAllAdmin(categoryId: number | undefined): Promise<number> {
  const { clause, params: whereParams } = adminListWhereClause(categoryId);
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM reviews r
     INNER JOIN products p ON p.id = r.product_id
     LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL
     ${clause}`,
    whereParams
  );
  return Number((rows[0] as { total: number }).total);
}

/** Admin list: all reviews for a product (any status, including hidden). */
export async function findByProductIdAdmin(
  productId: number,
  options: { limit?: number; offset?: number } = {}
): Promise<ReviewListRow[]> {
  const limit = Math.min(options.limit ?? 50, 100);
  const offset = options.offset ?? 0;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, product_id, user_id, order_id, rating, title, body, status, created_at, updated_at, deleted_at
     FROM reviews
     WHERE product_id = ?
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [productId, limit, offset]
  );
  return rows as ReviewListRow[];
}

export async function countByProductIdAdmin(productId: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM reviews WHERE product_id = ?`,
    [productId]
  );
  return Number((rows[0] as { total: number }).total);
}

export async function update(
  id: number,
  data: { rating?: number; title?: string | null; body?: string | null }
): Promise<boolean> {
  const set: string[] = [];
  const params: (number | string | null)[] = [];
  if (data.rating !== undefined) {
    set.push('rating = ?');
    params.push(data.rating);
  }
  if (data.title !== undefined) {
    set.push('title = ?');
    params.push(data.title);
  }
  if (data.body !== undefined) {
    set.push('body = ?');
    params.push(data.body);
  }
  if (set.length === 0) return true;
  params.push(id);
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE reviews SET ${set.join(', ')} WHERE id = ?`,
    params
  );
  return result.affectedRows > 0;
}

/** Soft delete (hide). */
export async function setHidden(id: number, hidden: boolean): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE reviews SET deleted_at = ? WHERE id = ?`,
    [hidden ? new Date() : null, id]
  );
  return result.affectedRows > 0;
}

