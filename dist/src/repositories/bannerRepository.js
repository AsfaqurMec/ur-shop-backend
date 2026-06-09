"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.update = update;
exports.softDelete = softDelete;
exports.findById = findById;
exports.findAll = findAll;
exports.findActive = findActive;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function toRow(doc) {
    return {
        id: Number(doc.id),
        background_image: String(doc.background_image),
        title: doc.title ?? null,
        subtitle: doc.subtitle ?? null,
        buttons: Array.isArray(doc.buttons) ? doc.buttons : [],
        sort_order: Number(doc.sort_order ?? 0),
        is_active: doc.is_active !== false,
        created_at: new Date(doc.created_at),
        updated_at: new Date(doc.updated_at),
        deleted_at: doc.deleted_at ? new Date(doc.deleted_at) : null,
    };
}
async function create(data) {
    const id = await (0, counter_1.nextId)('banners');
    await models_1.BannerModel.create({ id, ...data, deleted_at: null });
    return id;
}
async function update(id, data) {
    await models_1.BannerModel.updateOne({ id, deleted_at: null }, { $set: data });
}
async function softDelete(id) {
    const result = await models_1.BannerModel.updateOne({ id, deleted_at: null }, { $set: { deleted_at: new Date() } });
    return result.modifiedCount > 0;
}
async function findById(id) {
    const row = await models_1.BannerModel.findOne({ id, deleted_at: null }).lean();
    return row ? toRow(row) : null;
}
async function findAll() {
    const rows = await models_1.BannerModel.find({ deleted_at: null }).sort({ sort_order: 1, created_at: -1 }).lean();
    return rows.map(toRow);
}
async function findActive() {
    const rows = await models_1.BannerModel.find({ deleted_at: null, is_active: true }).sort({ sort_order: 1, created_at: -1 }).lean();
    return rows.map(toRow);
}
//# sourceMappingURL=bannerRepository.js.map