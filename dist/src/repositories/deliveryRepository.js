"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findByOrderId = findByOrderId;
exports.create = create;
exports.updateStatus = updateStatus;
exports.createOrUpdateToProcessing = createOrUpdateToProcessing;
exports.updateStatusWithConnection = updateStatusWithConnection;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function row(doc) {
    return {
        id: Number(doc.id),
        order_id: Number(doc.order_id),
        status: String(doc.status),
        notes: doc.notes ?? null,
        delivered_at: doc.delivered_at ? date(doc.delivered_at) : null,
        created_at: date(doc.created_at),
        updated_at: date(doc.updated_at),
    };
}
async function findByOrderId(orderId) {
    const doc = await models_1.DeliveryModel.findOne({ order_id: orderId }).lean();
    return doc ? row(doc) : null;
}
async function create(orderId, status = 'pending') {
    const id = await (0, counter_1.nextId)('deliveries');
    await models_1.DeliveryModel.create({ id, order_id: orderId, status, notes: null, delivered_at: null });
    return id;
}
async function updateStatus(orderId, status, notes) {
    const patch = { status };
    if (notes != null)
        patch.notes = notes;
    if (status === 'delivered')
        patch.delivered_at = new Date();
    const result = await models_1.DeliveryModel.updateOne({ order_id: orderId }, { $set: patch });
    return result.modifiedCount > 0;
}
async function createOrUpdateToProcessing(orderId) {
    const existing = await findByOrderId(orderId);
    if (existing)
        await updateStatus(orderId, 'processing');
    else
        await create(orderId, 'processing');
}
async function updateStatusWithConnection(_conn, orderId, status, notes) {
    return updateStatus(orderId, status, notes);
}
//# sourceMappingURL=deliveryRepository.js.map