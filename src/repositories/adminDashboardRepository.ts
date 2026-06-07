import type { RowDataPacket } from 'mysql2/promise';
import pool from '../database/pool';
import type {
  AdminDashboardSummary,
  AdminSalesSummary,
  AdminOrdersByStatus,
  AdminRecentOrder,
  AdminRecentPayment,
  AdminTopProduct,
  AdminLowStockLicense,
  AdminCustomerListItem,
} from '../types/adminDashboard';

/** Dashboard summary: orders total, paid count, revenue, customers, pending fulfillment, pending tickets. */
export async function getDashboardSummary(): Promise<AdminDashboardSummary> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
       (SELECT COUNT(*) FROM orders) AS orders_total,
       (SELECT COUNT(*) FROM orders WHERE status IN ('paid','processing','completed')) AS orders_paid,
       (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.status = 'completed') AS revenue_total,
       (SELECT COUNT(DISTINCT user_id) FROM orders) AS customers_count,
       (SELECT COUNT(*) FROM fulfillment_queue WHERE status = 'pending') AS pending_fulfillment_count,
       (SELECT COUNT(*) FROM tickets WHERE status IN ('open','answered','customer_reply')) AS pending_tickets_count`
  );
  const r = rows[0] as RowDataPacket;
  return {
    orders_total: Number(r.orders_total),
    orders_paid: Number(r.orders_paid),
    revenue_total: Number(r.revenue_total),
    customers_count: Number(r.customers_count),
    pending_fulfillment_count: Number(r.pending_fulfillment_count),
    pending_tickets_count: Number(r.pending_tickets_count),
  };
}

/** Sales summary: total revenue and paid order count from completed payments. */
export async function getSalesSummary(): Promise<AdminSalesSummary> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
       COALESCE(SUM(amount), 0) AS total_revenue,
       COUNT(DISTINCT order_id) AS total_orders_paid,
       COALESCE(MAX(currency), 'BDT') AS currency
     FROM payments WHERE status = 'completed'`
  );
  const r = rows[0] as RowDataPacket;
  return {
    total_revenue: Number(r.total_revenue),
    total_orders_paid: Number(r.total_orders_paid),
    currency: String(r.currency || 'BDT'),
  };
}

/** Orders grouped by status. */
export async function getOrdersByStatus(): Promise<AdminOrdersByStatus[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT status, COUNT(*) AS count FROM orders GROUP BY status ORDER BY count DESC`
  );
  return (rows as RowDataPacket[]).map((r) => ({
    status: String(r.status),
    count: Number(r.count),
  }));
}

/** Recent orders (latest first) with total count for pagination. */
export async function getRecentOrders(
  limit: number,
  offset: number,
  status?: string
): Promise<{ orders: AdminRecentOrder[]; total: number }> {
  const where = status ? 'WHERE status = ?' : '';
  const params: Array<string | number> = status ? [status] : [];
  const [[countRows], [rows]] = await Promise.all([
    pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM orders ${where}`, params),
    pool.execute<RowDataPacket[]>(
      `SELECT id, order_number, status, total, currency, user_id, created_at
       FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ),
  ]);
  const total = Number((countRows[0] as RowDataPacket).total);
  const orders = (rows as RowDataPacket[]).map((r) => ({
    id: r.id,
    order_number: r.order_number,
    status: r.status,
    total: Number(r.total),
    currency: r.currency,
    user_id: r.user_id,
    created_at: new Date(r.created_at).toISOString(),
  }));
  return { orders, total };
}

export async function updateOrderStatus(orderId: number, status: 'pending' | 'paid' | 'unpaid'): Promise<boolean> {
  const [result] = await pool.execute<import('mysql2/promise').ResultSetHeader>(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, orderId]
  );
  return result.affectedRows > 0;
}

export async function getOrderListItemById(orderId: number): Promise<AdminRecentOrder | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, order_number, status, total, currency, user_id, created_at
     FROM orders WHERE id = ? LIMIT 1`,
    [orderId]
  );
  const r = rows[0] as RowDataPacket | undefined;
  if (!r) return null;
  return {
    id: r.id,
    order_number: r.order_number,
    status: r.status,
    total: Number(r.total),
    currency: r.currency,
    user_id: r.user_id,
    created_at: new Date(r.created_at).toISOString(),
  };
}

