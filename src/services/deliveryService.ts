import { AppError } from '../middlewares/errorHandler';
import * as orderRepo from '../repositories/orderRepository';
import * as productRepo from '../repositories/productRepository';
import * as productService from './productService';
import * as deliveryRepo from '../repositories/deliveryRepository';
import * as downloadEntitlementRepo from '../repositories/downloadEntitlementRepository';
import * as fulfillmentQueueRepo from '../repositories/fulfillmentQueueRepository';
import * as deliveryLogRepo from '../repositories/deliveryLogRepository';
import * as subscriptionRepo from '../repositories/subscriptionRepository';
import * as authRepo from '../repositories/authRepository';
import * as emailService from './emailService';
import { env } from '../config';
import { orderItemEmailParts } from '../utils/orderItemDisplay';
import { subscriptionPeriodDaysFromOrderItem } from '../utils/subscriptionPeriod';
import type { OrderItemRow, OrderItemProductType } from '../types/order';
import type { FulfillmentQueuePublic, FulfillmentQueueRow } from '../types/delivery';
import type { DeliveryStatus } from '../repositories/deliveryRepository';

/** Per line item: instant fulfillment done, needs manual queue, or cannot complete automatically yet. */
type ItemFulfillmentOutcome = 'auto_fulfilled' | 'queued' | 'pending_setup';

function addDaysUtc(start: Date, days: number): Date {
  const d = new Date(start.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addHoursUtc(start: Date, hours: number): Date {
  const d = new Date(start.getTime());
  d.setUTCHours(d.getUTCHours() + hours);
  return d;
}

/**
 * Process digital delivery for a paid order. Call after payment is approved.
 * Uses a transaction to:
 * - downloadable: create download_entitlements for each product_file
 * - license_key: assign available keys from pool to order_item
 * - subscription_manual / digital_service: create fulfillment_queue entry
 * - write delivery_logs for each action
 */
export async function processOrderDelivery(orderId: number): Promise<{
  processed: number;
  delivery_status: string;
}> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) throw new AppError(404, 'Order not found');
  if (order.status !== 'paid') {
    throw new AppError(400, 'Order must be paid before delivery processing');
  }

  const items = await orderRepo.findOrderItems(orderId);
  if (items.length === 0) return { processed: 0, delivery_status: 'processing' };

  const outcomes: ItemFulfillmentOutcome[] = [];
  const licenseProductsToSync = new Set<number>();
  for (const item of items as (OrderItemRow & { quantity: number })[]) {
    if (item.product_type === 'license_key') {
      licenseProductsToSync.add(item.product_id);
    }
    outcomes.push(await processOrderItem(orderId, order.user_id, item));
  }

  const needsFurtherProcessing = outcomes.some((o) => o === 'queued' || o === 'pending_setup');
  const finalStatus: DeliveryStatus = needsFurtherProcessing ? 'processing' : 'delivered';
  await deliveryRepo.updateStatusWithConnection(null, orderId, finalStatus);
  for (const pid of licenseProductsToSync) {
    await productService.syncLicenseVariationQuantitiesForProduct(pid);
  }

  const delivery = await deliveryRepo.findByOrderId(orderId);
  return {
    processed: items.length,
    delivery_status: delivery?.status ?? 'processing',
  };
}

