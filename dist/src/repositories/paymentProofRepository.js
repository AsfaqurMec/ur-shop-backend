"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.findById = findById;
exports.findByOrderId = findByOrderId;
exports.findAllPending = findAllPending;
exports.countRecentForAdmin = countRecentForAdmin;
exports.findRecentForAdmin = findRecentForAdmin;
exports.updateStatus = updateStatus;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function row(doc) {
    return {
        id: Number(doc.id),
        order_id: Number(doc.order_id),
        user_id: Number(doc.user_id),
        sender_number: doc.sender_number ?? null,
        transaction_id: doc.transaction_id ?? null,
        paid_amount: doc.paid_amount != null ? Number(doc.paid_amount) : null,
        file_path: doc.file_path ?? null,
        status: (doc.status ?? 'pending'),
        created_at: date(doc.created_at),
        updated_at: date(doc.updated_at),
    };
}
async function withAdminContext(proofs) {
    const userIds = [...new Set(proofs.map((p) => Number(p.user_id)))];
    const orderIds = [...new Set(proofs.map((p) => Number(p.order_id)))];
    const [users, orders] = await Promise.all([
        models_1.UserModel.find({ id: { $in: userIds }, deleted_at: null }).lean(),
        models_1.OrderModel.find({ id: { $in: orderIds } }).lean(),
    ]);
    const userById = new Map(users.map((u) => [Number(u.id), u]));
    const orderById = new Map(orders.map((o) => [Number(o.id), o]));
    return proofs.flatMap((proof) => {
        const user = userById.get(Number(proof.user_id));
        const order = orderById.get(Number(proof.order_id));
        if (!user || !order)
            return [];
        return [{
                ...row(proof),
                user_email: String(user.email),
                order_number: String(order.order_number),
                order_total: Number(order.total ?? 0),
                order_currency: String(order.currency ?? 'BDT'),
            }];
    });
}
async function create(data) {
    const id = await (0, counter_1.nextId)('payment_proofs');
    await models_1.PaymentProofModel.create({ id, ...data, status: 'pending' });
    return id;
}
async function findById(id) {
    const doc = await models_1.PaymentProofModel.findOne({ id }).lean();
    return doc ? row(doc) : null;
}
async function findByOrderId(orderId) {
    const rows = await models_1.PaymentProofModel.find({ order_id: orderId }).sort({ created_at: -1 }).lean();
    return rows.map(row);
}
async function findAllPending() {
    const rows = await models_1.PaymentProofModel.find({ status: 'pending' }).sort({ created_at: 1 }).lean();
    return withAdminContext(rows);
}
function queryForAdmin(options) {
    const query = {};
    if (options.status)
        query.status = options.status;
    if (options.excludePending)
        query.status = { $ne: 'pending' };
    return query;
}
async function countRecentForAdmin(options) {
    return models_1.PaymentProofModel.countDocuments(queryForAdmin(options));
}
async function findRecentForAdmin(options) {
    const rows = await models_1.PaymentProofModel.find(queryForAdmin(options))
        .sort({ updated_at: -1 })
        .skip(Math.max(0, options.offset ?? 0))
        .limit(options.limit)
        .lean();
    return withAdminContext(rows);
}
async function updateStatus(id, status) {
    const result = await models_1.PaymentProofModel.updateOne({ id }, { $set: { status } });
    return result.modifiedCount > 0;
}
//# sourceMappingURL=paymentProofRepository.js.map