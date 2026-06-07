import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import pool from '../database/pool';
import type { FulfillmentQueueProductType, FulfillmentQueueStatus } from '../types/delivery';

let hasDueAtColumnCache: boolean | null = null;
let hasFulfilledByAdminIdColumnCache: boolean | null = null;

async function hasColumn(columnName: 'due_at' | 'fulfilled_by_admin_id'): Promise<boolean> {
  if (columnName === 'due_at' && hasDueAtColumnCache != null) return hasDueAtColumnCache;
  if (columnName === 'fulfilled_by_admin_id' && hasFulfilledByAdminIdColumnCache != null) {
    return hasFulfilledByAdminIdColumnCache;
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'fulfillment_queue'
       AND COLUMN_NAME = ?`,
    [columnName]
  );
  const exists = Number((rows[0] as { c: number }).c) > 0;
  if (columnName === 'due_at') hasDueAtColumnCache = exists;
  if (columnName === 'fulfilled_by_admin_id') hasFulfilledByAdminIdColumnCache = exists;
  return exists;
}

export async function create(
  conn: PoolConnection,
  data: {
    order_id: number;
    order_item_id: number;
    product_id: number;
    product_type: FulfillmentQueueProductType;
    user_id: number;
    due_at?: Date | null;
  }
): Promise<number> {
  const hasDueAt = await hasColumn('due_at');
  const [result] = hasDueAt
    ? await conn.execute<ResultSetHeader>(
        `INSERT INTO fulfillment_queue (order_id, order_item_id, product_id, product_type, user_id, due_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.order_id, data.order_item_id, data.product_id, data.product_type, data.user_id, data.due_at ?? null]
      )
    : await conn.execute<ResultSetHeader>(
        `INSERT INTO fulfillment_queue (order_id, order_item_id, product_id, product_type, user_id)
         VALUES (?, ?, ?, ?, ?)`,
        [data.order_id, data.order_item_id, data.product_id, data.product_type, data.user_id]
      );
  return result.insertId;
}

export async function findPending(): Promise<FulfillmentQueueRow[]> {
  const [hasDueAt, hasFulfilledByAdminId] = await Promise.all([
    hasColumn('due_at'),
    hasColumn('fulfilled_by_admin_id'),
  ]);
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, order_id, order_item_id, product_id, product_type, user_id, status, notes,
            ${hasDueAt ? 'due_at' : 'NULL AS due_at'},
            fulfilled_at,
            ${hasFulfilledByAdminId ? 'fulfilled_by_admin_id' : 'NULL AS fulfilled_by_admin_id'},
            created_at, updated_at
     FROM fulfillment_queue WHERE status = 'pending' ORDER BY created_at ASC`
  );
  return rows as FulfillmentQueueRow[];
}

/** Count queue rows still waiting on admin/manual fulfillment for an order. */
export async function countPendingByOrderId(orderId: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM fulfillment_queue WHERE order_id = ? AND status = 'pending'`,
    [orderId]
  );
  return Number((rows[0] as { c: number }).c);
}

export interface FulfillmentForUserRow {
  id: number;
  order_id: number;
  order_number: string;
  order_item_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_variation_id: number | null;
  product_type: string;
  status: string;
  notes: string | null;
  due_at: Date | null;
  fulfilled_at: Date | null;
  fulfilled_by_admin_id: number | null;
  created_at: Date;
}

