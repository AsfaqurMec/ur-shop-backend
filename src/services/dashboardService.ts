import { AppError } from '../middlewares/errorHandler';
import * as orderRepo from '../repositories/orderRepository';
import * as deliveryRepo from '../repositories/deliveryRepository';
import * as entitlementRepo from '../repositories/downloadEntitlementRepository';
import * as productRepo from '../repositories/productRepository';
import * as subscriptionRepo from '../repositories/subscriptionRepository';
import * as fulfillmentQueueRepo from '../repositories/fulfillmentQueueRepository';
import * as authRepo from '../repositories/authRepository';
import * as downloadService from './downloadService';
import type {
  DashboardOrderListItem,
  DashboardOrderDetail,
  DashboardOrderDetailItem,
  DashboardOrderPayment,
  DashboardOrderDelivery,
  DashboardLicenseItem,
  DashboardSubscriptionItem,
  DashboardPendingSubscriptionItem,
  DashboardDeliveredItem,
  DashboardSummary,
} from '../types/dashboard';

const ORDERS_LIST_LIMIT = 50;
const ORDERS_LIST_OFFSET = 0;

async function toDashboardOrderItems(
  items: Awaited<ReturnType<typeof orderRepo.findOrderItems>>
): Promise<DashboardOrderDetailItem[]> {
  const productIds = [...new Set(items.map((i) => i.product_id))];
  const paths = await productRepo.findPrimaryImagePathsByProductIds(productIds);
  return items.map((i) => ({
    id: i.id,
    product_id: i.product_id,
    sku: i.sku ?? null,
    product_name: i.product_name,
    product_type: i.product_type,
    product_thumbnail: paths.get(i.product_id) ?? null,
    quantity: i.quantity,
    unit_price: Number(i.unit_price),
    total_price: Number(i.total_price),
    purchase_selections_summary: i.purchase_selections_summary,
  }));
}

/** Get current user's orders list (paginated). */
export async function getMyOrders(
  userId: number,
  options: { limit?: number; offset?: number } = {}
): Promise<{ orders: DashboardOrderListItem[]; total: number }> {
  const limit = Math.min(options.limit ?? ORDERS_LIST_LIMIT, 100);
  const offset = options.offset ?? ORDERS_LIST_OFFSET;
  const [rows, total] = await Promise.all([
    orderRepo.findOrdersByUserId(userId, { limit, offset }),
    orderRepo.countOrdersByUserId(userId),
  ]);
  const orders: DashboardOrderListItem[] = rows.map((r) => ({
    id: r.id,
    order_number: r.order_number,
    status: r.status as DashboardOrderListItem['status'],
    total: Number(r.total),
    currency: r.currency,
    created_at: r.created_at.toISOString(),
  }));
  return { orders, total };
}

/** Get order details; ensure order belongs to user. */
export async function getOrderDetails(
  userId: number,
  orderId: number
): Promise<DashboardOrderDetail> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) throw new AppError(404, 'Order not found');
  if (order.user_id !== userId) throw new AppError(403, 'Forbidden');

  const [items, payment, delivery] = await Promise.all([
    orderRepo.findOrderItems(orderId),
    orderRepo.findPaymentByOrderId(orderId),
    deliveryRepo.findByOrderId(orderId),
  ]);

  const orderItems = await toDashboardOrderItems(items);

  let paymentDto: DashboardOrderPayment | null = null;
  if (payment) {
    paymentDto = {
      id: payment.id,
      gateway: payment.gateway,
      status: payment.status,
      amount: Number(payment.amount),
      currency: payment.currency,
    };
  }

  let deliveryDto: DashboardOrderDelivery | null = null;
  if (delivery) {
    deliveryDto = {
      status: delivery.status,
      delivered_at: delivery.delivered_at ? delivery.delivered_at.toISOString() : null,
    };
  }

  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    payment_status: (order as any).payment_status || (paymentDto?.status === 'completed' || paymentDto?.status === 'paid' ? 'paid' : 'unpaid'),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    coupon_code: order.coupon_code || order.coupon_name || null,
    coupon_name: order.coupon_name || order.coupon_code || null,
    tax: Number(order.tax),
    total: Number(order.total),
    currency: order.currency,
    shipping_name: order.shipping_name || null,
    shipping_mobile: order.shipping_mobile,
    shipping_address: order.shipping_address,
    shipping_city: order.shipping_city,
    shipping_postal_code: order.shipping_postal_code,
    shipping_address_line2: order.shipping_address_line2,
    shipping_method_id: order.shipping_method_id,
    shipping_method_title: order.shipping_method_title,
    shipping_fee: Number(order.shipping_fee ?? 0),
    customer_name: order.shipping_name || null,
    customer_email: null,
    customer_mobile: null,
    customer_address: null,
    items: orderItems,
    payment: paymentDto,
    delivery: deliveryDto,
    created_at: order.created_at.toISOString(),
  };
}

