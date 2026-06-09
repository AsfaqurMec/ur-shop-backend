"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findByCode = findByCode;
exports.findById = findById;
exports.codeExists = codeExists;
exports.create = create;
exports.update = update;
exports.softDelete = softDelete;
exports.countUsagesByUser = countUsagesByUser;
exports.incrementUsedCount = incrementUsedCount;
exports.recordUsage = recordUsage;
exports.recordUsageWithConnection = recordUsageWithConnection;
exports.incrementUsedCountWithConnection = incrementUsedCountWithConnection;
exports.findCouponIdsUsedByOrderId = findCouponIdsUsedByOrderId;
exports.deleteCouponUsagesForOrder = deleteCouponUsagesForOrder;
exports.decrementUsedCountById = decrementUsedCountById;
exports.rollbackCouponsForOrder = rollbackCouponsForOrder;
exports.setCouponProducts = setCouponProducts;
exports.getCouponProductIds = getCouponProductIds;
exports.setCouponCategories = setCouponCategories;
exports.getCouponCategoryIds = getCouponCategoryIds;
exports.findAll = findAll;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function row(doc) {
    return {
        id: Number(doc.id),
        code: String(doc.code),
        type: doc.type,
        value: Number(doc.value ?? 0),
        min_order_amount: doc.min_order_amount != null ? Number(doc.min_order_amount) : null,
        max_uses: doc.max_uses != null ? Number(doc.max_uses) : null,
        max_uses_per_user: doc.max_uses_per_user != null ? Number(doc.max_uses_per_user) : null,
        used_count: Number(doc.used_count ?? 0),
        valid_from: doc.valid_from ? date(doc.valid_from) : null,
        valid_until: doc.valid_until ? date(doc.valid_until) : null,
        is_active: Number(doc.is_active ?? 1),
        created_at: date(doc.created_at),
        updated_at: date(doc.updated_at),
        deleted_at: doc.deleted_at ? date(doc.deleted_at) : null,
    };
}
async function findByCode(code) {
    const doc = await models_1.CouponModel.findOne({ code: code.trim().toUpperCase(), deleted_at: null }).lean();
    return doc ? row(doc) : null;
}
async function findById(id) {
    const doc = await models_1.CouponModel.findOne({ id, deleted_at: null }).lean();
    return doc ? row(doc) : null;
}
async function codeExists(code, excludeId) {
    const query = { code: code.trim().toUpperCase(), deleted_at: null };
    if (excludeId != null)
        query.id = { $ne: excludeId };
    return Boolean(await models_1.CouponModel.exists(query));
}
async function create(data) {
    const id = await (0, counter_1.nextId)('coupons');
    await models_1.CouponModel.create({
        id,
        ...data,
        code: data.code.trim().toUpperCase(),
        used_count: 0,
        deleted_at: null,
    });
    return id;
}
async function update(id, data) {
    const updateData = {};
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined)
            updateData[key] = key === 'code' && typeof value === 'string' ? value.trim().toUpperCase() : value;
    }
    if (Object.keys(updateData).length === 0)
        return;
    await models_1.CouponModel.updateOne({ id, deleted_at: null }, { $set: updateData });
}
async function softDelete(id) {
    const result = await models_1.CouponModel.updateOne({ id, deleted_at: null }, { $set: { deleted_at: new Date() } });
    return result.modifiedCount > 0;
}
async function countUsagesByUser(couponId, userId) {
    return models_1.CouponUsageModel.countDocuments({ coupon_id: couponId, user_id: userId });
}
async function incrementUsedCount(couponId) {
    await models_1.CouponModel.updateOne({ id: couponId }, { $inc: { used_count: 1 } });
}
async function recordUsage(couponId, orderId, userId, discountAmount) {
    const id = await (0, counter_1.nextId)('coupon_usages');
    await models_1.CouponUsageModel.create({ id, coupon_id: couponId, order_id: orderId, user_id: userId, discount_amount: discountAmount });
    return id;
}
async function recordUsageWithConnection(_conn, couponId, orderId, userId, discountAmount) {
    return recordUsage(couponId, orderId, userId, discountAmount);
}
async function incrementUsedCountWithConnection(_conn, couponId) {
    await incrementUsedCount(couponId);
}
async function findCouponIdsUsedByOrderId(orderId) {
    const rows = await models_1.CouponUsageModel.find({ order_id: orderId }).lean();
    return rows.map((r) => Number(r.coupon_id));
}
async function deleteCouponUsagesForOrder(orderId) {
    await models_1.CouponUsageModel.deleteMany({ order_id: orderId });
}
async function decrementUsedCountById(couponId) {
    await models_1.CouponModel.updateOne({ id: couponId }, { $inc: { used_count: -1 } });
    const doc = await models_1.CouponModel.findOne({ id: couponId }).lean();
    if (doc && Number(doc.used_count ?? 0) < 0) {
        await models_1.CouponModel.updateOne({ id: couponId }, { $set: { used_count: 0 } });
    }
}
async function rollbackCouponsForOrder(orderId) {
    const ids = await findCouponIdsUsedByOrderId(orderId);
    if (ids.length === 0)
        return;
    const unique = [...new Set(ids)];
    await deleteCouponUsagesForOrder(orderId);
    for (const couponId of unique)
        await decrementUsedCountById(couponId);
}
async function setCouponProducts(couponId, productIds) {
    await models_1.CouponProductModel.deleteMany({ coupon_id: couponId });
    for (const productId of productIds) {
        await models_1.CouponProductModel.create({ id: await (0, counter_1.nextId)('coupon_products'), coupon_id: couponId, product_id: productId });
    }
}
async function getCouponProductIds(couponId) {
    const rows = await models_1.CouponProductModel.find({ coupon_id: couponId }).lean();
    return rows.map((r) => Number(r.product_id));
}
async function setCouponCategories(couponId, categoryIds) {
    await models_1.CouponCategoryModel.deleteMany({ coupon_id: couponId });
    for (const categoryId of categoryIds) {
        await models_1.CouponCategoryModel.create({ id: await (0, counter_1.nextId)('coupon_categories'), coupon_id: couponId, category_id: categoryId });
    }
}
async function getCouponCategoryIds(couponId) {
    const rows = await models_1.CouponCategoryModel.find({ coupon_id: couponId }).lean();
    return rows.map((r) => Number(r.category_id));
}
async function findAll() {
    const rows = await models_1.CouponModel.find({ deleted_at: null }).sort({ created_at: -1 }).lean();
    return rows.map(row);
}
//# sourceMappingURL=couponRepository.js.map