"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
async function create(data) {
    const id = await (0, counter_1.nextId)('audit_logs');
    await models_1.AuditLogModel.create({ id, ...data });
    return id;
}
//# sourceMappingURL=auditLogRepository.js.map