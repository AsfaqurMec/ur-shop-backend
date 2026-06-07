import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import pool from '../database/pool';

let hasPendingActivationEnumCache: boolean | null = null;

async function hasPendingActivationStatus(): Promise<boolean> {
  if (hasPendingActivationEnumCache != null) return hasPendingActivationEnumCache;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COLUMN_TYPE AS column_type
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'subscriptions'
       AND COLUMN_NAME = 'status'
     LIMIT 1`
  );
  const raw = String((rows[0] as { column_type?: string } | undefined)?.column_type ?? '');
  const exists = raw.includes("'pending_activation'");
  hasPendingActivationEnumCache = exists;
  return exists;
}

export interface SubscriptionForUserRow {
  id: number;
  order_id: number;
  order_number: string;
  order_item_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_variation_id: number | null;
  status: 'pending_activation' | 'active' | 'cancelled' | 'expired';
  current_period_start: Date;
  current_period_end: Date;
  created_at: Date;
}

/** Row for “expires tomorrow” reminder emails (UTC calendar day). */
export interface SubscriptionExpiryReminderRow {
  id: number;
  user_id: number;
  user_email: string;
  product_id: number;
  product_slug: string;
  product_name: string;
  product_variation_id: number | null;
  current_period_end: Date;
}

export async function findByOrderItemId(orderItemId: number): Promise<{ current_period_end: Date } | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT current_period_end FROM subscriptions WHERE order_item_id = ? LIMIT 1',
    [orderItemId]
  );
  const r = rows[0] as { current_period_end: Date } | undefined;
  return r ?? null;
}

export async function findByUserId(userId: number): Promise<SubscriptionForUserRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT s.id, s.order_id, o.order_number, s.order_item_id, s.product_id, oi.product_name,
            p.slug AS product_slug, oi.product_variation_id, s.status,
            s.current_period_start, s.current_period_end, s.created_at
     FROM subscriptions s
     JOIN order_items oi ON oi.id = s.order_item_id
     JOIN orders o ON o.id = s.order_id
     JOIN products p ON p.id = s.product_id AND p.deleted_at IS NULL
     WHERE s.user_id = ?
     ORDER BY s.current_period_end ASC, s.created_at DESC`,
    [userId]
  );
  return rows as SubscriptionForUserRow[];
}

export async function countByUserId(userId: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM subscriptions WHERE user_id = ?',
    [userId]
  );
  return Number((rows[0] as { total: number }).total);
}

export async function existsByOrderItemIdWithConnection(
  conn: PoolConnection,
  orderItemId: number
): Promise<boolean> {
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT 1 FROM subscriptions WHERE order_item_id = ? LIMIT 1',
    [orderItemId]
  );
  return rows.length > 0;
}

export async function createWithConnection(
  conn: PoolConnection,
  data: {
    order_id: number;
    order_item_id: number;
    user_id: number;
    product_id: number;
    status?: 'pending_activation' | 'active' | 'cancelled' | 'expired';
    current_period_start: Date;
    current_period_end: Date;
  }
): Promise<number> {
  const supportsPendingActivation = await hasPendingActivationStatus();
  const safeStatus =
    data.status === 'pending_activation' && !supportsPendingActivation ? 'active' : (data.status ?? 'active');
  const [result] = await conn.execute<ResultSetHeader>(
    `INSERT INTO subscriptions (order_id, order_item_id, user_id, product_id, status, current_period_start, current_period_end)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.order_id,
      data.order_item_id,
      data.user_id,
      data.product_id,
      safeStatus,
      data.current_period_start,
      data.current_period_end,
    ]
  );
  return result.insertId;
}

export async function updateStatusByOrderItemIdWithConnection(
  conn: PoolConnection,
  orderItemId: number,
  status: 'pending_activation' | 'active' | 'cancelled' | 'expired'
): Promise<boolean> {
  const supportsPendingActivation = await hasPendingActivationStatus();
  const safeStatus = status === 'pending_activation' && !supportsPendingActivation ? 'active' : status;
  const [result] = await conn.execute<ResultSetHeader>(
    `UPDATE subscriptions SET status = ? WHERE order_item_id = ?`,
    [safeStatus, orderItemId]
  );
  return result.affectedRows > 0;
}

/**
 * Active subscriptions whose period ends on tomorrow’s UTC date, reminder not yet sent.
 * Run once per UTC day (e.g. cron 08:00 UTC).
 */
export async function findActiveNeedingExpiryReminderUtc(): Promise<SubscriptionExpiryReminderRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT s.id, s.user_id, u.email AS user_email, s.product_id, p.slug AS product_slug,
            oi.product_name, oi.product_variation_id, s.current_period_end
     FROM subscriptions s
     INNER JOIN users u ON u.id = s.user_id
     INNER JOIN products p ON p.id = s.product_id AND p.deleted_at IS NULL
     INNER JOIN order_items oi ON oi.id = s.order_item_id
     WHERE s.status = 'active'
       AND s.expiry_reminder_sent_at IS NULL
       AND s.current_period_end > UTC_TIMESTAMP(3)
       AND DATE(s.current_period_end) = DATE(DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 1 DAY))`
  );
  return rows as SubscriptionExpiryReminderRow[];
}

export async function markExpiryReminderSent(subscriptionId: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE subscriptions SET expiry_reminder_sent_at = UTC_TIMESTAMP(3) WHERE id = ? AND expiry_reminder_sent_at IS NULL`,
    [subscriptionId]
  );
  return result.affectedRows > 0;
}
