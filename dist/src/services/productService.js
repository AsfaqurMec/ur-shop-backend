"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncLicenseVariationQuantitiesForProduct = syncLicenseVariationQuantitiesForProduct;
exports.create = create;
exports.update = update;
exports.setSizeChartImage = setSizeChartImage;
exports.remove = remove;
exports.setTrendingProducts = setTrendingProducts;
exports.list = list;
exports.getBySlug = getBySlug;
exports.getById = getById;
exports.replacePurchaseVariables = replacePurchaseVariables;
exports.addImage = addImage;
exports.removeImage = removeImage;
exports.addFile = addFile;
exports.removeFile = removeFile;
exports.addLicenseKeys = addLicenseKeys;
exports.getLicenseInventory = getLicenseInventory;
exports.listLicenseKeys = listLicenseKeys;
exports.updateLicenseKey = updateLicenseKey;
exports.deleteLicenseKey = deleteLicenseKey;
const fs_1 = __importDefault(require("fs"));
const errorHandler_1 = require("../middlewares/errorHandler");
const productRepo = __importStar(require("../repositories/productRepository"));
const categoryRepo = __importStar(require("../repositories/categoryRepository"));
const slugHelpers_1 = require("../utils/slugHelpers");
const upload_1 = require("../middlewares/upload");
const product_1 = require("../types/product");
const purchaseVariableRepo = __importStar(require("../repositories/productPurchaseVariableRepository"));
const purchaseSelectionService = __importStar(require("./purchaseSelectionService"));
const attrRepo = __importStar(require("../repositories/productAttributeRepository"));
const variationRepo = __importStar(require("../repositories/productVariationRepository"));
function parseFeatures(raw) {
    if (!raw)
        return [];
    if (Array.isArray(raw)) {
        return raw.filter((item) => typeof item === 'string').map((s) => s.trim()).filter(Boolean);
    }
    try {
        const parsed = JSON.parse(String(raw));
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter((item) => typeof item === 'string').map((s) => s.trim()).filter(Boolean);
    }
    catch {
        return [];
    }
}
/** Storefront stock badge: variation-scoped pools vs product-level pool. */
async function storefrontLicenseAvailableCount(productId) {
    const hasVar = (await variationRepo.countEnabledVariations(productId)) > 0;
    if (hasVar) {
        return productRepo.countSellableLicensesWithVariations(productId);
    }
    return productRepo.countAvailableLicensesNoVariation(productId);
}
async function normalizeLegacyVariationlessKeys(productId, targetVariationId) {
    const product = await productRepo.findProductById(productId);
    if (!product || product.product_type !== 'license_key')
        return;
    const vars = await variationRepo.findVariationsByProductId(productId);
    if (vars.length === 0)
        return;
    const chosen = targetVariationId ?? product.default_variation_id ?? vars[0]?.id;
    if (chosen == null)
        return;
    const moved = await productRepo.assignUnassignedLicenseKeysToVariation(productId, chosen);
    if (moved > 0) {
        await syncLicenseVariationQuantitiesForProduct(productId);
    }
}
/** Mirror each variation's `quantity` to unused license rows for that variation (license_key + variations). */
async function syncLicenseVariationQuantitiesForProduct(productId) {
    const product = await productRepo.findProductById(productId);
    if (!product || product.product_type !== 'license_key')
        return;
    const vars = await variationRepo.findVariationsByProductId(productId);
    if (vars.length === 0)
        return;
    for (const v of vars) {
        const n = await productRepo.countAvailableLicensesForVariation(productId, v.id);
        await variationRepo.setVariationQuantityAbsolute(v.id, n);
    }
}
/** Paths from scripts/seed-demo.js — basename `seed-<id>.png` has no real file on disk. */
function normalizeImagePathSlashes(p) {
    return p.replace(/\\/g, '/');
}
function isSeedPlaceholderImagePath(path) {
    const base = normalizeImagePathSlashes(path).split('/').pop() ?? '';
    return /^seed-\d+\.(png|jpe?g|gif|webp)$/i.test(base);
}
/**
 * First non–demo image by sort_order. If only demo rows exist, returns undefined (no thumbnail).
 */
