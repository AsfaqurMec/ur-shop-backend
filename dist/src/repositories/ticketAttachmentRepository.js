"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.findByMessageId = findByMessageId;
exports.findById = findById;
exports.findByIdWithTicketId = findByIdWithTicketId;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function row(doc) {
    return {
        id: Number(doc.id),
        ticket_message_id: Number(doc.ticket_message_id),
        file_path: String(doc.file_path),
        file_name: String(doc.file_name),
        file_size: doc.file_size != null ? Number(doc.file_size) : null,
        created_at: date(doc.created_at),
    };
}
async function create(data) {
    const id = await (0, counter_1.nextId)('ticket_message_attachments');
    await models_1.TicketAttachmentModel.create({ id, ...data, file_size: data.file_size ?? null });
    return id;
}
async function findByMessageId(ticketMessageId) {
    const rows = await models_1.TicketAttachmentModel.find({ ticket_message_id: ticketMessageId }).sort({ id: 1 }).lean();
    return rows.map(row);
}
async function findById(id) {
    const doc = await models_1.TicketAttachmentModel.findOne({ id }).lean();
    return doc ? row(doc) : null;
}
async function findByIdWithTicketId(id) {
    const attachment = await models_1.TicketAttachmentModel.findOne({ id }).lean();
    if (!attachment)
        return null;
    const message = await models_1.TicketMessageModel.findOne({ id: Number(attachment.ticket_message_id) }).lean();
    if (!message)
        return null;
    return { ...row(attachment), ticket_id: Number(message.ticket_id) };
}
//# sourceMappingURL=ticketAttachmentRepository.js.map