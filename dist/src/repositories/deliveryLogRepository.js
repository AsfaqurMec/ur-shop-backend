"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.findByOrderId = findByOrderId;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
async function create(_conn, data) {
    const id = await (0, counter_1.nextId)('delivery_logs');
    await models_1.DeliveryLogModel.create({ id, ...data });
    return id;
}
async function findByOrderId(orderId) {
    const rows = await models_1.DeliveryLogModel.find({ order_id: orderId }).sort({ created_at: 1, id: 1 }).lean();
    return rows.map((r) => ({
        id: Number(r.id),
        order_id: Number(r.order_id),
        order_item_id: r.order_item_id ?? null,
        action: String(r.action),
        details: r.details ?? null,
        created_at: r.created_at ? new Date(r.created_at) : new Date(),
    }));
}
//# sourceMappingURL=deliveryLogRepository.js.map