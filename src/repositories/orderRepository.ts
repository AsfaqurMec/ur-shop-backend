import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import pool from '../database/pool';
import type { OrderStatus, OrderItemProductType, OrderRow, OrderItemRow, PaymentRow } from '../types/order';

function parseOrderItemSelectionsSummary(
  raw: unknown
): Array<{ label: string; value: string }> | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const out: Array<{ label: string; value: string }> = [];
    for (const el of raw) {
      if (el && typeof el === 'object' && !Array.isArray(el)) {
        const o = el as Record<string, unknown>;
        const label = o.label != null ? String(o.label) : '';
        const value = o.value != null ? String(o.value) : '';
        if (label.trim() || value.trim()) out.push({ label, value });
      }
    }
    return out.length ? out : null;
  }
  if (typeof raw === 'string') {
    try {
      return parseOrderItemSelectionsSummary(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  if (Buffer.isBuffer(raw)) {
    try {
      return parseOrderItemSelectionsSummary(JSON.parse(raw.toString('utf8')));
    } catch {
      return null;
    }
  }
  return null;
}

function parseOrderItemSelections(raw: unknown): Record<string, string> | null {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(o)) {
      if (v == null) continue;
      const s = typeof v === 'string' ? v.trim() : String(v).trim();
      if (s) out[k] = s;
    }
    return Object.keys(out).length ? out : null;
  }
  if (typeof raw === 'string') {
    try {
      return parseOrderItemSelections(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  if (Buffer.isBuffer(raw)) {
    try {
      return parseOrderItemSelections(JSON.parse(raw.toString('utf8')));
    } catch {
      return null;
    }
  }
  return null;
}

function generateOrderNumber(): string {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${time}-${random}`;
}

export async function createOrder(
  conn: PoolConnection,
  data: {
    user_id: number;
    order_number?: string;
    status: OrderStatus;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    currency: string;
  }
): Promise<number> {
  const orderNumber = data.order_number || generateOrderNumber();
  const [result] = await conn.execute<ResultSetHeader>(
    `INSERT INTO orders (user_id, order_number, status, subtotal, discount, tax, total, currency)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.user_id,
      orderNumber,
      data.status,
      data.subtotal,
      data.discount,
      data.tax,
      data.total,
      data.currency,
    ]
  );
  return result.insertId;
}

export interface OrderItemInput {
  product_id: number;
  product_variation_id?: number | null;
  product_name: string;
  product_type: OrderItemProductType;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchase_selections: Record<string, string> | null;
  purchase_selections_summary: Array<{ label: string; value: string }> | null;
}

export async function createOrderItems(
  conn: PoolConnection,
  orderId: number,
  items: OrderItemInput[]
): Promise<void> {
  for (const item of items) {
    const selObj = item.purchase_selections && Object.keys(item.purchase_selections).length > 0 ? item.purchase_selections : {};
    const sumArr = item.purchase_selections_summary?.length ? item.purchase_selections_summary : [];
    await conn.execute(
      `INSERT INTO order_items (order_id, product_id, product_variation_id, product_name, product_type, quantity, unit_price, total_price, purchase_selections, purchase_selections_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        item.product_id,
        item.product_variation_id ?? null,
        item.product_name,
        item.product_type,
        item.quantity,
        item.unit_price,
        item.total_price,
        JSON.stringify(selObj),
        JSON.stringify(sumArr),
      ]
    );
  }
}

export async function createPayment(
  conn: PoolConnection,
  data: {
    order_id: number;
    amount: number;
    currency: string;
    status: string;
    gateway: string;
    payment_option_id?: number | null;
    gateway_reference?: string | null;
    bkash_payment_id?: string | null;
  }
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `INSERT INTO payments (order_id, amount, currency, status, gateway, payment_option_id, gateway_reference, bkash_payment_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.order_id,
      data.amount,
      data.currency,
      data.status,
      data.gateway,
      data.payment_option_id ?? null,
      data.gateway_reference ?? null,
      data.bkash_payment_id ?? null,
    ]
  );
  return result.insertId;
}

export async function findOrderById(id: number): Promise<OrderRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, user_id, order_number, status, subtotal, discount, tax, total, currency, created_at, updated_at
     FROM orders WHERE id = ? LIMIT 1`,
    [id]
  );
  return (rows[0] as OrderRow) ?? null;
}

export interface OrderListRow {
  id: number;
  order_number: string;
  status: string;
  total: number;
  currency: string;
  created_at: Date;
}

export async function findOrdersByUserId(
  userId: number,
  options: { limit?: number; offset?: number } = {}
): Promise<OrderListRow[]> {
  const { limit = 50, offset = 0 } = options;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, order_number, status, total, currency, created_at
     FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return rows as OrderListRow[];
}

export async function countOrdersByUserId(userId: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM orders WHERE user_id = ?',
    [userId]
  );
  return Number((rows[0] as { total: number }).total);
}

export async function countOrdersByUserIdAndStatus(
  userId: number,
  status: OrderStatus
): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM orders WHERE user_id = ? AND status = ?',
    [userId, status]
  );
  return Number((rows[0] as { total: number }).total);
}

export async function findOrderItems(orderId: number): Promise<OrderItemRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, order_id, product_id, product_variation_id, product_name, product_type, quantity, unit_price, total_price,
            purchase_selections, purchase_selections_summary, created_at
     FROM order_items WHERE order_id = ? ORDER BY id ASC`,
    [orderId]
  );
  return (rows as RowDataPacket[]).map((r) => ({
    ...r,
    purchase_selections: parseOrderItemSelections(r.purchase_selections),
    purchase_selections_summary: parseOrderItemSelectionsSummary(r.purchase_selections_summary),
  })) as OrderItemRow[];
}

