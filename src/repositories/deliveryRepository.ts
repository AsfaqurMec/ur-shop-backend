import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import pool from '../database/pool';

export type DeliveryStatus = 'pending' | 'processing' | 'delivered' | 'failed';

export async function findByOrderId(orderId: number): Promise<DeliveryRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, order_id, status, notes, delivered_at, created_at, updated_at
     FROM deliveries WHERE order_id = ? LIMIT 1`,
    [orderId]
  );
  return (rows[0] as DeliveryRow) ?? null;
}

export async function create(orderId: number, status: DeliveryStatus = 'pending'): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO deliveries (order_id, status) VALUES (?, ?)',
    [orderId, status]
  );
  return result.insertId;
}

export async function updateStatus(orderId: number, status: DeliveryStatus, notes?: string | null): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE deliveries SET status = ?, notes = COALESCE(?, notes), delivered_at = CASE WHEN ? = "delivered" THEN CURRENT_TIMESTAMP(3) ELSE delivered_at END WHERE order_id = ?',
    [status, notes ?? null, status, orderId]
  );
  return result.affectedRows > 0;
}

export async function createOrUpdateToProcessing(orderId: number): Promise<void> {
  const existing = await findByOrderId(orderId);
  if (existing) {
    await updateStatus(orderId, 'processing');
  } else {
    await create(orderId, 'processing');
  }
}

export async function updateStatusWithConnection(
  conn: PoolConnection,
  orderId: number,
  status: DeliveryStatus,
  notes?: string | null
): Promise<boolean> {
  const [result] = await conn.execute<ResultSetHeader>(
    'UPDATE deliveries SET status = ?, notes = COALESCE(?, notes), delivered_at = CASE WHEN ? = "delivered" THEN CURRENT_TIMESTAMP(3) ELSE delivered_at END WHERE order_id = ?',
    [status, notes ?? null, status, orderId]
  );
  return result.affectedRows > 0;
}

export interface DeliveryRow {
  id: number;
  order_id: number;
  status: string;
  notes: string | null;
  delivered_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
