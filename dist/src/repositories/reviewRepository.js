"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.findById = findById;
exports.findByUserAndProduct = findByUserAndProduct;
exports.findByProductIdPublic = findByProductIdPublic;
exports.countByProductIdPublic = countByProductIdPublic;
exports.findAllAdmin = findAllAdmin;
exports.countAllAdmin = countAllAdmin;
exports.findByProductIdAdmin = findByProductIdAdmin;
exports.countByProductIdAdmin = countByProductIdAdmin;
exports.update = update;
exports.setHidden = setHidden;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function row(doc) {
    return {
        id: Number(doc.id),
        product_id: Number(doc.product_id),
        user_id: Number(doc.user_id),
        order_id: doc.order_id ?? null,
        rating: Number(doc.rating ?? 0),
        title: doc.title ?? null,
        body: doc.body ?? null,
        status: doc.status ?? 'approved',
        created_at: date(doc.created_at),
        updated_at: date(doc.updated_at),
        deleted_at: doc.deleted_at ? date(doc.deleted_at) : null,
    };
}
async function create(data) {
    const id = await (0, counter_1.nextId)('reviews');
    await models_1.ReviewModel.create({ id, ...data, status: 'approved', deleted_at: null });
    return id;
}
async function findById(id) {
    const doc = await models_1.ReviewModel.findOne({ id }).lean();
    return doc ? row(doc) : null;
}
async function findByUserAndProduct(userId, productId) {
    const doc = await models_1.ReviewModel.findOne({ user_id: userId, product_id: productId }).lean();
    return doc ? row(doc) : null;
}
async function findByProductIdPublic(productId, options = {}) {
    const rows = await models_1.ReviewModel.find({ product_id: productId, deleted_at: null })
        .sort({ created_at: -1 })
        .skip(options.offset ?? 0)
        .limit(Math.min(options.limit ?? 50, 100))
        .lean();
    return rows.map(row);
}
async function countByProductIdPublic(productId) {
    return models_1.ReviewModel.countDocuments({ product_id: productId, deleted_at: null });
}
async function enrichAdminRows(reviews) {
    const productIds = [...new Set(reviews.map((r) => Number(r.product_id)))];
    const products = await models_1.ProductModel.find({ id: { $in: productIds }, deleted_at: null }).lean();
    const categoryIds = [...new Set(products.map((p) => p.category_id).filter((id) => id != null).map(Number))];
    const categories = await models_1.CategoryModel.find({ id: { $in: categoryIds }, deleted_at: null }).lean();
    const productById = new Map(products.map((p) => [Number(p.id), p]));
    const categoryById = new Map(categories.map((c) => [Number(c.id), c]));
    return reviews.flatMap((reviewDoc) => {
        const product = productById.get(Number(reviewDoc.product_id));
        if (!product)
            return [];
        const category = product.category_id != null ? categoryById.get(Number(product.category_id)) : null;
        return [{
                ...row(reviewDoc),
                product_name: String(product.name),
                product_slug: String(product.slug),
                category_id: product.category_id ?? null,
                category_name: category ? String(category.name) : null,
            }];
    });
}
function productQueryForCategory(categoryId) {
    const query = { deleted_at: null };
    if (categoryId === 0)
        query.category_id = null;
    else if (categoryId != null && categoryId > 0)
        query.category_id = categoryId;
    return query;
}
async function findAllAdmin(categoryId, options = {}) {
    const products = await models_1.ProductModel.find(productQueryForCategory(categoryId)).select({ id: 1 }).lean();
    const productIds = products.map((p) => Number(p.id));
    const rows = await models_1.ReviewModel.find({ product_id: { $in: productIds } })
        .sort({ created_at: -1 })
        .skip(options.offset ?? 0)
        .limit(Math.min(options.limit ?? 10, 100))
        .lean();
    return enrichAdminRows(rows);
}
async function countAllAdmin(categoryId) {
    const products = await models_1.ProductModel.find(productQueryForCategory(categoryId)).select({ id: 1 }).lean();
    return models_1.ReviewModel.countDocuments({ product_id: { $in: products.map((p) => Number(p.id)) } });
}
async function findByProductIdAdmin(productId, options = {}) {
    const rows = await models_1.ReviewModel.find({ product_id: productId })
        .sort({ created_at: -1 })
        .skip(options.offset ?? 0)
        .limit(Math.min(options.limit ?? 50, 100))
        .lean();
    return rows.map(row);
}
async function countByProductIdAdmin(productId) {
    return models_1.ReviewModel.countDocuments({ product_id: productId });
}
async function update(id, data) {
    const patch = {};
    if (data.rating !== undefined)
        patch.rating = data.rating;
    if (data.title !== undefined)
        patch.title = data.title;
    if (data.body !== undefined)
        patch.body = data.body;
    if (Object.keys(patch).length === 0)
        return true;
    const result = await models_1.ReviewModel.updateOne({ id }, { $set: patch });
    return result.modifiedCount > 0;
}
async function setHidden(id, hidden) {
    const result = await models_1.ReviewModel.updateOne({ id }, { $set: { deleted_at: hidden ? new Date() : null } });
    return result.modifiedCount > 0;
}
//# sourceMappingURL=reviewRepository.js.map