/** Admin: get order details by id (no user check). */
export async function getOrderDetailsAdmin(orderId: number): Promise<DashboardOrderDetail> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) throw new AppError(404, 'Order not found');

  const [items, payment, delivery, customer] = await Promise.all([
    orderRepo.findOrderItems(orderId),
    orderRepo.findPaymentByOrderId(orderId),
    deliveryRepo.findByOrderId(orderId),
    authRepo.findUserById(order.user_id),
  ]);

  const orderItems = await toDashboardOrderItems(items);

  let paymentDto: DashboardOrderPayment | null = null;
  if (payment) {
    paymentDto = {
      id: payment.id,
      gateway: payment.gateway,
      status: payment.status,
      amount: Number(payment.amount),
      currency: payment.currency,
    };
  }

  let deliveryDto: DashboardOrderDelivery | null = null;
  if (delivery) {
    deliveryDto = {
      status: delivery.status,
      delivered_at: delivery.delivered_at ? delivery.delivered_at.toISOString() : null,
    };
  }

  const resolvedCustomerName = order.shipping_name || customer?.name?.trim() || null;

  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    payment_status: (order as any).payment_status || (paymentDto?.status === 'completed' || paymentDto?.status === 'paid' ? 'paid' : 'unpaid'),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    coupon_code: order.coupon_code || order.coupon_name || null,
    coupon_name: order.coupon_name || order.coupon_code || null,
    tax: Number(order.tax),
    total: Number(order.total),
    currency: order.currency,
    shipping_name: order.shipping_name || null,
    shipping_mobile: order.shipping_mobile,
    shipping_address: order.shipping_address,
    shipping_city: order.shipping_city,
    shipping_postal_code: order.shipping_postal_code,
    shipping_address_line2: order.shipping_address_line2,
    shipping_method_id: order.shipping_method_id,
    shipping_method_title: order.shipping_method_title,
    shipping_fee: Number(order.shipping_fee ?? 0),
    customer_name: resolvedCustomerName,
    customer_email: customer?.email ?? null,
    customer_mobile: customer?.mobile ?? null,
    customer_address: customer?.address ?? null,
    items: orderItems,
    payment: paymentDto,
    delivery: deliveryDto,
    created_at: order.created_at.toISOString(),
  };
}

/** Get my downloads (reuse download service list). */
export async function getMyDownloads(userId: number) {
  const items = await downloadService.listDownloadables(userId);
  return { items };
}

/** Get my licenses (assigned keys from orders). */
export async function getMyLicenses(userId: number): Promise<{ items: DashboardLicenseItem[] }> {
  const rows = await productRepo.findAssignedLicensesForUser(userId);
  const items: DashboardLicenseItem[] = rows.map((r) => ({
    id: r.id,
    order_id: r.order_id,
    order_item_id: r.order_item_id,
    product_id: r.product_id,
    product_name: r.product_name,
    license_key: r.license_key,
    assigned_at: r.used_at.toISOString(),
  }));
  return { items };
}

/** Get my subscriptions. */
export async function getMySubscriptions(
  userId: number
): Promise<{ items: DashboardSubscriptionItem[] }> {
  const rows = await subscriptionRepo.findByUserId(userId);
  const items: DashboardSubscriptionItem[] = rows
    .filter((r) => r.status !== 'pending_activation')
    .map((r) => ({
    id: r.id,
    order_id: r.order_id,
    product_id: r.product_id,
    product_name: r.product_name,
    product_slug: r.product_slug,
    product_variation_id: r.product_variation_id,
    status: r.status,
    current_period_start: r.current_period_start.toISOString(),
    current_period_end: r.current_period_end.toISOString(),
    created_at: r.created_at.toISOString(),
  }));
  return { items };
}