/** Process a single order item by product_type. Reusable from processOrderDelivery. */
async function processOrderItem(
  orderId: number,
  userId: number,
  item: OrderItemRow & { quantity: number }
): Promise<ItemFulfillmentOutcome> {
  const productType = item.product_type as OrderItemProductType;

  switch (productType) {
    case 'downloadable': {
      const files = await productRepo.findProductFilesByProductId(item.product_id);
      const fileIds = files.map((f) => f.id);
      if (fileIds.length > 0) {
        await downloadEntitlementRepo.createMany(null, item.id, fileIds);
        await deliveryLogRepo.create(null, {
          order_id: orderId,
          order_item_id: item.id,
          action: 'entitlement_created',
          details: { product_file_ids: fileIds, count: fileIds.length },
        });
        return 'auto_fulfilled';
      }
      return 'pending_setup';
    }
    case 'license_key': {
      const assigned = await productRepo.assignLicenseKeysToOrderItem(
        null,
        item.product_id,
        item.id,
        item.quantity,
        item.product_variation_id
      );
      await deliveryLogRepo.create(null, {
        order_id: orderId,
        order_item_id: item.id,
        action: 'license_assigned',
        details: { requested: item.quantity, assigned },
      });
      if (assigned < item.quantity) {
        throw new AppError(400, `Insufficient license keys for product (order item ${item.id}): requested ${item.quantity}, available ${assigned}`);
      }
      return 'auto_fulfilled';
    }
    case 'subscription_manual':
    case 'digital_service': {
      const product = await productRepo.findProductById(item.product_id);
      const requiresManual = product ? Boolean(product.manual_fulfillment_required) : true;
      if (productType === 'subscription_manual' && !requiresManual) {
        const exists = await subscriptionRepo.existsByOrderItemIdWithConnection(null, item.id);
        if (!exists) {
          const periodStart = new Date();
          const periodDays = subscriptionPeriodDaysFromOrderItem(item);
          const periodEnd = addDaysUtc(periodStart, periodDays);
          await subscriptionRepo.createWithConnection(null, {
            order_id: orderId,
            order_item_id: item.id,
            user_id: userId,
            product_id: item.product_id,
            status: 'active',
            current_period_start: periodStart,
            current_period_end: periodEnd,
          });
        }
        await deliveryLogRepo.create(null, {
          order_id: orderId,
          order_item_id: item.id,
          action: 'subscription_activated_auto',
          details: { product_type: productType },
        });
        return 'auto_fulfilled';
      }
      if (productType === 'subscription_manual' && requiresManual) {
        const exists = await subscriptionRepo.existsByOrderItemIdWithConnection(null, item.id);
        if (!exists) {
          const periodStart = new Date();
          const periodDays = subscriptionPeriodDaysFromOrderItem(item);
          const periodEnd = addDaysUtc(periodStart, periodDays);
          await subscriptionRepo.createWithConnection(null, {
            order_id: orderId,
            order_item_id: item.id,
            user_id: userId,
            product_id: item.product_id,
            status: 'pending_activation',
            current_period_start: periodStart,
            current_period_end: periodEnd,
          });
        }
      }
      await fulfillmentQueueRepo.create(null, {
        order_id: orderId,
        order_item_id: item.id,
        product_id: item.product_id,
        product_type: productType,
        user_id: userId,
        due_at: addHoursUtc(new Date(), 24),
      });
      await deliveryLogRepo.create(null, {
        order_id: orderId,
        order_item_id: item.id,
        action: 'fulfillment_queued',
        details: { product_type: productType },
      });
      return 'queued';
    }
    default:
      return 'pending_setup';
  }
}

export async function getDeliveryLogs(orderId: number): Promise<{ id: number; order_item_id: number | null; action: string; details: unknown; created_at: string }[]> {
  const rows = await deliveryLogRepo.findByOrderId(orderId);
  return rows.map((r) => ({
    id: r.id,
    order_item_id: r.order_item_id,
    action: r.action,
    details: r.details,
    created_at: r.created_at.toISOString(),
  }));
}

export async function listFulfillmentQueue(): Promise<FulfillmentQueuePublic[]> {
  const rows = await fulfillmentQueueRepo.findPending();
  return rows.map(toFulfillmentPublic);
}