/** Find a paid/completed order for this user that contains the given product (for verified purchase). Returns order_id or null. */
export async function findPaidOrderIdContainingProduct(
  userId: number,
  productId: number
): Promise<number | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT o.id FROM orders o
     INNER JOIN order_items oi ON oi.order_id = o.id AND oi.product_id = ?
     WHERE o.user_id = ? AND o.status IN ('paid', 'processing', 'completed')
     ORDER BY o.created_at DESC LIMIT 1`,
    [productId, userId]
  );
  return (rows[0] as { id: number })?.id ?? null;
}

export async function findPaymentByOrderId(orderId: number): Promise<PaymentRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, order_id, amount, currency, status, gateway, payment_option_id, gateway_reference, bkash_payment_id, created_at, updated_at
     FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1`,
    [orderId]
  );
  return (rows[0] as PaymentRow) ?? null;
}

/** Latest payment row for this bKash payment session id (set after create payment API). */
export async function findPaymentByBkashPaymentId(bkashPaymentId: string): Promise<PaymentRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, order_id, amount, currency, status, gateway, payment_option_id, gateway_reference, bkash_payment_id, created_at, updated_at
     FROM payments WHERE bkash_payment_id = ? ORDER BY id DESC LIMIT 1`,
    [bkashPaymentId]
  );
  return (rows[0] as PaymentRow) ?? null;
}

export async function updatePaymentBkashSession(
  paymentId: number,
  data: { bkash_payment_id: string; gateway_reference?: string | null }
): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE payments SET bkash_payment_id = ?, gateway_reference = ? WHERE id = ?`,
    [data.bkash_payment_id, data.gateway_reference ?? null, paymentId]
  );
  return result.affectedRows > 0;
}

export async function updatePaymentGatewayReference(paymentId: number, gatewayReference: string): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE payments SET gateway_reference = ? WHERE id = ?`,
    [gatewayReference, paymentId]
  );
  return result.affectedRows > 0;
}

/** Returns true if this call moved the order from pending → paid (used to avoid double fulfillment). */
export async function tryTransitionOrderToPaid(orderId: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE orders SET status = 'paid' WHERE id = ? AND status = 'pending'`,
    [orderId]
  );
  return result.affectedRows > 0;
}

export async function updateOrderStatus(orderId: number, status: string): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, orderId]
  );
  return result.affectedRows > 0;
}

export async function updatePaymentStatus(paymentId: number, status: string): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE payments SET status = ? WHERE id = ?',
    [status, paymentId]
  );
  return result.affectedRows > 0;
}

/** Remove order and dependent rows (cascade). Call coupon rollback before this if a coupon was applied. */
export async function deleteOrderById(orderId: number): Promise<void> {
  await pool.execute('DELETE FROM orders WHERE id = ?', [orderId]);
}