function primaryProductImageRow(images) {
    if (images.length === 0)
        return undefined;
    const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    const real = sorted.find((img) => !isSeedPlaceholderImagePath(img.path));
    return real;
}
function primaryProductImagePath(images) {
    return primaryProductImageRow(images)?.path;
}
async function deleteAllProductImagesWithFiles(productId) {
    const imgs = await productRepo.findProductImagesByProductId(productId);
    for (const img of imgs) {
        try {
            const rel = img.path.replace(/\\/g, '/');
            if (!/^https?:\/\//i.test(rel)) {
                const abs = (0, upload_1.getProductFileAbsolutePath)(rel);
                if (fs_1.default.existsSync(abs))
                    fs_1.default.unlinkSync(abs);
            }
        }
        catch {
            /* ignore */
        }
    }
    await productRepo.deleteAllProductImagesByProductId(productId);
}
async function attachPurchaseVariables(productId, product, mode) {
    const defs = await purchaseVariableRepo.findVariablesWithOptionsByProductId(productId);
    if (defs.length === 0)
        return product;
    const list = mode === 'storefront'
        ? defs
            .filter((d) => d.enabled === 1)
            .map((d) => purchaseSelectionService.toStorefrontVariable(d))
        : defs.map((d) => purchaseSelectionService.toAdminVariable(d));
    return { ...product, purchase_variables: list };
}
async function attachCatalog(productId, product, mode) {
    const [attrs, vars] = await Promise.all([
        attrRepo.findAttributesWithValuesByProductId(productId),
        variationRepo.findVariationsByProductId(productId),
    ]);
    if (attrs.length === 0 && vars.length === 0)
        return product;
    const catalog_attributes = attrs.map((a) => ({
        attr_key: a.attr_key,
        name: a.name,
        kind: a.kind,
        visible_on_page: a.visible_on_page === 1,
        used_for_variations: a.used_for_variations === 1,
        sort_order: a.sort_order,
        values: a.values.map((v) => ({
            value_key: v.value_key,
            label: v.label,
            color_code: v.color_code ?? null,
            sort_order: v.sort_order,
        })),
    }));
    let vList = vars;
    if (mode === 'storefront') {
        vList = vList.filter((v) => v.enabled === 1);
    }
    const catalog_variations = vList.map((v) => ({
        id: v.id,
        sku: v.sku,
        quantity: v.quantity,
        price: Number(v.price),
        compare_at_price: v.compare_at_price != null ? Number(v.compare_at_price) : null,
        enabled: v.enabled === 1,
        sort_order: v.sort_order,
        combination: v.combination,
    }));
    return { ...product, catalog_attributes, catalog_variations };
}
/** Storefront: show default variation price/compare on the product (cards + PDP hero). */
function applyStorefrontDefaultVariationPricing(product) {
    if (!product.default_variation_id || !product.catalog_variations?.length)
        return product;
    const v = product.catalog_variations.find((row) => row.id === product.default_variation_id && row.enabled);
    if (!v)
        return product;
    return {
        ...product,
        price: Number(v.price),
        compare_at_price: v.compare_at_price != null ? Number(v.compare_at_price) : null,
    };
}
function toPublic(row, options) {
    return {
        id: row.id,
        category_id: row.category_id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        full_description: row.full_description,
        size_chart_image: row.size_chart_image,
        features: parseFeatures(row.features),
        product_type: row.product_type,
        manual_fulfillment_required: Boolean(row.manual_fulfillment_required),
        price: Number(row.price),
        compare_at_price: row.compare_at_price != null ? Number(row.compare_at_price) : null,
        sku: row.sku ?? null,
        quantity: row.quantity != null ? Number(row.quantity) : null,
        default_variation_id: row.default_variation_id ?? null,
        is_active: Boolean(row.is_active),
        is_featured: Boolean(row.is_featured),
        is_trending: Boolean(row.is_trending),
        trending_order: row.trending_order,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
        ...(options?.thumbnail !== undefined && { thumbnail: options.thumbnail }),
        ...(options?.images !== undefined && { images: options.images }),
        ...(options?.files !== undefined && { files: options.files }),
        ...(options?.license_available_count !== undefined && { license_available_count: options.license_available_count }),
    };
}
async function create(data) {
    if (!product_1.PRODUCT_TYPES.includes(data.product_type)) {
        throw new errorHandler_1.AppError(400, 'Invalid product_type');
    }
    let catName = '';
    if (data.category_id != null) {
        const cat = await categoryRepo.findById(data.category_id);
        if (!cat)
            throw new errorHandler_1.AppError(400, 'Category not found');
        catName = cat.name;
    }
    const baseSlug = data.slug?.trim() ? (0, slugHelpers_1.slugify)(data.slug) : (0, slugHelpers_1.slugify)(data.name);
    const slug = await (0, slugHelpers_1.uniqueSlug)(baseSlug, (s) => productRepo.productSlugExists(s));
    const defaultManualFulfillmentRequired = data.product_type === 'subscription_manual' || data.product_type === 'digital_service';
    let sku = data.sku?.trim() || null;
    if (!sku && data.category_id != null && catName) {
        const { ProductModel } = await Promise.resolve().then(() => __importStar(require('../database/models')));
        const catProductCount = await ProductModel.countDocuments({ category_id: data.category_id, deleted_at: null });
        const prefix = catName.trim().slice(0, 2).toLowerCase();
        sku = `${prefix}-${String(catProductCount + 1).padStart(2, '0')}`;
    }
    const id = await productRepo.createProduct({
        category_id: data.category_id ?? null,
        name: data.name.trim(),
        slug,
        sku,
        quantity: data.quantity != null ? Math.max(0, Math.floor(data.quantity)) : null,
        description: data.description?.trim() || null,
        full_description: data.full_description?.trim() || null,
        size_chart_image: null,
        features: Array.isArray(data.features)
            ? data.features.map((f) => String(f).trim()).filter(Boolean)
            : null,
        product_type: data.product_type,
        manual_fulfillment_required: data.manual_fulfillment_required != null
            ? (data.manual_fulfillment_required ? 1 : 0)
            : (defaultManualFulfillmentRequired ? 1 : 0),
        price: data.price,
        compare_at_price: data.compare_at_price ?? null,
        is_active: data.is_active !== false ? 1 : 0,
        is_featured: data.is_featured ? 1 : 0,
        is_trending: data.is_trending ? 1 : 0,
    });
    const row = await productRepo.findProductById(id);
    if (!row)
        throw new errorHandler_1.AppError(500, 'Failed to create product');
    return toPublic(row);
}
async function update(id, data) {
    const existing = await productRepo.findProductById(id);
    if (!existing)
        throw new errorHandler_1.AppError(404, 'Product not found');
    if (data.category_id !== undefined && data.category_id != null) {
        const cat = await categoryRepo.findById(data.category_id);
        if (!cat)
            throw new errorHandler_1.AppError(400, 'Category not found');
    }
    if (data.product_type !== undefined && !product_1.PRODUCT_TYPES.includes(data.product_type)) {
        throw new errorHandler_1.AppError(400, 'Invalid product_type');
    }
    if (data.default_variation_id !== undefined && data.default_variation_id != null) {
        const v = await variationRepo.findVariationById(data.default_variation_id);
        if (!v || v.product_id !== id)
            throw new errorHandler_1.AppError(400, 'Invalid default variation');
        if (!v.enabled)
            throw new errorHandler_1.AppError(400, 'Default variation must be enabled');
    }
    const updates = {};
    if (data.name !== undefined)
        updates.name = data.name.trim();
    if (data.description !== undefined)
        updates.description = data.description?.trim() || null;
    if (data.full_description !== undefined) {
        updates.full_description = data.full_description?.trim() || null;
    }
    if (data.size_chart_image !== undefined)
        updates.size_chart_image = data.size_chart_image?.trim() || null;
    if (data.features !== undefined) {
        updates.features = Array.isArray(data.features)
            ? data.features.map((f) => String(f).trim()).filter(Boolean)
            : null;
    }
    if (data.category_id !== undefined)
        updates.category_id = data.category_id;
    if (data.product_type !== undefined)
        updates.product_type = data.product_type;
    if (data.manual_fulfillment_required !== undefined) {
        updates.manual_fulfillment_required = data.manual_fulfillment_required ? 1 : 0;
    }
    if (data.price !== undefined)
        updates.price = data.price;
    if (data.compare_at_price !== undefined)
        updates.compare_at_price = data.compare_at_price;
    if (data.sku !== undefined) {
        const s = data.sku?.trim();
        updates.sku = s && s.length > 0 ? s : null;
    }
    if (data.quantity !== undefined) {
        if (data.quantity == null)
            updates.quantity = null;
        else
            updates.quantity = Math.max(0, Math.floor(data.quantity));
    }
    if (data.default_variation_id !== undefined)
        updates.default_variation_id = data.default_variation_id;
    if (data.is_active !== undefined)
        updates.is_active = data.is_active ? 1 : 0;
    if (data.is_featured !== undefined)
        updates.is_featured = data.is_featured ? 1 : 0;
    if (data.is_trending !== undefined)
        updates.is_trending = data.is_trending ? 1 : 0;
    if (data.slug !== undefined) {
        updates.slug = data.slug.trim() ? (0, slugHelpers_1.slugify)(data.slug) : (0, slugHelpers_1.slugify)(existing.name);
        updates.slug = await (0, slugHelpers_1.uniqueSlug)(updates.slug, (s) => productRepo.productSlugExists(s, id));
    }
    else if (data.name !== undefined && data.name.trim() !== existing.name) {
        const baseSlug = (0, slugHelpers_1.slugify)(data.name);
        updates.slug = await (0, slugHelpers_1.uniqueSlug)(baseSlug, (s) => productRepo.productSlugExists(s, id));
    }
    if (Object.keys(updates).length > 0) {
        await productRepo.updateProduct(id, updates);
    }
    return getById(id);
}
/** Stores a single optional size-chart image path alongside the product. */
async function setSizeChartImage(id, path) {
    const existing = await productRepo.findProductById(id);
    if (!existing)
        throw new errorHandler_1.AppError(404, 'Product not found');
    const nextPath = path ? (/^https?:\/\//i.test(path) ? path : (0, upload_1.getProductImageRelativePath)(path)) : null;
    if (existing.size_chart_image && existing.size_chart_image !== nextPath && !/^https?:\/\//i.test(existing.size_chart_image)) {
        try {
            const previousFile = (0, upload_1.getProductFileAbsolutePath)(existing.size_chart_image);
            if (fs_1.default.existsSync(previousFile))
                fs_1.default.unlinkSync(previousFile);
        }
        catch {
            // The replacement should still succeed if an old local file was already removed.
        }
    }
    await productRepo.updateProduct(id, { size_chart_image: nextPath });
    return getById(id);
}
async function remove(id) {
    const existed = await productRepo.softDeleteProduct(id);
    if (!existed)
        throw new errorHandler_1.AppError(404, 'Product not found');
}
async function setTrendingProducts(productIds) {
    const ids = (productIds || []).map(Number).filter((n) => Number.isFinite(n) && n > 0);
    const { ProductModel } = await Promise.resolve().then(() => __importStar(require('../database/models')));
    await ProductModel.updateMany({ deleted_at: null }, { $set: { is_trending: 0, trending_order: 0 } });
    for (let i = 0; i < ids.length; i++) {
        await ProductModel.updateOne({ id: ids[i], deleted_at: null }, { $set: { is_trending: 1, trending_order: i + 1 } });
    }
}
async function list(query) {
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));
    const offset = (page - 1) * limit;
    const filters = {
        ...(query.category_id != null && { category_id: query.category_id }),
        ...(query.product_type && { product_type: query.product_type }),
        ...(query.min_price != null && { min_price: query.min_price }),
        ...(query.max_price != null && { max_price: query.max_price }),
        ...(query.on_sale === true && { on_sale: true }),
        ...(query.search && { search: query.search }),
        ...(query.featured === true && { featured: true }),
        ...(query.trending === true && { trending: true }),
        is_active: query.is_active !== undefined ? query.is_active : true,
        ...(query.sort && { sort: query.sort }),
    };
    const [products, total] = await Promise.all([
        productRepo.findProducts(filters, limit, offset),
        productRepo.countProducts(filters),
    ]);
    const totalPages = Math.ceil(total / limit) || 1;
    const [imagesByProduct, allCategories, variationsByProduct] = await Promise.all([
        Promise.all(products.map((p) => productRepo.findProductImagesByProductId(p.id))),
        categoryRepo.findAll(),
        Promise.all(products.map((p) => variationRepo.findVariationsByProductId(p.id))),
    ]);
    const catMap = new Map(allCategories.map((c) => [c.id, c.name]));
    const publicList = products.map((p, i) => {
        const images = imagesByProduct[i];
        const primary = primaryProductImageRow(images);
        const thumbnail = primaryProductImagePath(images);
        const imagesPublic = primary
            ? [
                {
                    id: primary.id,
                    path: primary.path,
                    alt_text: primary.alt_text,
                    sort_order: primary.sort_order,
                },
            ]
            : undefined;
        return toPublic(p, { thumbnail, images: imagesPublic });
    });
    const [needsMap, defaultPriceMap] = await Promise.all([
        productRepo.getNeedsPdpConfigMap(publicList.map((p) => p.id)),
        productRepo.findDefaultVariationStorefrontPricing(publicList.map((p) => p.id)),
    ]);
    const withFlags = publicList.map((p, idx) => {
        const o = defaultPriceMap.get(p.id);
        const vars = variationsByProduct[idx] || [];
        const catalog_variations = vars.map((v) => ({
            id: v.id,
            sku: v.sku,
            quantity: v.quantity,
            price: Number(v.price),
            compare_at_price: v.compare_at_price != null ? Number(v.compare_at_price) : null,
            enabled: v.enabled === 1,
            sort_order: v.sort_order,
            combination: v.combination,
        }));
        const category_name = p.category_id ? catMap.get(p.category_id) || null : null;
        const base = {
            ...p,
            category_name,
            catalog_variations,
            needs_pdp_config: needsMap.get(p.id) ?? false,
        };
        if (!o)
            return base;
        return { ...base, price: o.price, compare_at_price: o.compare_at_price };
    });
    return {
        products: withFlags,
        total,
        page,
        limit,
        totalPages,
    };
}
async function getBySlug(slug, forPublic = true) {
    const row = await productRepo.findProductBySlug(slug);
    if (!row)
        throw new errorHandler_1.AppError(404, 'Product not found');
    if (forPublic && !row.is_active)
        throw new errorHandler_1.AppError(404, 'Product not found');
    const [images, files, licenseCount] = await Promise.all([
        productRepo.findProductImagesByProductId(row.id),
        productRepo.findProductFilesByProductId(row.id),
        row.product_type === 'license_key' ? storefrontLicenseAvailableCount(row.id) : Promise.resolve(0),
    ]);
    const thumbnail = primaryProductImagePath(images);
    const imagePublic = images.map((img) => ({
        id: img.id,
        path: img.path,
        alt_text: img.alt_text,
        sort_order: img.sort_order,
    }));
    const filePublic = files.map((f) => ({
        id: f.id,
        file_name: f.file_name,
        file_size: f.file_size,
        download_limit: f.download_limit,
        sort_order: f.sort_order,
    }));
    const base = toPublic(row, {
        thumbnail,
        images: imagePublic,
        files: filePublic,
        license_available_count: row.product_type === 'license_key' ? licenseCount : undefined,
    });
    const withVars = await attachPurchaseVariables(row.id, base, 'storefront');
    const needsMap = await productRepo.getNeedsPdpConfigMap([row.id]);
    const withCatalog = await attachCatalog(row.id, withVars, 'storefront');
    const storefrontPriced = applyStorefrontDefaultVariationPricing(withCatalog);
    return { ...storefrontPriced, needs_pdp_config: needsMap.get(row.id) ?? false };
}
async function getById(id) {
    const row = await productRepo.findProductById(id);
    if (!row)
        throw new errorHandler_1.AppError(404, 'Product not found');
    const [images, files, licenseCount] = await Promise.all([
        productRepo.findProductImagesByProductId(row.id),
        productRepo.findProductFilesByProductId(row.id),
        row.product_type === 'license_key' ? storefrontLicenseAvailableCount(row.id) : Promise.resolve(0),
    ]);
    const thumbnail = primaryProductImagePath(images);
    const imagePublic = images.map((img) => ({
        id: img.id,
        path: img.path,
        alt_text: img.alt_text,
        sort_order: img.sort_order,
    }));
    const filePublic = files.map((f) => ({
        id: f.id,
        file_name: f.file_name,
        file_size: f.file_size,
        download_limit: f.download_limit,
        sort_order: f.sort_order,
    }));
    const base = toPublic(row, {
        thumbnail,
        images: imagePublic,
        files: filePublic,
        license_available_count: row.product_type === 'license_key' ? licenseCount : undefined,
    });
    const withPv = await attachPurchaseVariables(row.id, base, 'admin');
    return attachCatalog(row.id, withPv, 'admin');
}
async function replacePurchaseVariables(productId, variables) {
    const existing = await productRepo.findProductById(productId);
    if (!existing)
        throw new errorHandler_1.AppError(404, 'Product not found');
    const trimmedVars = variables.map((v) => ({
        ...v,
        var_key: v.var_key.trim(),
        label: v.label.trim(),
        options: v.options.map((o) => ({
            ...o,
            option_key: o.option_key.trim(),
            label: o.label.trim(),
        })),
    }));
    const keySet = new Set(trimmedVars.map((v) => v.var_key.toLowerCase()));
    if (keySet.size !== trimmedVars.length) {
        throw new errorHandler_1.AppError(400, 'Duplicate variable keys');
    }
    for (const v of trimmedVars) {
        if (!v.var_key || !v.label) {
            throw new errorHandler_1.AppError(400, 'Each variable needs a key and label');
        }
        if (!/^[a-z][a-z0-9_]{0,63}$/i.test(v.var_key)) {
            throw new errorHandler_1.AppError(400, `Invalid variable key: ${v.var_key}`);
        }
        if (v.kind === 'select') {
            if (!v.options?.length)
                throw new errorHandler_1.AppError(400, `Select variable "${v.label}" needs at least one option`);
            for (const o of v.options) {
                if (!o.option_key || !o.label) {
                    throw new errorHandler_1.AppError(400, `Each option for "${v.label}" needs a key and label`);
                }
                if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(o.option_key)) {
                    throw new errorHandler_1.AppError(400, `Invalid option key: ${o.option_key}`);
                }
            }
        }
        else if (v.options?.length) {
            throw new errorHandler_1.AppError(400, 'Email variables cannot have options');
        }
    }
    await purchaseVariableRepo.replaceVariablesForProduct(null, productId, trimmedVars);
    return getById(productId);
}
async function addImage(productId, filenameOrUrl, altText, sortOrder) {
    const product = await productRepo.findProductById(productId);
    if (!product)
        throw new errorHandler_1.AppError(404, 'Product not found');
    const existing = await productRepo.findProductImagesByProductId(productId);
    const maxOrder = existing.length ? Math.max(...existing.map((i) => i.sort_order)) : -1;
    const imagePath = /^https?:\/\//i.test(filenameOrUrl)
        ? filenameOrUrl
        : (0, upload_1.getProductImageRelativePath)(filenameOrUrl);
    const id = await productRepo.createProductImage({
        product_id: productId,
        path: imagePath,
        alt_text: altText ?? null,
        sort_order: sortOrder ?? maxOrder + 1,
    });
    const images = await productRepo.findProductImagesByProductId(productId);
    const img = images.find((i) => i.id === id);
    if (!img)
        throw new errorHandler_1.AppError(500, 'Failed to create image');
    return { id: img.id, path: img.path, alt_text: img.alt_text, sort_order: img.sort_order };
}
async function removeImage(productId, imageId) {
    const imgs = await productRepo.findProductImagesByProductId(productId);
    const row = imgs.find((i) => i.id === imageId);
    if (!row)
        throw new errorHandler_1.AppError(404, 'Image not found');
    try {
        const rel = row.path.replace(/\\/g, '/');
        if (!/^https?:\/\//i.test(rel)) {
            const abs = (0, upload_1.getProductFileAbsolutePath)(rel);
            if (fs_1.default.existsSync(abs))
                fs_1.default.unlinkSync(abs);
        }
    }
    catch {
        /* ignore */
    }
    const deleted = await productRepo.deleteProductImage(imageId, productId);
    if (!deleted)
        throw new errorHandler_1.AppError(404, 'Image not found');
}
async function addFile(productId, filename, displayName, fileSize, downloadLimit, sortOrder) {
    const product = await productRepo.findProductById(productId);
    if (!product)
        throw new errorHandler_1.AppError(404, 'Product not found');
    const filePath = (0, upload_1.getProductFileRelativePath)(filename);
    const files = await productRepo.findProductFilesByProductId(productId);
    const maxOrder = files.length ? Math.max(...files.map((f) => f.sort_order)) : 0;
    const id = await productRepo.createProductFile({
        product_id: productId,
        file_path: filePath,
        file_name: displayName.trim() || filename,
        file_size: fileSize ?? null,
        download_limit: downloadLimit ?? null,
        sort_order: sortOrder ?? maxOrder + 1,
    });
    const updated = await productRepo.findProductFilesByProductId(productId);
    const file = updated.find((f) => f.id === id);
    if (!file)
        throw new errorHandler_1.AppError(500, 'Failed to create file');
    return {
        id: file.id,
        file_name: file.file_name,
        file_size: file.file_size,
        download_limit: file.download_limit,
        sort_order: file.sort_order,
    };
}
async function removeFile(productId, fileId) {
    const deleted = await productRepo.deleteProductFile(fileId, productId);
    if (!deleted)
        throw new errorHandler_1.AppError(404, 'File not found');
}
async function addLicenseKeys(productId, keys, productVariationId) {
    const product = await productRepo.findProductById(productId);
    if (!product)
        throw new errorHandler_1.AppError(404, 'Product not found');
    if (product.product_type !== 'license_key') {
        throw new errorHandler_1.AppError(400, 'Product is not a license_key product');
    }
    const trimmed = keys.map((k) => k.trim()).filter(Boolean);
    const hasVariations = (await variationRepo.countEnabledVariations(productId)) > 0;
    let poolVariationId = null;
    if (hasVariations) {
        const vid = productVariationId != null && Number.isFinite(Number(productVariationId))
            ? Math.trunc(Number(productVariationId))
            : null;
        if (vid == null || vid < 1) {
            throw new errorHandler_1.AppError(400, 'product_variation_id is required when this product has variations');
        }
        const v = await variationRepo.findVariationById(vid);
        if (!v || v.product_id !== productId)
            throw new errorHandler_1.AppError(400, 'Invalid product variation');
        if (!v.enabled)
            throw new errorHandler_1.AppError(400, 'Cannot add keys to a disabled variation');
        poolVariationId = vid;
        // Repair legacy rows that were inserted before variation mapping existed.
        await normalizeLegacyVariationlessKeys(productId, poolVariationId);
    }
    else if (productVariationId != null && Number(productVariationId) >= 1) {
        throw new errorHandler_1.AppError(400, 'product_variation_id must not be set when this product has no variations');
    }
    const added = await productRepo.createLicenseKeys(productId, trimmed, poolVariationId);
    if (hasVariations) {
        await syncLicenseVariationQuantitiesForProduct(productId);
    }
    return { added };
}
async function getLicenseInventory(productId) {
    const product = await productRepo.findProductById(productId);
    if (!product)
        throw new errorHandler_1.AppError(404, 'Product not found');
    await normalizeLegacyVariationlessKeys(productId);
    const pool = await productRepo.findLicensePoolByProductId(productId);
    const hasVariations = (await variationRepo.countEnabledVariations(productId)) > 0;
    const available = hasVariations
        ? await productRepo.countSellableLicensesWithVariations(productId)
        : pool.filter((p) => !p.used_at && p.product_variation_id == null).length;
    return { total: pool.length, available };
}
async function listLicenseKeys(productId, params) {
    const product = await productRepo.findProductById(productId);
    if (!product)
        throw new errorHandler_1.AppError(404, 'Product not found');
    if (product.product_type !== 'license_key') {
        throw new errorHandler_1.AppError(400, 'Product is not a license_key product');
    }
    await normalizeLegacyVariationlessKeys(productId);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const offset = Math.max(0, params.offset ?? 0);
    const status = params.status ?? 'all';
    const filters = { status };
    if (params.product_variation_id != null && Number.isFinite(Number(params.product_variation_id))) {
        filters.product_variation_id = Math.trunc(Number(params.product_variation_id));
    }
    const [rows, total] = await Promise.all([
        productRepo.findLicensePoolByProductIdPaged(productId, limit, offset, filters),
        productRepo.countLicensePoolByProductId(productId, filters),
    ]);
    return {
        keys: rows.map((row) => ({
            id: row.id,
            product_variation_id: row.product_variation_id,
            license_key: row.license_key,
            used_at: row.used_at ? row.used_at.toISOString() : null,
            order_item_id: row.order_item_id,
            created_at: row.created_at.toISOString(),
            is_available: row.used_at == null,
        })),
        total,
    };
}
async function updateLicenseKey(productId, licenseId, nextKey, nextVariationId) {
    const product = await productRepo.findProductById(productId);
    if (!product)
        throw new errorHandler_1.AppError(404, 'Product not found');
    if (product.product_type !== 'license_key') {
        throw new errorHandler_1.AppError(400, 'Product is not a license_key product');
    }
    const existing = await productRepo.findLicenseById(productId, licenseId);
    if (!existing)
        throw new errorHandler_1.AppError(404, 'License key not found');
    if (existing.used_at != null) {
        throw new errorHandler_1.AppError(400, 'Used license keys cannot be updated');
    }
    const hasVariations = (await variationRepo.countEnabledVariations(productId)) > 0;
    let targetVariationId = undefined;
    if (nextVariationId !== undefined) {
        if (hasVariations) {
            const vid = nextVariationId != null && Number.isFinite(Number(nextVariationId))
                ? Math.trunc(Number(nextVariationId))
                : null;
            if (vid == null || vid < 1) {
                throw new errorHandler_1.AppError(400, 'product_variation_id must be a valid variation when this product has variations');
            }
            const v = await variationRepo.findVariationById(vid);
            if (!v || v.product_id !== productId)
                throw new errorHandler_1.AppError(400, 'Invalid product variation');
            if (!v.enabled)
                throw new errorHandler_1.AppError(400, 'Cannot assign keys to a disabled variation');
            targetVariationId = vid;
        }
        else if (nextVariationId != null) {
            throw new errorHandler_1.AppError(400, 'product_variation_id must not be set when this product has no variations');
        }
        else {
            targetVariationId = null;
        }
    }
    const fields = {
        license_key: nextKey.trim(),
    };
    if (targetVariationId !== undefined) {
        fields.product_variation_id = targetVariationId;
    }
    try {
        await productRepo.updateLicenseKey(productId, licenseId, fields);
    }
    catch {
        throw new errorHandler_1.AppError(409, 'License key already exists for this product');
    }
    const updated = await productRepo.findLicenseById(productId, licenseId);
    if (!updated)
        throw new errorHandler_1.AppError(500, 'Failed to update license key');
    if (hasVariations) {
        await syncLicenseVariationQuantitiesForProduct(productId);
    }
    return {
        id: updated.id,
        product_variation_id: updated.product_variation_id,
        license_key: updated.license_key,
        used_at: updated.used_at ? updated.used_at.toISOString() : null,
        order_item_id: updated.order_item_id,
        created_at: updated.created_at.toISOString(),
        is_available: updated.used_at == null,
    };
}
async function deleteLicenseKey(productId, licenseId) {
    const product = await productRepo.findProductById(productId);
    if (!product)
        throw new errorHandler_1.AppError(404, 'Product not found');
    if (product.product_type !== 'license_key') {
        throw new errorHandler_1.AppError(400, 'Product is not a license_key product');
    }
    const existing = await productRepo.findLicenseById(productId, licenseId);
    if (!existing)
        throw new errorHandler_1.AppError(404, 'License key not found');
    if (existing.used_at != null) {
        throw new errorHandler_1.AppError(400, 'Used license keys cannot be deleted');
    }
    await productRepo.deleteLicenseKey(productId, licenseId);
    if ((await variationRepo.countEnabledVariations(productId)) > 0) {
        await syncLicenseVariationQuantitiesForProduct(productId);
    }
}
//# sourceMappingURL=productService.js.map