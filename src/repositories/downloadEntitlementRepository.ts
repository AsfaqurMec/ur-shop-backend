import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import pool from '../database/pool';

export async function create(
  conn: PoolConnection,
  orderItemId: number,
  productFileId: number
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    'INSERT INTO download_entitlements (order_item_id, product_file_id) VALUES (?, ?)',
    [orderItemId, productFileId]
  );
  return result.insertId;
}

export async function createMany(
  conn: PoolConnection,
  orderItemId: number,
  productFileIds: number[]
): Promise<void> {
  for (const productFileId of productFileIds) {
    await conn.execute(
      'INSERT IGNORE INTO download_entitlements (order_item_id, product_file_id) VALUES (?, ?)',
      [orderItemId, productFileId]
    );
  }
}

export async function hasEntitlement(orderItemId: number, productFileId: number): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT 1 FROM download_entitlements WHERE order_item_id = ? AND product_file_id = ? LIMIT 1',
    [orderItemId, productFileId]
  );
  return rows.length > 0;
}

export async function findByOrderItemId(orderItemId: number): Promise<{ product_file_id: number }[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT product_file_id FROM download_entitlements WHERE order_item_id = ? ORDER BY product_file_id',
    [orderItemId]
  );
  return rows as { product_file_id: number }[];
}

export interface EntitlementForUserRow {
  entitlement_id: number;
  order_item_id: number;
  order_id: number;
  order_number: string;
  product_id: number;
  product_name: string;
  product_file_id: number;
  file_name: string;
  file_size: number | null;
  download_limit: number | null;
  expires_at: Date | null;
  created_at: Date;
  download_count: number;
}

/** List all download entitlements for a user with file info and download count. */
export async function findEntitlementsForUser(userId: number): Promise<EntitlementForUserRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
       e.id AS entitlement_id,
       e.order_item_id,
       e.product_file_id,
       e.expires_at,
       e.created_at,
       oi.order_id,
       oi.product_id,
       oi.product_name,
       pf.file_name,
       pf.file_size,
       pf.download_limit,
       ord.order_number,
       (SELECT COUNT(*) FROM downloads d WHERE d.order_item_id = e.order_item_id AND d.product_file_id = e.product_file_id) AS download_count
     FROM download_entitlements e
     JOIN order_items oi ON oi.id = e.order_item_id
     JOIN orders ord ON ord.id = oi.order_id
     JOIN product_files pf ON pf.id = e.product_file_id
     WHERE ord.user_id = ?
     ORDER BY e.created_at DESC`,
    [userId]
  );
  return rows as EntitlementForUserRow[];
}

export interface EntitlementByIdForUserRow {
  id: number;
  order_item_id: number;
  product_file_id: number;
  user_id: number;
  expires_at: Date | null;
}

/** Get entitlement by id and ensure it belongs to the given user (for token creation). */
export async function findByIdForUser(
  entitlementId: number,
  userId: number
): Promise<EntitlementByIdForUserRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT e.id, e.order_item_id, e.product_file_id, e.expires_at, ord.user_id
     FROM download_entitlements e
     JOIN order_items oi ON oi.id = e.order_item_id
     JOIN orders ord ON ord.id = oi.order_id
     WHERE e.id = ? AND ord.user_id = ?
     LIMIT 1`,
    [entitlementId, userId]
  );
  const r = rows[0] as RowDataPacket | undefined;
  if (!r) return null;
  return {
    id: r.id,
    order_item_id: r.order_item_id,
    product_file_id: r.product_file_id,
    user_id: r.user_id,
    expires_at: r.expires_at,
  };
}
