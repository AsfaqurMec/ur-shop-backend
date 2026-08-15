import { OrderItemModel, OrderModel, PaymentModel } from '../database/models';
import { nextId } from '../database/counter';
import type { OrderStatus, OrderItemProductType, OrderRow, OrderItemRow, PaymentRow } from '../types/order';

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function parseOrderItemSelectionsSummary(raw: unknown): Array<{ label: string; value: string }> | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const out = raw.flatMap((el) => {
      if (!el || typeof el !== 'object' || Array.isArray(el)) return [];
      const o = el as Record<string, unknown>;
      const label = o.label != null ? String(o.label) : '';
      const value = o.value != null ? String(o.value) : '';
      return label.trim() || value.trim() ? [{ label, value }] : [];
    });
    return out.length ? out : null;
  }
  if (typeof raw === 'string') {
    try {
      return parseOrderItemSelectionsSummary(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  return null;
}

function parseOrderItemSelections(raw: unknown): Record<string, string> | null {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
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
  return null;
}

function generateOrderNumber(): string {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${time}-${random}`;
}

function orderRow(doc: any): OrderRow {
  return {
    id: Number(doc.id),
    user_id: Number(doc.user_id),
    order_number: String(doc.order_number),
    status: doc.status as OrderStatus,
    subtotal: Number(doc.subtotal ?? 0),
    discount: Number(doc.discount ?? 0),
    tax: Number(doc.tax ?? 0),
    total: Number(doc.total ?? 0),
    currency: String(doc.currency ?? 'BDT'),
    shipping_mobile: doc.shipping_mobile != null && String(doc.shipping_mobile).trim()
      ? String(doc.shipping_mobile).trim()
      : null,
    shipping_address: doc.shipping_address != null && String(doc.shipping_address).trim()
      ? String(doc.shipping_address).trim()
      : null,
    shipping_city: doc.shipping_city != null && String(doc.shipping_city).trim()
      ? String(doc.shipping_city).trim()
      : null,
    shipping_postal_code: doc.shipping_postal_code != null && String(doc.shipping_postal_code).trim()
      ? String(doc.shipping_postal_code).trim()
      : null,
    shipping_address_line2: doc.shipping_address_line2 != null && String(doc.shipping_address_line2).trim()
      ? String(doc.shipping_address_line2).trim()
      : null,
    shipping_method_id: doc.shipping_method_id != null && String(doc.shipping_method_id).trim()
      ? String(doc.shipping_method_id).trim()
      : null,
    shipping_method_title: doc.shipping_method_title != null && String(doc.shipping_method_title).trim()
      ? String(doc.shipping_method_title).trim()
      : null,
    shipping_fee: Number(doc.shipping_fee ?? 0),
    created_at: date(doc.created_at),
    updated_at: date(doc.updated_at),
  };
}

function orderItemRow(doc: any): OrderItemRow {
  return {
    id: Number(doc.id),
    order_id: Number(doc.order_id),
    product_id: Number(doc.product_id),
    product_variation_id: doc.product_variation_id ?? null,
    product_name: String(doc.product_name),
    product_type: doc.product_type as OrderItemProductType,
    quantity: Number(doc.quantity ?? 1),
    unit_price: Number(doc.unit_price ?? 0),
    total_price: Number(doc.total_price ?? 0),
    purchase_selections: parseOrderItemSelections(doc.purchase_selections),
    purchase_selections_summary: parseOrderItemSelectionsSummary(doc.purchase_selections_summary),
    created_at: date(doc.created_at),
  };
}

function paymentRow(doc: any): PaymentRow {
  return {
    id: Number(doc.id),
    order_id: Number(doc.order_id),
    amount: Number(doc.amount ?? 0),
    currency: String(doc.currency ?? 'BDT'),
    status: String(doc.status ?? 'pending'),
    gateway: String(doc.gateway),
    payment_option_id: doc.payment_option_id ?? null,
    gateway_reference: doc.gateway_reference ?? null,
    bkash_payment_id: doc.bkash_payment_id ?? null,
    created_at: date(doc.created_at),
    updated_at: date(doc.updated_at),
  };
}

export async function createOrder(
  _conn: unknown,
  data: {
    user_id: number;
    order_number?: string;
    status: OrderStatus;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    currency: string;
    shipping_mobile?: string | null;
    shipping_address?: string | null;
    shipping_city?: string | null;
    shipping_postal_code?: string | null;
    shipping_address_line2?: string | null;
    shipping_method_id?: string | null;
    shipping_method_title?: string | null;
    shipping_fee?: number;
  }
): Promise<number> {
  const id = await nextId('orders');
  await OrderModel.create({ id, ...data, order_number: data.order_number || generateOrderNumber() });
  return id;
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

export async function createOrderItems(_conn: unknown, orderId: number, items: OrderItemInput[]): Promise<void> {
  for (const item of items) {
    await OrderItemModel.create({
      id: await nextId('order_items'),
      order_id: orderId,
      product_id: item.product_id,
      product_variation_id: item.product_variation_id ?? null,
      product_name: item.product_name,
      product_type: item.product_type,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      purchase_selections: item.purchase_selections && Object.keys(item.purchase_selections).length > 0 ? item.purchase_selections : {},
      purchase_selections_summary: item.purchase_selections_summary?.length ? item.purchase_selections_summary : [],
    });
  }
}

export async function createPayment(
  _conn: unknown,
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
  const id = await nextId('payments');
  await PaymentModel.create({
    id,
    order_id: data.order_id,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    gateway: data.gateway,
    payment_option_id: data.payment_option_id ?? null,
    gateway_reference: data.gateway_reference ?? null,
    bkash_payment_id: data.bkash_payment_id ?? null,
  });
  return id;
}

export async function findOrderById(id: number): Promise<OrderRow | null> {
  const row = await OrderModel.findOne({ id }).lean();
  return row ? orderRow(row) : null;
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
  const rows = await OrderModel.find({ user_id: userId }).sort({ created_at: -1 }).skip(offset).limit(limit).lean();
  return rows.map((row: any) => ({
    id: Number(row.id),
    order_number: String(row.order_number),
    status: String(row.status),
    total: Number(row.total ?? 0),
    currency: String(row.currency ?? 'BDT'),
    created_at: date(row.created_at),
  }));
}

export async function countOrdersByUserId(userId: number): Promise<number> {
  return OrderModel.countDocuments({ user_id: userId });
}

export async function countOrdersByUserIdAndStatus(userId: number, status: OrderStatus): Promise<number> {
  return OrderModel.countDocuments({ user_id: userId, status });
}

export async function findOrderItems(orderId: number): Promise<OrderItemRow[]> {
  const rows = await OrderItemModel.find({ order_id: orderId }).sort({ id: 1 }).lean();
  return rows.map(orderItemRow);
}

export async function findPaidOrderIdContainingProduct(userId: number, productId: number): Promise<number | null> {
  const orders = await OrderModel.find({ user_id: userId, status: { $in: ['paid', 'processing', 'completed'] } })
    .sort({ created_at: -1 })
    .lean();
  if (orders.length === 0) return null;
  const orderIds = orders.map((order: any) => Number(order.id));
  const item = await OrderItemModel.findOne({ order_id: { $in: orderIds }, product_id: productId }).lean();
  return item ? Number(item.order_id) : null;
}

export async function findPaymentByOrderId(orderId: number): Promise<PaymentRow | null> {
  const row = await PaymentModel.findOne({ order_id: orderId }).sort({ id: -1 }).lean();
  return row ? paymentRow(row) : null;
}

export async function findPaymentByBkashPaymentId(bkashPaymentId: string): Promise<PaymentRow | null> {
  const row = await PaymentModel.findOne({ bkash_payment_id: bkashPaymentId }).sort({ id: -1 }).lean();
  return row ? paymentRow(row) : null;
}

export async function findExpiredPendingBkashOrderIds(olderThan: Date): Promise<number[]> {
  const pendingPayments = await PaymentModel.find({ gateway: 'bkash', status: 'pending' }).select({ order_id: 1 }).lean();
  const orderIds = pendingPayments.map((payment: any) => Number(payment.order_id));
  const orders = await OrderModel.find({
    id: { $in: orderIds },
    status: 'pending',
    created_at: { $lt: olderThan },
  }).select({ id: 1 }).lean();
  return orders.map((order: any) => Number(order.id));
}

export async function updatePaymentBkashSession(
  paymentId: number,
  data: { bkash_payment_id: string; gateway_reference?: string | null }
): Promise<boolean> {
  const result = await PaymentModel.updateOne(
    { id: paymentId },
    { $set: { bkash_payment_id: data.bkash_payment_id, gateway_reference: data.gateway_reference ?? null } }
  );
  return result.modifiedCount > 0;
}

export async function updatePaymentGatewayReference(paymentId: number, gatewayReference: string): Promise<boolean> {
  const result = await PaymentModel.updateOne({ id: paymentId }, { $set: { gateway_reference: gatewayReference } });
  return result.modifiedCount > 0;
}

export async function tryTransitionOrderToPaid(orderId: number): Promise<boolean> {
  const result = await OrderModel.updateOne({ id: orderId, status: 'pending' }, { $set: { status: 'paid' } });
  return result.modifiedCount > 0;
}

export async function updateOrderStatus(orderId: number, status: string): Promise<boolean> {
  const result = await OrderModel.updateOne({ id: orderId }, { $set: { status } });
  return result.modifiedCount > 0;
}

export async function updatePaymentStatus(paymentId: number, status: string): Promise<boolean> {
  const result = await PaymentModel.updateOne({ id: paymentId }, { $set: { status } });
  return result.modifiedCount > 0;
}

export async function deleteOrderById(orderId: number): Promise<void> {
  await PaymentModel.deleteMany({ order_id: orderId });
  await OrderItemModel.deleteMany({ order_id: orderId });
  await OrderModel.deleteOne({ id: orderId });
}
