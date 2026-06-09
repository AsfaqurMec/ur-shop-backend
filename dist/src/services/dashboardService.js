"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyOrders = getMyOrders;
exports.getOrderDetails = getOrderDetails;
exports.getOrderDetailsAdmin = getOrderDetailsAdmin;
exports.getMyDownloads = getMyDownloads;
exports.getMyLicenses = getMyLicenses;
exports.getMySubscriptions = getMySubscriptions;
exports.getMyPendingSubscriptions = getMyPendingSubscriptions;
exports.getMyDeliveredItems = getMyDeliveredItems;
exports.getDashboardSummary = getDashboardSummary;
const errorHandler_1 = require("../middlewares/errorHandler");
const orderRepo = __importStar(require("../repositories/orderRepository"));
const deliveryRepo = __importStar(require("../repositories/deliveryRepository"));
const entitlementRepo = __importStar(require("../repositories/downloadEntitlementRepository"));
const productRepo = __importStar(require("../repositories/productRepository"));
const subscriptionRepo = __importStar(require("../repositories/subscriptionRepository"));
const fulfillmentQueueRepo = __importStar(require("../repositories/fulfillmentQueueRepository"));
const downloadService = __importStar(require("./downloadService"));
const ORDERS_LIST_LIMIT = 50;
const ORDERS_LIST_OFFSET = 0;
async function toDashboardOrderItems(items) {
    const productIds = [...new Set(items.map((i) => i.product_id))];
    const paths = await productRepo.findPrimaryImagePathsByProductIds(productIds);
    return items.map((i) => ({
        id: i.id,
        product_id: i.product_id,
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
async function getMyOrders(userId, options = {}) {
    const limit = Math.min(options.limit ?? ORDERS_LIST_LIMIT, 100);
    const offset = options.offset ?? ORDERS_LIST_OFFSET;
    const [rows, total] = await Promise.all([
        orderRepo.findOrdersByUserId(userId, { limit, offset }),
        orderRepo.countOrdersByUserId(userId),
    ]);
    const orders = rows.map((r) => ({
        id: r.id,
        order_number: r.order_number,
        status: r.status,
        total: Number(r.total),
        currency: r.currency,
        created_at: r.created_at.toISOString(),
    }));
    return { orders, total };
}
/** Get order details; ensure order belongs to user. */
async function getOrderDetails(userId, orderId) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order)
        throw new errorHandler_1.AppError(404, 'Order not found');
    if (order.user_id !== userId)
        throw new errorHandler_1.AppError(403, 'Forbidden');
    const [items, payment, delivery] = await Promise.all([
        orderRepo.findOrderItems(orderId),
        orderRepo.findPaymentByOrderId(orderId),
        deliveryRepo.findByOrderId(orderId),
    ]);
    const orderItems = await toDashboardOrderItems(items);
    let paymentDto = null;
    if (payment) {
        paymentDto = {
            id: payment.id,
            gateway: payment.gateway,
            status: payment.status,
            amount: Number(payment.amount),
            currency: payment.currency,
        };
    }
    let deliveryDto = null;
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
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        tax: Number(order.tax),
        total: Number(order.total),
        currency: order.currency,
        items: orderItems,
        payment: paymentDto,
        delivery: deliveryDto,
        created_at: order.created_at.toISOString(),
    };
}
/** Admin: get order details by id (no user check). */
async function getOrderDetailsAdmin(orderId) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order)
        throw new errorHandler_1.AppError(404, 'Order not found');
    const [items, payment, delivery] = await Promise.all([
        orderRepo.findOrderItems(orderId),
        orderRepo.findPaymentByOrderId(orderId),
        deliveryRepo.findByOrderId(orderId),
    ]);
    const orderItems = await toDashboardOrderItems(items);
    let paymentDto = null;
    if (payment) {
        paymentDto = {
            id: payment.id,
            gateway: payment.gateway,
            status: payment.status,
            amount: Number(payment.amount),
            currency: payment.currency,
        };
    }
    let deliveryDto = null;
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
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        tax: Number(order.tax),
        total: Number(order.total),
        currency: order.currency,
        items: orderItems,
        payment: paymentDto,
        delivery: deliveryDto,
        created_at: order.created_at.toISOString(),
    };
}
/** Get my downloads (reuse download service list). */
async function getMyDownloads(userId) {
    const items = await downloadService.listDownloadables(userId);
    return { items };
}
/** Get my licenses (assigned keys from orders). */
async function getMyLicenses(userId) {
    const rows = await productRepo.findAssignedLicensesForUser(userId);
    const items = rows.map((r) => ({
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
async function getMySubscriptions(userId) {
    const rows = await subscriptionRepo.findByUserId(userId);
    const items = rows
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
async function getMyPendingSubscriptions(userId) {
    const rows = await fulfillmentQueueRepo.findByUserId(userId);
    const items = rows
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
async function getMyDeliveredItems(userId) {
    const [entitlements, licenses, subscriptions, fulfillments] = await Promise.all([
        entitlementRepo.findEntitlementsForUser(userId),
        productRepo.findAssignedLicensesForUser(userId),
        subscriptionRepo.findByUserId(userId),
        fulfillmentQueueRepo.findByUserId(userId),
    ]);
    const delivered = [];
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
        if (f.status !== 'fulfilled')
            continue;
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
async function getDashboardSummary(userId) {
    const [ordersTotal, ordersPending, ordersPaid, entitlements, licenses, subscriptionsCount, fulfilledCount,] = await Promise.all([
        orderRepo.countOrdersByUserId(userId),
        orderRepo.countOrdersByUserIdAndStatus(userId, 'pending'),
        orderRepo.countOrdersByUserIdAndStatus(userId, 'paid'),
        entitlementRepo.findEntitlementsForUser(userId),
        productRepo.findAssignedLicensesForUser(userId),
        subscriptionRepo.countByUserId(userId),
        fulfillmentQueueRepo.findByUserId(userId).then((r) => r.filter((f) => f.status === 'fulfilled').length),
    ]);
    const delivered_count = entitlements.length + licenses.length + subscriptionsCount + fulfilledCount;
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
//# sourceMappingURL=dashboardService.js.map