/** Fulfillment queue items for a user (all statuses). Join orders for order_number and order_items for product_name. */
export async function findByUserId(userId: number): Promise<FulfillmentForUserRow[]> {
  const [hasDueAt, hasFulfilledByAdminId] = await Promise.all([
    hasColumn('due_at'),
    hasColumn('fulfilled_by_admin_id'),
  ]);
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT fq.id, fq.order_id, o.order_number, fq.order_item_id, fq.product_id, oi.product_name,
            p.slug AS product_slug, oi.product_variation_id,
            fq.product_type, fq.status, fq.notes,
            ${hasDueAt ? 'fq.due_at' : 'NULL AS due_at'},
            fq.fulfilled_at,
            ${hasFulfilledByAdminId ? 'fq.fulfilled_by_admin_id' : 'NULL AS fulfilled_by_admin_id'},
            fq.created_at
     FROM fulfillment_queue fq
     JOIN orders o ON o.id = fq.order_id
     JOIN order_items oi ON oi.id = fq.order_item_id
     JOIN products p ON p.id = fq.product_id
     WHERE fq.user_id = ?
     ORDER BY fq.created_at DESC`,
    [userId]
  );
  return rows as FulfillmentForUserRow[];
}

export async function findById(id: number): Promise<FulfillmentQueueRow | null> {
  const [hasDueAt, hasFulfilledByAdminId] = await Promise.all([
    hasColumn('due_at'),
    hasColumn('fulfilled_by_admin_id'),
  ]);
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, order_id, order_item_id, product_id, product_type, user_id, status, notes,
            ${hasDueAt ? 'due_at' : 'NULL AS due_at'},
            fulfilled_at,
            ${hasFulfilledByAdminId ? 'fulfilled_by_admin_id' : 'NULL AS fulfilled_by_admin_id'},
            created_at, updated_at
     FROM fulfillment_queue WHERE id = ? LIMIT 1`,
    [id]
  );
  return (rows[0] as FulfillmentQueueRow) ?? null;
}

/** Lock row for update (call inside a transaction). */
export async function findByIdForUpdate(conn: PoolConnection, id: number): Promise<FulfillmentQueueRow | null> {
  const [hasDueAt, hasFulfilledByAdminId] = await Promise.all([
    hasColumn('due_at'),
    hasColumn('fulfilled_by_admin_id'),
  ]);
  const [rows] = await conn.execute<RowDataPacket[]>(
    `SELECT id, order_id, order_item_id, product_id, product_type, user_id, status, notes,
            ${hasDueAt ? 'due_at' : 'NULL AS due_at'},
            fulfilled_at,
            ${hasFulfilledByAdminId ? 'fulfilled_by_admin_id' : 'NULL AS fulfilled_by_admin_id'},
            created_at, updated_at
     FROM fulfillment_queue WHERE id = ? LIMIT 1 FOR UPDATE`,
    [id]
  );
  return (rows[0] as FulfillmentQueueRow) ?? null;
}

export async function markFulfilledWithConnection(
  conn: PoolConnection,
  id: number,
  notes?: string | null,
  fulfilledByAdminId?: number | null
): Promise<boolean> {
  const hasFulfilledByAdminId = await hasColumn('fulfilled_by_admin_id');
  const [result] = hasFulfilledByAdminId
    ? await conn.execute<ResultSetHeader>(
        `UPDATE fulfillment_queue SET status = ?, fulfilled_at = CURRENT_TIMESTAMP(3), fulfilled_by_admin_id = ?, notes = COALESCE(?, notes)
         WHERE id = ? AND status = 'pending'`,
        ['fulfilled', fulfilledByAdminId ?? null, notes ?? null, id]
      )
    : await conn.execute<ResultSetHeader>(
        `UPDATE fulfillment_queue SET status = ?, fulfilled_at = CURRENT_TIMESTAMP(3), notes = COALESCE(?, notes)
         WHERE id = ? AND status = 'pending'`,
        ['fulfilled', notes ?? null, id]
      );
  return result.affectedRows > 0;
}

export async function markFulfilled(id: number, notes?: string | null): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE fulfillment_queue SET status = ?, fulfilled_at = CURRENT_TIMESTAMP(3), notes = COALESCE(?, notes) WHERE id = ?',
    ['fulfilled', notes ?? null, id]
  );
  return result.affectedRows > 0;
}

export async function markFailed(id: number, notes?: string | null): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE fulfillment_queue SET status = ?, notes = COALESCE(?, notes) WHERE id = ?',
    ['failed', notes ?? null, id]
  );
  return result.affectedRows > 0;
}

interface FulfillmentQueueRow {
  id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  product_type: FulfillmentQueueProductType;
  user_id: number;
  status: FulfillmentQueueStatus;
  notes: string | null;
  due_at: Date | null;
  fulfilled_at: Date | null;
  fulfilled_by_admin_id: number | null;
  created_at: Date;
  updated_at: Date;
}