/** Get subscriptions that are paid but waiting for manual activation. */
export async function getMyPendingSubscriptions(
  userId: number
): Promise<{ items: DashboardPendingSubscriptionItem[] }> {
  const rows = await fulfillmentQueueRepo.findByUserId(userId);
  const items: DashboardPendingSubscriptionItem[] = rows
    .filter((r) => r.product_type === 'subscription_manual' && r.status === 'pending')
    .map((r) => ({
      queue_id: r.id,
      order_id: r.order_id,
      order_item_id: r.order_item_id,
      product_id: r.product_id,
      product_name: r.product_name,
      product_slug: r.product_slug,
      product_variation_id: r.product_variation_id,
      status: 'pending_activation',
      due_at: r.due_at ? r.due_at.toISOString() : null,
      created_at: r.created_at.toISOString(),
    }));
  return { items };
}

/** Get my delivered items: downloads + licenses + subscriptions + fulfilled fulfillments, merged and sorted. */
export async function getMyDeliveredItems(
  userId: number
): Promise<{ items: DashboardDeliveredItem[] }> {
  const [entitlements, licenses, subscriptions, fulfillments] = await Promise.all([
    entitlementRepo.findEntitlementsForUser(userId),
    productRepo.findAssignedLicensesForUser(userId),
    subscriptionRepo.findByUserId(userId),
    fulfillmentQueueRepo.findByUserId(userId),
  ]);

  const delivered: DashboardDeliveredItem[] = [];

  for (const e of entitlements) {
    delivered.push({
      type: 'download',
      order_id: e.order_id,
      order_number: e.order_number,
      product_id: e.product_id,
      product_name: e.product_name,
      product_type: 'downloadable',
      detail: e.file_name,
      created_at: e.created_at.toISOString(),
    });
  }
  for (const l of licenses) {
    const masked = l.license_key.length > 8
      ? '****-' + l.license_key.slice(-4)
      : '****';
    delivered.push({
      type: 'license',
      order_id: l.order_id,
      order_number: l.order_number,
      product_id: l.product_id,
      product_name: l.product_name,
      product_type: 'license_key',
      detail: masked,
      created_at: l.used_at.toISOString(),
    });
  }
  for (const s of subscriptions) {
    delivered.push({
      type: 'subscription',
      order_id: s.order_id,
      order_number: s.order_number,
      product_id: s.product_id,
      product_name: s.product_name,
      product_type: 'subscription_manual',
      detail: s.current_period_end.toISOString(),
      created_at: s.created_at.toISOString(),
    });
  }
  for (const f of fulfillments) {
    if (f.status !== 'fulfilled') continue;
    delivered.push({
      type: 'fulfillment',
      order_id: f.order_id,
      order_number: f.order_number,
      product_id: f.product_id,
      product_name: f.product_name,
      product_type: f.product_type,
      detail: f.notes,
      created_at: (f.fulfilled_at ?? f.created_at).toISOString(),
    });
  }

  delivered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return { items: delivered };
}

/** Get dashboard summary counts. */
export async function getDashboardSummary(userId: number): Promise<DashboardSummary> {
  const [
    ordersTotal,
    ordersPending,
    ordersPaid,
    entitlements,
    licenses,
    subscriptionsCount,
    fulfilledCount,
  ] = await Promise.all([
    orderRepo.countOrdersByUserId(userId),
    orderRepo.countOrdersByUserIdAndStatus(userId, 'pending'),
    orderRepo.countOrdersByUserIdAndStatus(userId, 'paid'),
    entitlementRepo.findEntitlementsForUser(userId),
    productRepo.findAssignedLicensesForUser(userId),
    subscriptionRepo.countByUserId(userId),
    fulfillmentQueueRepo.findByUserId(userId).then((r) => r.filter((f) => f.status === 'fulfilled').length),
  ]);

  const delivered_count =
    entitlements.length + licenses.length + subscriptionsCount + fulfilledCount;

  return {
    orders_total: ordersTotal,
    orders_pending: ordersPending,
    orders_paid: ordersPaid,
    downloads_count: entitlements.length,
    licenses_count: licenses.length,
    subscriptions_count: subscriptionsCount,
    delivered_count,
  };
}
