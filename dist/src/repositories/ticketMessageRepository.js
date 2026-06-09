"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.findByTicketId = findByTicketId;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function row(doc) {
    return {
        id: Number(doc.id),
        ticket_id: Number(doc.ticket_id),
        sender_type: doc.sender_type,
        user_id: doc.user_id ?? null,
        admin_id: doc.admin_id ?? null,
        message: String(doc.message),
        created_at: date(doc.created_at),
    };
}
async function create(data) {
    const id = await (0, counter_1.nextId)('ticket_messages');
    await models_1.TicketMessageModel.create({ id, ...data });
    return id;
}
async function findByTicketId(ticketId) {
    const rows = await models_1.TicketMessageModel.find({ ticket_id: ticketId }).sort({ created_at: 1, id: 1 }).lean();
    return rows.map(row);
}
//# sourceMappingURL=ticketMessageRepository.js.map