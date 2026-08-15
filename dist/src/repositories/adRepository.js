"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.findById = findById;
exports.findAll = findAll;
exports.update = update;
exports.remove = remove;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
async function create(data) {
    const id = await (0, counter_1.nextId)('ads');
    await models_1.AdModel.create({ id, ...data, deleted_at: null });
    return id;
}
async function findById(id) { return models_1.AdModel.findOne({ id, deleted_at: null }).lean(); }
async function findAll(activeOnly = false) { return models_1.AdModel.find({ deleted_at: null, ...(activeOnly ? { is_active: true } : {}) }).sort({ created_at: -1 }).lean(); }
async function update(id, data) { await models_1.AdModel.updateOne({ id, deleted_at: null }, { $set: data }); }
async function remove(id) { const r = await models_1.AdModel.updateOne({ id, deleted_at: null }, { $set: { deleted_at: new Date() } }); return r.modifiedCount > 0; }
//# sourceMappingURL=adRepository.js.map