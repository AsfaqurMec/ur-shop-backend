"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findVariationsByProductId = findVariationsByProductId;
exports.findVariationById = findVariationById;
exports.countEnabledVariations = countEnabledVariations;
exports.setVariationQuantityAbsolute = setVariationQuantityAbsolute;
exports.adjustVariationQuantity = adjustVariationQuantity;
exports.deleteAllForProduct = deleteAllForProduct;
exports.replaceVariationsForProduct = replaceVariationsForProduct;
exports.insertGeneratedCombinations = insertGeneratedCombinations;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
const combinationSignature_1 = require("../utils/combinationSignature");
const errorHandler_1 = require("../middlewares/errorHandler");
function rowToVariation(r) {
    return {
        id: Number(r.id),
        product_id: Number(r.product_id),
        sku: r.sku ?? null,
        quantity: r.quantity != null ? Number(r.quantity) : null,
        price: Number(r.price),
        compare_at_price: r.compare_at_price != null ? Number(r.compare_at_price) : null,
        enabled: Number(r.enabled ?? 1),
        sort_order: Number(r.sort_order ?? 0),
        combination: (0, combinationSignature_1.parseCombination)(r.combination),
        combination_signature: String(r.combination_signature),
    };
}
async function findVariationsByProductId(productId) {
    const rows = await models_1.ProductVariationModel.find({ product_id: productId })
        .sort({ sort_order: 1, id: 1 })
        .lean();
    return rows.map(rowToVariation);
}
async function findVariationById(id) {
    const row = await models_1.ProductVariationModel.findOne({ id }).lean();
    return row ? rowToVariation(row) : null;
}
async function countEnabledVariations(productId) {
    return models_1.ProductVariationModel.countDocuments({ product_id: productId, enabled: 1 });
}
async function setVariationQuantityAbsolute(variationId, quantity) {
    await models_1.ProductVariationModel.updateOne({ id: variationId }, { $set: { quantity } });
}
async function adjustVariationQuantity(_conn, variationId, delta) {
    if (delta === 0)
        return;
    const row = await models_1.ProductVariationModel.findOne({ id: variationId }).lean();
    if (!row)
        throw new errorHandler_1.AppError(400, 'Product option not found');
    if (row.quantity == null)
        return;
    const next = Number(row.quantity) + delta;
    if (next < 0)
        throw new errorHandler_1.AppError(400, 'Not enough stock for this product option');
    await models_1.ProductVariationModel.updateOne({ id: variationId }, { $set: { quantity: next } });
}
async function deleteAllForProduct(_conn, productId) {
    await models_1.ProductModel.updateOne({ id: productId, default_variation_id: { $ne: null } }, { $set: { default_variation_id: null } });
    await models_1.ProductVariationModel.deleteMany({ product_id: productId });
}
async function replaceVariationsForProduct(conn, productId, inputs) {
    await deleteAllForProduct(conn, productId);
    for (const v of inputs) {
        const sig = (0, combinationSignature_1.combinationSignature)(v.combination);
        await models_1.ProductVariationModel.create({
            id: await (0, counter_1.nextId)('product_variations'),
            product_id: productId,
            sku: v.sku ?? null,
            quantity: v.quantity ?? null,
            price: v.price,
            compare_at_price: v.compare_at_price ?? null,
            enabled: v.enabled ? 1 : 0,
            sort_order: v.sort_order,
            combination: v.combination,
            combination_signature: sig,
        });
    }
}
async function insertGeneratedCombinations(_conn, productId, combos, defaultPrice, baseSku) {
    let added = 0;
    const [last, product] = await Promise.all([
        models_1.ProductVariationModel.findOne({ product_id: productId })
            .sort({ sort_order: -1 })
            .lean(),
        baseSku !== undefined ? null : models_1.ProductModel.findOne({ id: productId }).lean(),
    ]);
    const effectiveBaseSku = baseSku !== undefined ? baseSku : (product?.sku || null);
    let order = Number(last?.sort_order ?? -1) + 1;
    for (const combo of combos) {
        const sig = (0, combinationSignature_1.combinationSignature)(combo);
        const exists = await models_1.ProductVariationModel.exists({ product_id: productId, combination_signature: sig });
        if (exists)
            continue;
        let autoSku = null;
        if (effectiveBaseSku) {
            const parts = Object.values(combo)
                .map((v) => String(v).trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 3))
                .filter(Boolean);
            autoSku = parts.length > 0 ? `${effectiveBaseSku}-${parts.join('-')}` : effectiveBaseSku;
        }
        await models_1.ProductVariationModel.create({
            id: await (0, counter_1.nextId)('product_variations'),
            product_id: productId,
            sku: autoSku,
            quantity: 0,
            price: defaultPrice,
            compare_at_price: null,
            enabled: 1,
            sort_order: order,
            combination: combo,
            combination_signature: sig,
        });
        order += 1;
        added += 1;
    }
    return added;
}
//# sourceMappingURL=productVariationRepository.js.map