/** Recent payments (latest first) with order_number. */
export async function getRecentPayments(limit: number): Promise<AdminRecentPayment[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.id, p.order_id, o.order_number, p.amount, p.currency, p.gateway, p.status, p.created_at
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     ORDER BY p.created_at DESC LIMIT ?`,
    [limit]
  );
  return (rows as RowDataPacket[]).map((r) => ({
    id: r.id,
    order_id: r.order_id,
    order_number: r.order_number,
    amount: Number(r.amount),
    currency: r.currency,
    gateway: r.gateway,
    status: r.status,
    created_at: new Date(r.created_at).toISOString(),
  }));
}

/** Top products by quantity sold (from order_items; paid orders only). */
export async function getTopProducts(limit: number): Promise<AdminTopProduct[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
       oi.product_id,
       MAX(oi.product_name) AS product_name,
       COALESCE(SUM(oi.quantity), 0) AS quantity_sold,
       COALESCE(SUM(oi.total_price), 0) AS revenue,
       MAX(o.currency) AS currency
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.status IN ('paid','processing','completed')
     GROUP BY oi.product_id
     ORDER BY quantity_sold DESC
     LIMIT ?`,
    [Math.min(limit, 20)]
  );
  return (rows as RowDataPacket[]).map((r) => ({
    product_id: r.product_id,
    product_name: r.product_name,
    quantity_sold: Number(r.quantity_sold),
    revenue: Number(r.revenue),
    currency: r.currency || 'BDT',
  }));
}

/** License key products with available keys at or below threshold. */
export async function getLowStockLicenseProducts(
  threshold: number
): Promise<AdminLowStockLicense[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
       p.id AS product_id,
       p.name AS product_name,
       COALESCE(avail.cnt, 0) AS available_keys
     FROM products p
     LEFT JOIN (
       SELECT product_id, COUNT(*) AS cnt
       FROM product_license_pools
       WHERE used_at IS NULL
       GROUP BY product_id
     ) avail ON avail.product_id = p.id
     WHERE p.deleted_at IS NULL
       AND p.product_type = 'license_key'
       AND COALESCE(avail.cnt, 0) <= ?
     ORDER BY available_keys ASC`,
    [threshold]
  );
  return (rows as RowDataPacket[]).map((r) => ({
    product_id: r.product_id,
    product_name: r.product_name,
    available_keys: Number(r.available_keys),
  }));
}

/** Count of fulfillment_queue where status = 'pending'. */
export async function getPendingFulfillmentCount(): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM fulfillment_queue WHERE status = ?',
    ['pending']
  );
  return Number((rows[0] as { total: number }).total);
}

/** Count of tickets that are not closed. */
export async function getPendingTicketsCount(): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM tickets WHERE status IN ('open','answered','customer_reply')`
  );
  return Number((rows[0] as { total: number }).total);
}

/** Users with at least one order: email, name, order count, last order time. */
export async function getCustomersWithOrders(
  limit: number,
  offset: number
): Promise<{ customers: AdminCustomerListItem[]; total: number }> {
  const [[countRows], [rows]] = await Promise.all([
    pool.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT u.id) AS total
       FROM users u
       INNER JOIN orders o ON o.user_id = u.id
       WHERE u.deleted_at IS NULL`
    ),
    pool.execute<RowDataPacket[]>(
      `SELECT
         u.id AS user_id,
         u.email,
         u.name,
         COUNT(o.id) AS order_count,
         MAX(o.created_at) AS last_order_at
       FROM users u
       INNER JOIN orders o ON o.user_id = u.id
       WHERE u.deleted_at IS NULL
       GROUP BY u.id, u.email, u.name
       ORDER BY last_order_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    ),
  ]);
  const total = Number((countRows[0] as RowDataPacket).total);
  const customers = (rows as RowDataPacket[]).map((r) => ({
    user_id: r.user_id,
    email: String(r.email),
    name: String(r.name ?? ''),
    order_count: Number(r.order_count),
    last_order_at: new Date(r.last_order_at).toISOString(),
  }));
  return { customers, total };
}

export async function userHasOrders(userId: number): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT 1 FROM orders WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return rows.length > 0;
}

/** Single customer row for admin (must have at least one order and not be deleted). */
export async function getCustomerAggregateById(
  userId: number
): Promise<AdminCustomerListItem | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
       u.id AS user_id,
       u.email,
       u.name,
       COUNT(o.id) AS order_count,
       MAX(o.created_at) AS last_order_at
     FROM users u
     INNER JOIN orders o ON o.user_id = u.id
     WHERE u.id = ? AND u.deleted_at IS NULL
     GROUP BY u.id, u.email, u.name`,
    [userId]
  );
  if (rows.length === 0) return null;
  const r = rows[0] as RowDataPacket;
  return {
    user_id: r.user_id,
    email: String(r.email),
    name: String(r.name ?? ''),
    order_count: Number(r.order_count),
    last_order_at: new Date(r.last_order_at).toISOString(),
  };
}