export async function markFulfillmentFulfilled(
  id: number,
  adminId: number,
  notes?: string | null
): Promise<FulfillmentQueuePublic> {
  let queueSnapshot: {
    order_id: number;
    order_item_id: number;
    user_id: number;
    product_type: string;
  } | null = null;

  const row = await fulfillmentQueueRepo.findByIdForUpdate(null, id);
  if (!row) {
    throw new AppError(404, 'Fulfillment queue item not found');
  }
  if (row.status !== 'pending') {
    throw new AppError(400, 'Item is not pending');
  }

  if (row.product_type === 'subscription_manual') {
    const exists = await subscriptionRepo.existsByOrderItemIdWithConnection(null, row.order_item_id);
    if (exists) {
      await subscriptionRepo.updateStatusByOrderItemIdWithConnection(null, row.order_item_id, 'active');
    } else {
      const periodStart = new Date();
      const orderItems = await orderRepo.findOrderItems(row.order_id);
      const orderItem = orderItems.find((i) => i.id === row.order_item_id);
      const periodDays = subscriptionPeriodDaysFromOrderItem(
        orderItem ?? { purchase_selections_summary: null }
      );
      const periodEnd = addDaysUtc(periodStart, periodDays);
      await subscriptionRepo.createWithConnection(null, {
        order_id: row.order_id,
        order_item_id: row.order_item_id,
        user_id: row.user_id,
        product_id: row.product_id,
        status: 'active',
        current_period_start: periodStart,
        current_period_end: periodEnd,
      });
    }
  }

  const marked = await fulfillmentQueueRepo.markFulfilledWithConnection(null, id, notes, adminId);
  if (!marked) {
    throw new AppError(400, 'Item is not pending');
  }

  queueSnapshot = {
    order_id: row.order_id,
    order_item_id: row.order_item_id,
    user_id: row.user_id,
    product_type: row.product_type,
  };

  if (queueSnapshot) {
    const stillPending = await fulfillmentQueueRepo.countPendingByOrderId(queueSnapshot.order_id);
    if (stillPending === 0) {
      await deliveryRepo.updateStatus(queueSnapshot.order_id, 'delivered');
    }
  }

  const updated = await fulfillmentQueueRepo.findById(id);
  if (!updated) throw new AppError(500, 'Fulfillment queue item not found after update');

  if (queueSnapshot?.product_type === 'subscription_manual') {
    void notifySubscriptionActivated(queueSnapshot).catch(() => undefined);
  }

  return toFulfillmentPublic(updated);
}

async function notifySubscriptionActivated(row: {
  order_id: number;
  order_item_id: number;
  user_id: number;
}): Promise<void> {
  const [order, user, sub] = await Promise.all([
    orderRepo.findOrderById(row.order_id),
    authRepo.findUserById(row.user_id),
    subscriptionRepo.findByOrderItemId(row.order_item_id),
  ]);
  if (!order || !user || !sub) return;

  const items = await orderRepo.findOrderItems(row.order_id);
  const line = items.find((i) => i.id === row.order_item_id);
  const parts =
    line != null
      ? orderItemEmailParts(line.product_name, line.purchase_selections_summary)
      : { product_name: 'Subscription', detail_lines: [] };

  const base = env.frontendUrl.replace(/\/$/, '');
  const dashboardUrl = base ? `${base}/dashboard/subscriptions` : undefined;

  await emailService.sendSubscriptionActivatedEmail(user.email, {
    orderNumber: order.order_number,
    productName: parts.product_name,
    ...(parts.detail_lines.length > 0 ? { productDetailLines: parts.detail_lines } : {}),
    periodEnd: sub.current_period_end.toISOString(),
    dashboardUrl,
  });
}

export async function markFulfillmentFailed(id: number, notes?: string | null): Promise<FulfillmentQueuePublic> {
  const row = await fulfillmentQueueRepo.findById(id);
  if (!row) throw new AppError(404, 'Fulfillment queue item not found');
  if (row.status !== 'pending') throw new AppError(400, 'Item is not pending');
  await fulfillmentQueueRepo.markFailed(id, notes);
  const updated = await fulfillmentQueueRepo.findById(id);
  return toFulfillmentPublic(updated!);
}

function toFulfillmentPublic(row: FulfillmentQueueRow): FulfillmentQueuePublic {
  const now = Date.now();
  const dueAtMs = row.due_at ? row.due_at.getTime() : null;
  return {
    id: row.id,
    order_id: row.order_id,
    order_item_id: row.order_item_id,
    product_id: row.product_id,
    product_type: row.product_type,
    user_id: row.user_id,
    status: row.status,
    notes: row.notes,
    due_at: row.due_at ? row.due_at.toISOString() : null,
    fulfilled_at: row.fulfilled_at ? row.fulfilled_at.toISOString() : null,
    fulfilled_by_admin_id: row.fulfilled_by_admin_id,
    is_sla_breached: row.status === 'pending' && dueAtMs != null ? dueAtMs < now : false,
    created_at: row.created_at.toISOString(),
  };
}
