"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAll = findAll;
exports.findEnabledPublic = findEnabledPublic;
exports.findById = findById;
exports.findByGatewayKey = findByGatewayKey;
exports.findEnabledByGatewayKey = findEnabledByGatewayKey;
exports.createRow = createRow;
exports.updateById = updateById;
exports.deleteById = deleteById;
exports.countByGatewayKey = countByGatewayKey;
exports.countByKind = countByKind;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function parseObject(v) {
    if (v == null)
        return null;
    if (typeof v === 'object' && !Array.isArray(v))
        return v;
    if (typeof v === 'string') {
        try {
            const parsed = JSON.parse(v);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
        }
        catch {
            return null;
        }
    }
    return null;
}
function parseRow(r) {
    return {
        id: Number(r.id),
        kind: r.kind === 'merchant' ? 'merchant' : 'manual',
        gateway_key: String(r.gateway_key),
        name: String(r.name),
        description: r.description ?? null,
        is_enabled: Number(r.is_enabled ?? 1),
        sort_order: Number(r.sort_order ?? 0),
        manual_flow: r.manual_flow ?? null,
        bank_details: parseObject(r.bank_details),
        merchant_credentials: parseObject(r.merchant_credentials),
        ui_brand: r.ui_brand ?? null,
        created_at: date(r.created_at),
        updated_at: date(r.updated_at),
    };
}
async function findAll() {
    const rows = await models_1.PaymentOptionModel.find({}).sort({ sort_order: 1, id: 1 }).lean();
    return rows.map(parseRow);
}
async function findEnabledPublic() {
    const rows = await models_1.PaymentOptionModel.find({ is_enabled: 1 }).sort({ sort_order: 1, id: 1 }).lean();
    return rows.map(parseRow);
}
async function findById(id) {
    const row = await models_1.PaymentOptionModel.findOne({ id }).lean();
    return row ? parseRow(row) : null;
}
async function findByGatewayKey(gatewayKey) {
    const row = await models_1.PaymentOptionModel.findOne({ gateway_key: gatewayKey }).lean();
    return row ? parseRow(row) : null;
}
async function findEnabledByGatewayKey(gatewayKey) {
    const row = await models_1.PaymentOptionModel.findOne({ gateway_key: gatewayKey, is_enabled: 1 }).lean();
    return row ? parseRow(row) : null;
}
async function createRow(input) {
    const id = await (0, counter_1.nextId)('payment_options');
    await models_1.PaymentOptionModel.create({
        id,
        kind: input.kind,
        gateway_key: input.gateway_key,
        name: input.name,
        description: input.description ?? null,
        is_enabled: input.is_enabled === false ? 0 : 1,
        sort_order: input.sort_order ?? 0,
        manual_flow: input.manual_flow ?? null,
        bank_details: input.bank_details ?? null,
        merchant_credentials: input.merchant_credentials ?? null,
        ui_brand: input.ui_brand ?? 'generic',
    });
    return id;
}
async function updateById(id, patch) {
    const data = {};
    for (const [key, value] of Object.entries(patch)) {
        if (value !== undefined)
            data[key] = key === 'is_enabled' ? (value ? 1 : 0) : value;
    }
    if (Object.keys(data).length === 0)
        return false;
    const result = await models_1.PaymentOptionModel.updateOne({ id }, { $set: data });
    return result.modifiedCount > 0;
}
async function deleteById(id) {
    const result = await models_1.PaymentOptionModel.deleteOne({ id });
    return result.deletedCount > 0;
}
async function countByGatewayKey(gatewayKey, excludeId) {
    const query = { gateway_key: gatewayKey };
    if (excludeId != null)
        query.id = { $ne: excludeId };
    return models_1.PaymentOptionModel.countDocuments(query);
}
async function countByKind(kind) {
    return models_1.PaymentOptionModel.countDocuments({ kind });
}
//# sourceMappingURL=paymentOptionRepository.js.map