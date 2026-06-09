"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.update = update;
exports.softDelete = softDelete;
exports.slugExists = slugExists;
exports.findById = findById;
exports.findBySlug = findBySlug;
exports.findAll = findAll;
exports.countActive = countActive;
exports.findPage = findPage;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function toRow(doc) {
    return {
        id: Number(doc.id),
        parent_id: doc.parent_id ?? null,
        name: String(doc.name),
        slug: String(doc.slug),
        description: doc.description ?? null,
        sort_order: Number(doc.sort_order ?? 0),
        created_at: new Date(doc.created_at),
        updated_at: new Date(doc.updated_at),
        deleted_at: doc.deleted_at ? new Date(doc.deleted_at) : null,
    };
}
async function create(data) {
    const id = await (0, counter_1.nextId)('categories');
    await models_1.CategoryModel.create({ id, ...data, deleted_at: null });
    return id;
}
async function update(id, data) {
    await models_1.CategoryModel.updateOne({ id, deleted_at: null }, { $set: data });
}
async function softDelete(id) {
    const result = await models_1.CategoryModel.updateOne({ id, deleted_at: null }, { $set: { deleted_at: new Date() } });
    return result.modifiedCount > 0;
}
async function slugExists(slug, excludeId) {
    const query = { slug, deleted_at: null };
    if (excludeId != null)
        query.id = { $ne: excludeId };
    return Boolean(await models_1.CategoryModel.exists(query));
}
async function findById(id) {
    const row = await models_1.CategoryModel.findOne({ id, deleted_at: null }).lean();
    return row ? toRow(row) : null;
}
async function findBySlug(slug) {
    const row = await models_1.CategoryModel.findOne({ slug, deleted_at: null }).lean();
    return row ? toRow(row) : null;
}
async function findAll() {
    const rows = await models_1.CategoryModel.find({ deleted_at: null }).sort({ sort_order: 1, name: 1 }).lean();
    return rows.map(toRow);
}
async function countActive() {
    return models_1.CategoryModel.countDocuments({ deleted_at: null });
}
async function findPage(limit, offset) {
    const rows = await models_1.CategoryModel.find({ deleted_at: null })
        .sort({ sort_order: 1, name: 1 })
        .skip(offset)
        .limit(limit)
        .lean();
    return rows.map(toRow);
}
//# sourceMappingURL=categoryRepository.js.map