import type { ResultSetHeader } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import pool from '../database/pool';

export async function create(
  conn: PoolConnection,
  data: {
    order_id: number;
    order_item_id: number | null;
    action: string;
    details: Record<string, unknown> | null;
  }
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    'INSERT INTO delivery_logs (order_id, order_item_id, action, details) VALUES (?, ?, ?, ?)',
    [
      data.order_id,
      data.order_item_id ?? null,
      data.action,
      data.details ? JSON.stringify(data.details) : null,
    ]
  );
  return result.insertId;
}

import type { RowDataPacket } from 'mysql2/promise';

export async function findByOrderId(orderId: number): Promise<DeliveryLogRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, order_id, order_item_id, action, details, created_at FROM delivery_logs WHERE order_id = ? ORDER BY created_at ASC',
    [orderId]
  );
  return rows as DeliveryLogRow[];
}

interface DeliveryLogRow {
  id: number;
  order_id: number;
  order_item_id: number | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: Date;
}
