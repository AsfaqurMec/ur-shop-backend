import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import pool from '../database/pool';

/** Record a download event (for limit enforcement and audit). Call inside transaction when using with token. */
export async function create(
  conn: PoolConnection,
  data: {
    order_item_id: number;
    user_id: number;
    product_file_id: number;
    ip?: string | null;
    user_agent?: string | null;
  }
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `INSERT INTO downloads (order_item_id, user_id, product_file_id, ip, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.order_item_id,
      data.user_id,
      data.product_file_id,
      data.ip ?? null,
      data.user_agent ?? null,
    ]
  );
  return result.insertId;
}

/** Count downloads for an entitlement (order_item_id + product_file_id). Used for limit check. */
export async function countByOrderItemAndFile(
  orderItemId: number,
  productFileId: number
): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM downloads
     WHERE order_item_id = ? AND product_file_id = ?`,
    [orderItemId, productFileId]
  );
  return Number((rows[0] as { cnt: number }).cnt);
}
