"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.adjustProductQuantity = adjustProductQuantity;
exports.softDeleteProduct = softDeleteProduct;
exports.findProductById = findProductById;
exports.findProductBySlug = findProductBySlug;
exports.productSlugExists = productSlugExists;
exports.findProducts = findProducts;
exports.getNeedsPdpConfigMap = getNeedsPdpConfigMap;
exports.findDefaultVariationStorefrontPricing = findDefaultVariationStorefrontPricing;
exports.countProducts = countProducts;
exports.createProductImage = createProductImage;
exports.findProductImagesByProductId = findProductImagesByProductId;
exports.findPrimaryImagePathsByProductIds = findPrimaryImagePathsByProductIds;
exports.deleteProductImage = deleteProductImage;
exports.deleteAllProductImagesByProductId = deleteAllProductImagesByProductId;
exports.createProductFile = createProductFile;
exports.findProductFilesByProductId = findProductFilesByProductId;
exports.findProductFileById = findProductFileById;
exports.findProductFileByIdOnly = findProductFileByIdOnly;
exports.deleteProductFile = deleteProductFile;
exports.createLicenseKeys = createLicenseKeys;
exports.countAvailableLicensesNoVariation = countAvailableLicensesNoVariation;
exports.countAvailableLicensesForVariation = countAvailableLicensesForVariation;
exports.countSellableLicensesWithVariations = countSellableLicensesWithVariations;
exports.findLicensePoolByProductId = findLicensePoolByProductId;
exports.findLicensePoolByProductIdPaged = findLicensePoolByProductIdPaged;
exports.countLicensePoolByProductId = countLicensePoolByProductId;
exports.findLicenseById = findLicenseById;
exports.updateLicenseKey = updateLicenseKey;
exports.assignUnassignedLicenseKeysToVariation = assignUnassignedLicenseKeysToVariation;
exports.deleteLicenseKey = deleteLicenseKey;
exports.findLicensesByOrderId = findLicensesByOrderId;
exports.findAssignedLicensesForUser = findAssignedLicensesForUser;
exports.assignLicenseKeysToOrderItem = assignLicenseKeysToOrderItem;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function toProductRow(doc) {
    return {
        id: Number(doc.id),
        category_id: doc.category_id ?? null,
        name: String(doc.name),
        slug: String(doc.slug),
        description: doc.description ?? null,
        full_description: doc.full_description ?? null,
        size_chart_image: doc.size_chart_image ?? null,
        features: Array.isArray(doc.features) ? JSON.stringify(doc.features) : doc.features ?? null,
        product_type: doc.product_type,
        manual_fulfillment_required: Number(doc.manual_fulfillment_required ?? 0),
        price: Number(doc.price ?? 0),
        compare_at_price: doc.compare_at_price != null ? Number(doc.compare_at_price) : null,
        sku: doc.sku ?? null,
        quantity: doc.quantity != null ? Number(doc.quantity) : null,
        default_variation_id: doc.default_variation_id ?? null,
        is_active: Number(doc.is_active ?? 1),
        is_featured: Number(doc.is_featured ?? 0),
        is_trending: Number(doc.is_trending ?? 0),
        trending_order: doc.trending_order != null ? Number(doc.trending_order) : undefined,
        created_at: date(doc.created_at),
        updated_at: date(doc.updated_at),
        deleted_at: doc.deleted_at ? date(doc.deleted_at) : null,
    };
}
function toImageRow(doc) {
    return {
        id: Number(doc.id),
        product_id: Number(doc.product_id),
        path: String(doc.path),
        alt_text: doc.alt_text ?? null,
        sort_order: Number(doc.sort_order ?? 0),
        created_at: date(doc.created_at),
    };
}
function toFileRow(doc) {
    return {
        id: Number(doc.id),
        product_id: Number(doc.product_id),
        file_path: String(doc.file_path),
        file_name: String(doc.file_name),
        file_size: doc.file_size != null ? Number(doc.file_size) : null,
        download_limit: doc.download_limit != null ? Number(doc.download_limit) : null,
        sort_order: Number(doc.sort_order ?? 0),
        created_at: date(doc.created_at),
        updated_at: date(doc.updated_at),
    };
}
function toLicenseRow(doc) {
    return {
        id: Number(doc.id),
        product_id: Number(doc.product_id),
        product_variation_id: doc.product_variation_id ?? null,
        license_key: String(doc.license_key),
        used_at: doc.used_at ? date(doc.used_at) : null,
        order_item_id: doc.order_item_id ?? null,
        created_at: date(doc.created_at),
    };
}
async function createProduct(data) {
    const id = await (0, counter_1.nextId)('products');
    await models_1.ProductModel.create({ id, is_trending: 0, ...data, deleted_at: null });
    return id;
}
async function updateProduct(id, data) {
    await models_1.ProductModel.updateOne({ id, deleted_at: null }, { $set: data });
}
async function adjustProductQuantity(productId, delta) {
    if (delta === 0)
        return;
    const prod = await models_1.ProductModel.findOne({ id: productId, deleted_at: null }).lean();
    if (!prod || prod.quantity == null)
        return;
    const next = Math.max(0, Number(prod.quantity) + delta);
    await models_1.ProductModel.updateOne({ id: productId }, { $set: { quantity: next } });
}
async function softDeleteProduct(id) {
    const result = await models_1.ProductModel.updateOne({ id, deleted_at: null }, { $set: { deleted_at: new Date() } });
    return result.modifiedCount > 0;
}
async function findProductById(id) {
    const row = await models_1.ProductModel.findOne({ id, deleted_at: null }).lean();
    return row ? toProductRow(row) : null;
}
async function findProductBySlug(slug) {
    const row = await models_1.ProductModel.findOne({ slug, deleted_at: null }).lean();
    return row ? toProductRow(row) : null;
}
async function productSlugExists(slug, excludeId) {
    const query = { slug, deleted_at: null };
    if (excludeId != null)
        query.id = { $ne: excludeId };
    return Boolean(await models_1.ProductModel.exists(query));
}
function productQuery(filters) {
    const query = { deleted_at: null };
    if (filters.category_id != null)
        query.category_id = filters.category_id;
    if (filters.product_type)
        query.product_type = filters.product_type;
    if (filters.featured === true)
        query.is_featured = 1;
    if (filters.trending === true)
        query.is_trending = 1;
    if (filters.is_active !== undefined)
        query.is_active = filters.is_active ? 1 : 0;
    if (filters.min_price != null || filters.max_price != null) {
        query.price = {
            ...(filters.min_price != null ? { $gte: filters.min_price } : {}),
            ...(filters.max_price != null ? { $lte: filters.max_price } : {}),
        };
    }
    if (filters.on_sale === true)
        query.$expr = { $gt: ['$compare_at_price', '$price'] };
    if (filters.search?.trim()) {
        const rx = new RegExp(filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [{ name: rx }, { slug: rx }, { sku: rx }];
    }
    return query;
}
async function findProducts(filters, limit, offset) {
    let sort = filters.sort === 'price_asc' ? { price: 1, created_at: -1 } :
        filters.sort === 'price_desc' ? { price: -1, created_at: -1 } :
            filters.sort === 'name_asc' ? { name: 1, created_at: -1 } :
                filters.sort === 'name_desc' ? { name: -1, created_at: -1 } :
                    { is_featured: -1, created_at: -1 };
    if (filters.trending === true) {
        sort = { trending_order: 1, ...sort };
    }
    const rows = await models_1.ProductModel.find(productQuery(filters))
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .lean();
    return rows.map(toProductRow);
}
async function getNeedsPdpConfigMap(productIds) {
    const map = new Map();
    if (productIds.length === 0)
        return map;
    const [varRows] = await Promise.all([
        models_1.ProductVariationModel.find({ product_id: { $in: productIds }, enabled: 1 }).lean(),
    ]);
    const varSet = new Set(varRows.map((r) => Number(r.product_id)));
    productIds.forEach((id) => map.set(id, varSet.has(id)));
    return map;
}
async function findDefaultVariationStorefrontPricing(productIds) {
    const map = new Map();
    if (productIds.length === 0)
        return map;
    const products = await models_1.ProductModel.find({
        id: { $in: productIds },
        default_variation_id: { $ne: null },
        deleted_at: null,
    }).lean();
    const variationIds = products.map((p) => Number(p.default_variation_id)).filter(Boolean);
    const variations = await models_1.ProductVariationModel.find({ id: { $in: variationIds }, enabled: 1 }).lean();
    const byId = new Map(variations.map((v) => [Number(v.id), v]));
    for (const p of products) {
        const v = byId.get(Number(p.default_variation_id));
        if (v)
            map.set(Number(p.id), { price: Number(v.price), compare_at_price: v.compare_at_price ?? null });
    }
    return map;
}
async function countProducts(filters) {
    return models_1.ProductModel.countDocuments(productQuery(filters));
}
async function createProductImage(data) {
    const id = await (0, counter_1.nextId)('product_images');
    await models_1.ProductImageModel.create({ id, ...data, deleted_at: null });
    return id;
}
async function findProductImagesByProductId(productId) {
    const rows = await models_1.ProductImageModel.find({ product_id: productId, deleted_at: null })
        .sort({ sort_order: 1, id: 1 })
        .lean();
    return rows.map(toImageRow);
}
async function findPrimaryImagePathsByProductIds(productIds) {
    const map = new Map();
    for (const id of productIds) {
        const img = await models_1.ProductImageModel.findOne({ product_id: id, deleted_at: null }).sort({ sort_order: 1, id: 1 }).lean();
        if (img?.path)
            map.set(id, String(img.path));
    }
    return map;
}
async function deleteProductImage(id, productId) {
    const result = await models_1.ProductImageModel.deleteOne({ id, product_id: productId });
    return result.deletedCount > 0;
}
async function deleteAllProductImagesByProductId(productId) {
    await models_1.ProductImageModel.deleteMany({ product_id: productId });
}
async function createProductFile(data) {
    const id = await (0, counter_1.nextId)('product_files');
    await models_1.ProductFileModel.create({ id, ...data, deleted_at: null });
    return id;
}
async function findProductFilesByProductId(productId) {
    const rows = await models_1.ProductFileModel.find({ product_id: productId, deleted_at: null })
        .sort({ sort_order: 1, id: 1 })
        .lean();
    return rows.map(toFileRow);
}
async function findProductFileById(id, productId) {
    const row = await models_1.ProductFileModel.findOne({ id, product_id: productId, deleted_at: null }).lean();
    return row ? toFileRow(row) : null;
}
async function findProductFileByIdOnly(id) {
    const row = await models_1.ProductFileModel.findOne({ id, deleted_at: null }).lean();
    return row ? toFileRow(row) : null;
}
async function deleteProductFile(id, productId) {
    const result = await models_1.ProductFileModel.deleteOne({ id, product_id: productId });
    return result.deletedCount > 0;
}
async function createLicenseKeys(productId, keys, productVariationId) {
    let inserted = 0;
    for (const key of keys) {
        const exists = await models_1.ProductLicensePoolModel.exists({ product_id: productId, license_key: key.trim() });
        if (exists)
            continue;
        await models_1.ProductLicensePoolModel.create({
            id: await (0, counter_1.nextId)('product_license_pools'),
            product_id: productId,
            product_variation_id: productVariationId,
            license_key: key.trim(),
            used_at: null,
            order_item_id: null,
            deleted_at: null,
        });
        inserted += 1;
    }
    return inserted;
}
async function countAvailableLicensesNoVariation(productId) {
    return models_1.ProductLicensePoolModel.countDocuments({
        product_id: productId,
        used_at: null,
        product_variation_id: null,
        deleted_at: null,
    });
}
async function countAvailableLicensesForVariation(productId, productVariationId) {
    return models_1.ProductLicensePoolModel.countDocuments({
        product_id: productId,
        product_variation_id: productVariationId,
        used_at: null,
        deleted_at: null,
    });
}
async function countSellableLicensesWithVariations(productId) {
    const variations = await models_1.ProductVariationModel.find({ product_id: productId, enabled: 1 }).select({ id: 1 }).lean();
    return models_1.ProductLicensePoolModel.countDocuments({
        product_id: productId,
        product_variation_id: { $in: variations.map((v) => Number(v.id)) },
        used_at: null,
        deleted_at: null,
    });
}
async function findLicensePoolByProductId(productId) {
    const rows = await models_1.ProductLicensePoolModel.find({ product_id: productId, deleted_at: null }).sort({ id: 1 }).lean();
    return rows.map(toLicenseRow);
}
async function findLicensePoolByProductIdPaged(productId, limit, offset, filters) {
    const query = { product_id: productId, deleted_at: null };
    if (filters?.status === 'available')
        query.used_at = null;
    if (filters?.status === 'used')
        query.used_at = { $ne: null };
    if (filters?.product_variation_id != null)
        query.product_variation_id = filters.product_variation_id;
    const rows = await models_1.ProductLicensePoolModel.find(query).sort({ id: -1 }).skip(offset).limit(limit).lean();
    return rows.map(toLicenseRow);
}
async function countLicensePoolByProductId(productId, filters) {
    const query = { product_id: productId, deleted_at: null };
    if (filters?.status === 'available')
        query.used_at = null;
    if (filters?.status === 'used')
        query.used_at = { $ne: null };
    if (filters?.product_variation_id != null)
        query.product_variation_id = filters.product_variation_id;
    return models_1.ProductLicensePoolModel.countDocuments(query);
}
async function findLicenseById(productId, licenseId) {
    const row = await models_1.ProductLicensePoolModel.findOne({ product_id: productId, id: licenseId, deleted_at: null }).lean();
    return row ? toLicenseRow(row) : null;
}
async function updateLicenseKey(productId, licenseId, fields) {
    const result = await models_1.ProductLicensePoolModel.updateOne({ product_id: productId, id: licenseId }, { $set: fields });
    return result.modifiedCount > 0;
}
async function assignUnassignedLicenseKeysToVariation(productId, productVariationId) {
    const result = await models_1.ProductLicensePoolModel.updateMany({ product_id: productId, product_variation_id: null, used_at: null }, { $set: { product_variation_id: productVariationId } });
    return result.modifiedCount;
}
async function deleteLicenseKey(productId, licenseId) {
    const result = await models_1.ProductLicensePoolModel.deleteOne({ product_id: productId, id: licenseId });
    return result.deletedCount > 0;
}
async function findLicensesByOrderId(orderId) {
    const items = await models_1.OrderItemModel.find({ order_id: orderId }).lean();
    const itemMap = new Map(items.map((i) => [Number(i.id), i]));
    const rows = await models_1.ProductLicensePoolModel.find({ order_item_id: { $in: [...itemMap.keys()] } }).lean();
    return rows.map((r) => ({
        order_item_id: Number(r.order_item_id),
        product_name: String(itemMap.get(Number(r.order_item_id))?.product_name ?? ''),
        license_key: String(r.license_key),
    }));
}
async function findAssignedLicensesForUser(userId) {
    const orders = await models_1.OrderModel.find({ user_id: userId }).lean();
    const orderIds = orders.map((o) => Number(o.id));
    const orderMap = new Map(orders.map((o) => [Number(o.id), o]));
    const items = await models_1.OrderItemModel.find({ order_id: { $in: orderIds } }).lean();
    const itemMap = new Map(items.map((i) => [Number(i.id), i]));
    const rows = await models_1.ProductLicensePoolModel.find({ order_item_id: { $in: [...itemMap.keys()] }, used_at: { $ne: null } })
        .sort({ used_at: -1 })
        .lean();
    return rows.map((r) => {
        const item = itemMap.get(Number(r.order_item_id));
        const order = orderMap.get(Number(item?.order_id));
        return {
            id: Number(r.id),
            order_id: Number(item?.order_id),
            order_number: String(order?.order_number ?? ''),
            order_item_id: Number(r.order_item_id),
            product_id: Number(item?.product_id),
            product_name: String(item?.product_name ?? ''),
            license_key: String(r.license_key),
            used_at: date(r.used_at),
        };
    });
}
async function assignLicenseKeysToOrderItem(_conn, productId, orderItemId, quantity, productVariationId) {
    const rows = await models_1.ProductLicensePoolModel.find({
        product_id: productId,
        product_variation_id: productVariationId,
        used_at: null,
        deleted_at: null,
    })
        .sort({ id: 1 })
        .limit(quantity)
        .lean();
    const ids = rows.map((r) => Number(r.id));
    if (ids.length === 0)
        return 0;
    await models_1.ProductLicensePoolModel.updateMany({ id: { $in: ids } }, { $set: { order_item_id: orderItemId, used_at: new Date() } });
    return ids.length;
}
//# sourceMappingURL=productRepository.js.map