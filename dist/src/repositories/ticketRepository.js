"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.findById = findById;
exports.findTicketsForUser = findTicketsForUser;
exports.countTicketsForUser = countTicketsForUser;
exports.findAll = findAll;
exports.updateStatus = updateStatus;
exports.findByIdWithOrderNumber = findByIdWithOrderNumber;
exports.countByStatus = countByStatus;
exports.countByUserIdAndStatus = countByUserIdAndStatus;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function row(doc) {
    return {
        id: Number(doc.id),
        user_id: Number(doc.user_id),
        order_id: doc.order_id ?? null,
        subject: String(doc.subject),
        status: (doc.status ?? 'open'),
        created_at: date(doc.created_at),
        updated_at: date(doc.updated_at),
    };
}
async function orderNumberMap(orderIds) {
    const orders = await models_1.OrderModel.find({ id: { $in: orderIds } }).lean();
    return new Map(orders.map((order) => [Number(order.id), String(order.order_number)]));
}
async function create(data) {
    const id = await (0, counter_1.nextId)('tickets');
    await models_1.TicketModel.create({ id, user_id: data.user_id, order_id: data.order_id ?? null, subject: data.subject, status: 'open' });
    return id;
}
async function findById(id) {
    const doc = await models_1.TicketModel.findOne({ id }).lean();
    return doc ? row(doc) : null;
}
async function listRows(query, limit, offset) {
    const tickets = await models_1.TicketModel.find(query).sort({ updated_at: -1 }).skip(offset).limit(limit).lean();
    const orderNumbers = await orderNumberMap(tickets.map((t) => t.order_id).filter((id) => id != null).map(Number));
    return tickets.map((t) => ({
        id: Number(t.id),
        subject: String(t.subject),
        status: String(t.status),
        order_id: t.order_id ?? null,
        order_number: t.order_id != null ? orderNumbers.get(Number(t.order_id)) ?? null : null,
        created_at: date(t.created_at),
        updated_at: date(t.updated_at),
    }));
}
async function findTicketsForUser(userId, options) {
    return listRows({ user_id: userId, ...(options.status ? { status: options.status } : {}) }, options.limit, options.offset);
}
async function countTicketsForUser(userId, options = {}) {
    return models_1.TicketModel.countDocuments({ user_id: userId, ...(options.status ? { status: options.status } : {}) });
}
async function findAll(options = {}) {
    return listRows(options.status ? { status: options.status } : {}, Math.min(options.limit ?? 100, 200), options.offset ?? 0);
}
async function updateStatus(id, status) {
    const result = await models_1.TicketModel.updateOne({ id }, { $set: { status } });
    return result.modifiedCount > 0;
}
async function findByIdWithOrderNumber(id) {
    const ticket = await models_1.TicketModel.findOne({ id }).lean();
    if (!ticket)
        return null;
    const order = ticket.order_id != null ? await models_1.OrderModel.findOne({ id: Number(ticket.order_id) }).lean() : null;
    return { ...row(ticket), order_number: order ? String(order.order_number) : null };
}
async function countByStatus(status) {
    return models_1.TicketModel.countDocuments({ status });
}
async function countByUserIdAndStatus(userId, status) {
    return models_1.TicketModel.countDocuments({ user_id: userId, status });
}
//# sourceMappingURL=ticketRepository.js.map