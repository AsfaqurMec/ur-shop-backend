"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.findRecentByTo = findRecentByTo;
exports.countLogs = countLogs;
exports.listPaginated = listPaginated;
exports.listDistinctTemplates = listDistinctTemplates;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function row(r) {
    return {
        id: Number(r.id),
        to_email: String(r.to_email),
        subject: r.subject != null ? String(r.subject) : null,
        template: r.template != null ? String(r.template) : null,
        status: r.status,
        error_message: r.error_message != null ? String(r.error_message) : null,
        sent_at: date(r.sent_at ?? r.created_at),
    };
}
async function create(data) {
    const id = await (0, counter_1.nextId)('email_logs');
    await models_1.EmailLogModel.create({ id, ...data, error_message: data.error_message ?? null, sent_at: new Date() });
    return id;
}
async function findRecentByTo(toEmail, limit = 50) {
    const rows = await models_1.EmailLogModel.find({ to_email: toEmail }).sort({ sent_at: -1, created_at: -1 }).limit(limit).lean();
    return rows.map(row);
}
async function countLogs(template) {
    return models_1.EmailLogModel.countDocuments(template ? { template } : {});
}
async function listPaginated(limit, offset, template) {
    const rows = await models_1.EmailLogModel.find(template ? { template } : {})
        .sort({ sent_at: -1, created_at: -1 })
        .skip(offset)
        .limit(limit)
        .lean();
    return rows.map(row);
}
async function listDistinctTemplates() {
    const values = await models_1.EmailLogModel.distinct('template', { template: { $nin: [null, ''] } });
    return values.map(String).sort((a, b) => a.localeCompare(b));
}
//# sourceMappingURL=emailLogRepository.js.map