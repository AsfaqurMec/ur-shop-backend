"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findByOrderItemId = findByOrderItemId;
exports.findByUserId = findByUserId;
exports.countByUserId = countByUserId;
exports.existsByOrderItemIdWithConnection = existsByOrderItemIdWithConnection;
exports.createWithConnection = createWithConnection;
exports.updateStatusByOrderItemIdWithConnection = updateStatusByOrderItemIdWithConnection;
exports.findActiveNeedingExpiryReminderUtc = findActiveNeedingExpiryReminderUtc;
exports.markExpiryReminderSent = markExpiryReminderSent;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
async function findByOrderItemId(orderItemId) {
    const row = await models_1.SubscriptionModel.findOne({ order_item_id: orderItemId }).lean();
    return row ? { current_period_end: date(row.current_period_end) } : null;
}
async function findByUserId(userId) {
    const subs = await models_1.SubscriptionModel.find({ user_id: userId }).sort({ current_period_end: 1, created_at: -1 }).lean();
    const orderIds = subs.map((s) => Number(s.order_id));
    const itemIds = subs.map((s) => Number(s.order_item_id));
    const productIds = subs.map((s) => Number(s.product_id));
    const [orders, items, products] = await Promise.all([
        models_1.OrderModel.find({ id: { $in: orderIds } }).lean(),
        models_1.OrderItemModel.find({ id: { $in: itemIds } }).lean(),
        models_1.ProductModel.find({ id: { $in: productIds }, deleted_at: null }).lean(),
    ]);
    const orderById = new Map(orders.map((o) => [Number(o.id), o]));
    const itemById = new Map(items.map((i) => [Number(i.id), i]));
    const productById = new Map(products.map((p) => [Number(p.id), p]));
    return subs.flatMap((sub) => {
        const order = orderById.get(Number(sub.order_id));
        const item = itemById.get(Number(sub.order_item_id));
        const product = productById.get(Number(sub.product_id));
        if (!order || !item || !product)
            return [];
        return [{
                id: Number(sub.id),
                order_id: Number(sub.order_id),
                order_number: String(order.order_number),
                order_item_id: Number(sub.order_item_id),
                product_id: Number(sub.product_id),
                product_name: String(item.product_name),
                product_slug: String(product.slug),
                product_variation_id: item.product_variation_id ?? null,
                status: sub.status,
                current_period_start: date(sub.current_period_start),
                current_period_end: date(sub.current_period_end),
                created_at: date(sub.created_at),
            }];
    });
}
async function countByUserId(userId) {
    return models_1.SubscriptionModel.countDocuments({ user_id: userId });
}
async function existsByOrderItemIdWithConnection(_conn, orderItemId) {
    return Boolean(await models_1.SubscriptionModel.exists({ order_item_id: orderItemId }));
}
async function createWithConnection(_conn, data) {
    const id = await (0, counter_1.nextId)('subscriptions');
    await models_1.SubscriptionModel.create({
        id,
        ...data,
        status: data.status ?? 'active',
        expiry_reminder_sent_at: null,
    });
    return id;
}
async function updateStatusByOrderItemIdWithConnection(_conn, orderItemId, status) {
    const result = await models_1.SubscriptionModel.updateOne({ order_item_id: orderItemId }, { $set: { status } });
    return result.modifiedCount > 0;
}
async function findActiveNeedingExpiryReminderUtc() {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2, 0, 0, 0, 0));
    const subs = await models_1.SubscriptionModel.find({
        status: 'active',
        expiry_reminder_sent_at: null,
        current_period_end: { $gte: start, $lt: end },
    }).lean();
    const [users, products, items] = await Promise.all([
        models_1.UserModel.find({ id: { $in: subs.map((s) => Number(s.user_id)) } }).lean(),
        models_1.ProductModel.find({ id: { $in: subs.map((s) => Number(s.product_id)) }, deleted_at: null }).lean(),
        models_1.OrderItemModel.find({ id: { $in: subs.map((s) => Number(s.order_item_id)) } }).lean(),
    ]);
    const userById = new Map(users.map((u) => [Number(u.id), u]));
    const productById = new Map(products.map((p) => [Number(p.id), p]));
    const itemById = new Map(items.map((i) => [Number(i.id), i]));
    return subs.flatMap((sub) => {
        const user = userById.get(Number(sub.user_id));
        const product = productById.get(Number(sub.product_id));
        const item = itemById.get(Number(sub.order_item_id));
        if (!user || !product || !item)
            return [];
        return [{
                id: Number(sub.id),
                user_id: Number(sub.user_id),
                user_email: String(user.email),
                product_id: Number(sub.product_id),
                product_slug: String(product.slug),
                product_name: String(item.product_name),
                product_variation_id: item.product_variation_id ?? null,
                current_period_end: date(sub.current_period_end),
            }];
    });
}
async function markExpiryReminderSent(subscriptionId) {
    const result = await models_1.SubscriptionModel.updateOne({ id: subscriptionId, expiry_reminder_sent_at: null }, { $set: { expiry_reminder_sent_at: new Date() } });
    return result.modifiedCount > 0;
}
//# sourceMappingURL=subscriptionRepository.js.map