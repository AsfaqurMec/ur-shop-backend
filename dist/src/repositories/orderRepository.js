"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.createOrderItems = createOrderItems;
exports.createPayment = createPayment;
exports.findOrderById = findOrderById;
exports.findOrdersByUserId = findOrdersByUserId;
exports.countOrdersByUserId = countOrdersByUserId;
exports.countOrdersByUserIdAndStatus = countOrdersByUserIdAndStatus;
exports.findOrderItems = findOrderItems;
exports.findPaidOrderIdContainingProduct = findPaidOrderIdContainingProduct;
exports.findPaymentByOrderId = findPaymentByOrderId;
exports.findPaymentByBkashPaymentId = findPaymentByBkashPaymentId;
exports.findExpiredPendingBkashOrderIds = findExpiredPendingBkashOrderIds;
exports.updatePaymentBkashSession = updatePaymentBkashSession;
exports.updatePaymentGatewayReference = updatePaymentGatewayReference;
exports.tryTransitionOrderToPaid = tryTransitionOrderToPaid;
exports.updateOrderStatus = updateOrderStatus;
exports.updatePaymentStatus = updatePaymentStatus;
exports.deleteOrderById = deleteOrderById;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function parseOrderItemSelectionsSummary(raw) {
    if (raw == null)
        return null;
    if (Array.isArray(raw)) {
        const out = raw.flatMap((el) => {
            if (!el || typeof el !== 'object' || Array.isArray(el))
                return [];
            const o = el;
            const label = o.label != null ? String(o.label) : '';
            const value = o.value != null ? String(o.value) : '';
            return label.trim() || value.trim() ? [{ label, value }] : [];
        });
        return out.length ? out : null;
    }
    if (typeof raw === 'string') {
        try {
            return parseOrderItemSelectionsSummary(JSON.parse(raw));
        }
        catch {
            return null;
        }
    }
    return null;
}
function parseOrderItemSelections(raw) {
    if (raw == null)
        return null;
    if (typeof raw === 'object' && !Array.isArray(raw)) {
        const out = {};
        for (const [k, v] of Object.entries(raw)) {
            if (v == null)
                continue;
            const s = typeof v === 'string' ? v.trim() : String(v).trim();
            if (s)
                out[k] = s;
        }
        return Object.keys(out).length ? out : null;
    }
    if (typeof raw === 'string') {
        try {
            return parseOrderItemSelections(JSON.parse(raw));
        }
        catch {
            return null;
        }
    }
    return null;
}
function generateOrderNumber() {
    const time = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ORD-${time}-${random}`;
}
function orderRow(doc) {
    return {
        id: Number(doc.id),
        user_id: Number(doc.user_id),
        order_number: String(doc.order_number),
        status: doc.status,
        subtotal: Number(doc.subtotal ?? 0),
        discount: Number(doc.discount ?? 0),
        tax: Number(doc.tax ?? 0),
        total: Number(doc.total ?? 0),
        currency: String(doc.currency ?? 'BDT'),
        created_at: date(doc.created_at),
        updated_at: date(doc.updated_at),
    };
}
function orderItemRow(doc) {
    return {
        id: Number(doc.id),
        order_id: Number(doc.order_id),
        product_id: Number(doc.product_id),
        product_variation_id: doc.product_variation_id ?? null,
        product_name: String(doc.product_name),
        product_type: doc.product_type,
        quantity: Number(doc.quantity ?? 1),
        unit_price: Number(doc.unit_price ?? 0),
        total_price: Number(doc.total_price ?? 0),
        purchase_selections: parseOrderItemSelections(doc.purchase_selections),
        purchase_selections_summary: parseOrderItemSelectionsSummary(doc.purchase_selections_summary),
        created_at: date(doc.created_at),
    };
}
function paymentRow(doc) {
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
async function createOrder(_conn, data) {
    const id = await (0, counter_1.nextId)('orders');
    await models_1.OrderModel.create({ id, ...data, order_number: data.order_number || generateOrderNumber() });
    return id;
}
async function createOrderItems(_conn, orderId, items) {
    for (const item of items) {
        await models_1.OrderItemModel.create({
            id: await (0, counter_1.nextId)('order_items'),
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
async function createPayment(_conn, data) {
    const id = await (0, counter_1.nextId)('payments');
    await models_1.PaymentModel.create({
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
async function findOrderById(id) {
    const row = await models_1.OrderModel.findOne({ id }).lean();
    return row ? orderRow(row) : null;
}
async function findOrdersByUserId(userId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    const rows = await models_1.OrderModel.find({ user_id: userId }).sort({ created_at: -1 }).skip(offset).limit(limit).lean();
    return rows.map((row) => ({
        id: Number(row.id),
        order_number: String(row.order_number),
        status: String(row.status),
        total: Number(row.total ?? 0),
        currency: String(row.currency ?? 'BDT'),
        created_at: date(row.created_at),
    }));
}
async function countOrdersByUserId(userId) {
    return models_1.OrderModel.countDocuments({ user_id: userId });
}
async function countOrdersByUserIdAndStatus(userId, status) {
    return models_1.OrderModel.countDocuments({ user_id: userId, status });
}
async function findOrderItems(orderId) {
    const rows = await models_1.OrderItemModel.find({ order_id: orderId }).sort({ id: 1 }).lean();
    return rows.map(orderItemRow);
}
async function findPaidOrderIdContainingProduct(userId, productId) {
    const orders = await models_1.OrderModel.find({ user_id: userId, status: { $in: ['paid', 'processing', 'completed'] } })
        .sort({ created_at: -1 })
        .lean();
    if (orders.length === 0)
        return null;
    const orderIds = orders.map((order) => Number(order.id));
    const item = await models_1.OrderItemModel.findOne({ order_id: { $in: orderIds }, product_id: productId }).lean();
    return item ? Number(item.order_id) : null;
}
async function findPaymentByOrderId(orderId) {
    const row = await models_1.PaymentModel.findOne({ order_id: orderId }).sort({ id: -1 }).lean();
    return row ? paymentRow(row) : null;
}
async function findPaymentByBkashPaymentId(bkashPaymentId) {
    const row = await models_1.PaymentModel.findOne({ bkash_payment_id: bkashPaymentId }).sort({ id: -1 }).lean();
    return row ? paymentRow(row) : null;
}
async function findExpiredPendingBkashOrderIds(olderThan) {
    const pendingPayments = await models_1.PaymentModel.find({ gateway: 'bkash', status: 'pending' }).select({ order_id: 1 }).lean();
    const orderIds = pendingPayments.map((payment) => Number(payment.order_id));
    const orders = await models_1.OrderModel.find({
        id: { $in: orderIds },
        status: 'pending',
        created_at: { $lt: olderThan },
    }).select({ id: 1 }).lean();
    return orders.map((order) => Number(order.id));
}
async function updatePaymentBkashSession(paymentId, data) {
    const result = await models_1.PaymentModel.updateOne({ id: paymentId }, { $set: { bkash_payment_id: data.bkash_payment_id, gateway_reference: data.gateway_reference ?? null } });
    return result.modifiedCount > 0;
}
async function updatePaymentGatewayReference(paymentId, gatewayReference) {
    const result = await models_1.PaymentModel.updateOne({ id: paymentId }, { $set: { gateway_reference: gatewayReference } });
    return result.modifiedCount > 0;
}
async function tryTransitionOrderToPaid(orderId) {
    const result = await models_1.OrderModel.updateOne({ id: orderId, status: 'pending' }, { $set: { status: 'paid' } });
    return result.modifiedCount > 0;
}
async function updateOrderStatus(orderId, status) {
    const result = await models_1.OrderModel.updateOne({ id: orderId }, { $set: { status } });
    return result.modifiedCount > 0;
}
async function updatePaymentStatus(paymentId, status) {
    const result = await models_1.PaymentModel.updateOne({ id: paymentId }, { $set: { status } });
    return result.modifiedCount > 0;
}
async function deleteOrderById(orderId) {
    await models_1.PaymentModel.deleteMany({ order_id: orderId });
    await models_1.OrderItemModel.deleteMany({ order_id: orderId });
    await models_1.OrderModel.deleteOne({ id: orderId });
}
//# sourceMappingURL=orderRepository.js.map