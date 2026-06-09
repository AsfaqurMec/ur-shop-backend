"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.findPending = findPending;
exports.countPendingByOrderId = countPendingByOrderId;
exports.findByUserId = findByUserId;
exports.findById = findById;
exports.findByIdForUpdate = findByIdForUpdate;
exports.markFulfilledWithConnection = markFulfilledWithConnection;
exports.markFulfilled = markFulfilled;
exports.markFailed = markFailed;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function row(doc) {
    return {
        id: Number(doc.id),
        order_id: Number(doc.order_id),
        order_item_id: Number(doc.order_item_id),
        product_id: Number(doc.product_id),
        product_type: doc.product_type,
        user_id: Number(doc.user_id),
        status: (doc.status ?? 'pending'),
        notes: doc.notes ?? null,
        due_at: doc.due_at ? date(doc.due_at) : null,
        fulfilled_at: doc.fulfilled_at ? date(doc.fulfilled_at) : null,
        fulfilled_by_admin_id: doc.fulfilled_by_admin_id ?? null,
        created_at: date(doc.created_at),
        updated_at: date(doc.updated_at),
    };
}
async function create(_conn, data) {
    const id = await (0, counter_1.nextId)('fulfillment_queue');
    await models_1.FulfillmentQueueModel.create({
        id,
        ...data,
        due_at: data.due_at ?? null,
        status: 'pending',
        notes: null,
        fulfilled_at: null,
        fulfilled_by_admin_id: null,
    });
    return id;
}
async function findPending() {
    const rows = await models_1.FulfillmentQueueModel.find({ status: 'pending' }).sort({ created_at: 1, id: 1 }).lean();
    return rows.map(row);
}
async function countPendingByOrderId(orderId) {
    return models_1.FulfillmentQueueModel.countDocuments({ order_id: orderId, status: 'pending' });
}
async function findByUserId(userId) {
    const rows = await models_1.FulfillmentQueueModel.find({ user_id: userId }).sort({ created_at: -1 }).lean();
    const orderIds = rows.map((r) => Number(r.order_id));
    const itemIds = rows.map((r) => Number(r.order_item_id));
    const productIds = rows.map((r) => Number(r.product_id));
    const [orders, items, products] = await Promise.all([
        models_1.OrderModel.find({ id: { $in: orderIds } }).lean(),
        models_1.OrderItemModel.find({ id: { $in: itemIds } }).lean(),
        models_1.ProductModel.find({ id: { $in: productIds } }).lean(),
    ]);
    const orderById = new Map(orders.map((o) => [Number(o.id), o]));
    const itemById = new Map(items.map((i) => [Number(i.id), i]));
    const productById = new Map(products.map((p) => [Number(p.id), p]));
    return rows.flatMap((r) => {
        const order = orderById.get(Number(r.order_id));
        const item = itemById.get(Number(r.order_item_id));
        const product = productById.get(Number(r.product_id));
        if (!order || !item || !product)
            return [];
        return [{
                id: Number(r.id),
                order_id: Number(r.order_id),
                order_number: String(order.order_number),
                order_item_id: Number(r.order_item_id),
                product_id: Number(r.product_id),
                product_name: String(item.product_name),
                product_slug: String(product.slug),
                product_variation_id: item.product_variation_id ?? null,
                product_type: String(r.product_type),
                status: String(r.status),
                notes: r.notes ?? null,
                due_at: r.due_at ? date(r.due_at) : null,
                fulfilled_at: r.fulfilled_at ? date(r.fulfilled_at) : null,
                fulfilled_by_admin_id: r.fulfilled_by_admin_id ?? null,
                created_at: date(r.created_at),
            }];
    });
}
async function findById(id) {
    const doc = await models_1.FulfillmentQueueModel.findOne({ id }).lean();
    return doc ? row(doc) : null;
}
async function findByIdForUpdate(_conn, id) {
    return findById(id);
}
async function markFulfilledWithConnection(_conn, id, notes, fulfilledByAdminId) {
    const patch = { status: 'fulfilled', fulfilled_at: new Date() };
    if (notes != null)
        patch.notes = notes;
    if (fulfilledByAdminId != null)
        patch.fulfilled_by_admin_id = fulfilledByAdminId;
    const result = await models_1.FulfillmentQueueModel.updateOne({ id, status: 'pending' }, { $set: patch });
    return result.modifiedCount > 0;
}
async function markFulfilled(id, notes) {
    return markFulfilledWithConnection(null, id, notes);
}
async function markFailed(id, notes) {
    const patch = { status: 'failed' };
    if (notes != null)
        patch.notes = notes;
    const result = await models_1.FulfillmentQueueModel.updateOne({ id }, { $set: patch });
    return result.modifiedCount > 0;
}
//# sourceMappingURL=fulfillmentQueueRepository.js.map