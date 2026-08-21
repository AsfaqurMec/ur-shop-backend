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
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceCatalogAttributes = replaceCatalogAttributes;
exports.replaceCatalogVariations = replaceCatalogVariations;
exports.generateCatalogVariations = generateCatalogVariations;
const errorHandler_1 = require("../middlewares/errorHandler");
const attrRepo = __importStar(require("../repositories/productAttributeRepository"));
const variationRepo = __importStar(require("../repositories/productVariationRepository"));
const productRepo = __importStar(require("../repositories/productRepository"));
const combinationSignature_1 = require("../utils/combinationSignature");
const ATTR_KEY_RE = /^[a-z][a-z0-9_]{0,63}$/i;
const VALUE_KEY_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
function cartesian(dims) {
    if (dims.length === 0)
        return [];
    function rec(i, acc) {
        if (i >= dims.length)
            return [acc];
        const out = [];
        for (const vk of dims[i].values) {
            out.push(...rec(i + 1, { ...acc, [dims[i].key]: vk }));
        }
        return out;
    }
    return rec(0, {});
}
/** Build variation dimensions from the same payload used to save attributes (no extra DB read in-txn). */
function buildVariationDimsFromInputs(inputs) {
    return inputs
        .filter((a) => a.used_for_variations && a.kind === 'select' && a.values.length > 0)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((a) => ({
        key: a.attr_key,
        values: a.values
            .slice()
            .sort((x, y) => x.sort_order - y.sort_order)
            .map((v) => v.value_key),
    }));
}
async function insertAllVariationCombinationsForInputs(productId, inputs, basePrice) {
    const dims = buildVariationDimsFromInputs(inputs);
    if (dims.length === 0)
        return 0;
    const combos = cartesian(dims);
    return variationRepo.insertGeneratedCombinations(null, productId, combos, basePrice);
}
function parseAttributesFromBody(raw) {
    if (!Array.isArray(raw))
        throw new errorHandler_1.AppError(400, 'attributes must be an array');
    return raw.map((item, idx) => {
        const attr_key = String(item.attr_key ?? '').trim();
        const name = String(item.name ?? '').trim();
        const kind = (item.kind === 'text' ? 'text' : item.kind === 'email' ? 'email' : 'select');
        if (!ATTR_KEY_RE.test(attr_key))
            throw new errorHandler_1.AppError(400, `Invalid attr_key at index ${idx}`);
        if (!name)
            throw new errorHandler_1.AppError(400, `Attribute name required at index ${idx}`);
        const visible_on_page = item.visible_on_page !== false;
        const used_for_variations = Boolean(item.used_for_variations);
        if (used_for_variations && kind !== 'select') {
            throw new errorHandler_1.AppError(400, `Only select attributes can be used for variations (${attr_key})`);
        }
        const valuesRaw = Array.isArray(item.values) ? item.values : [];
        const values = valuesRaw.map((v, j) => {
            const value_key = String(v.value_key ?? '').trim();
            const label = String(v.label ?? '').trim();
            const color_code = v.color_code != null && typeof v.color_code === 'string' && v.color_code.trim()
                ? v.color_code.trim()
                : null;
            if (!VALUE_KEY_RE.test(value_key))
                throw new errorHandler_1.AppError(400, `Invalid value_key at ${attr_key}[${j}]`);
            if (!label)
                throw new errorHandler_1.AppError(400, `Value label required at ${attr_key}[${j}]`);
            return {
                value_key,
                label,
                color_code,
                sort_order: typeof v.sort_order === 'number' ? v.sort_order : j,
            };
        });
        if (kind === 'select' && used_for_variations && values.length === 0) {
            throw new errorHandler_1.AppError(400, `Variation attribute "${name}" needs at least one value`);
        }
        if (kind !== 'select' && values.length > 0) {
            throw new errorHandler_1.AppError(400, `Text/email attribute "${name}" cannot have preset values`);
        }
        return {
            attr_key,
            name,
            kind,
            visible_on_page,
            used_for_variations,
            sort_order: typeof item.sort_order === 'number' ? item.sort_order : idx,
            values,
        };
    });
}
function parseVariationsFromBody(raw) {
    if (!Array.isArray(raw))
        throw new errorHandler_1.AppError(400, 'variations must be an array');
    return raw.map((item, idx) => {
        const comboRaw = item.combination;
        if (!comboRaw || typeof comboRaw !== 'object' || Array.isArray(comboRaw)) {
            throw new errorHandler_1.AppError(400, `variation[${idx}] needs a combination object`);
        }
        const combination = {};
        for (const [k, v] of Object.entries(comboRaw)) {
            if (typeof v === 'string' && v.trim())
                combination[k] = v.trim();
        }
        const price = Number(item.price ?? 0);
        if (!Number.isFinite(price) || price < 0)
            throw new errorHandler_1.AppError(400, `Invalid price at variation ${idx}`);
        const cap = item.compare_at_price != null && item.compare_at_price !== ''
            ? Number(item.compare_at_price)
            : null;
        if (cap != null && (!Number.isFinite(cap) || cap < 0)) {
            throw new errorHandler_1.AppError(400, `Invalid compare_at_price at variation ${idx}`);
        }
        const sku = item.sku != null && String(item.sku).trim() !== '' ? String(item.sku).trim() : null;
        const quantity = item.quantity == null || item.quantity === '' ? null : Math.max(0, Math.floor(Number(item.quantity)));
        if (quantity != null && !Number.isFinite(quantity)) {
            throw new errorHandler_1.AppError(400, `Invalid quantity at variation ${idx}`);
        }
        return {
            combination,
            sku,
            quantity,
            price,
            compare_at_price: cap,
            enabled: item.enabled !== false,
            sort_order: typeof item.sort_order === 'number' ? item.sort_order : idx,
        };
    });
}
async function assertVariationsMatchAttributes(productId, variations) {
    const attrs = await attrRepo.findAttributesWithValuesByProductId(productId);
    const varAttrKeys = new Set(attrs.filter((a) => a.used_for_variations && a.kind === 'select').map((a) => a.attr_key));
    if (varAttrKeys.size === 0) {
        if (variations.length > 0) {
            throw new errorHandler_1.AppError(400, 'Define variation attributes before saving variations');
        }
        return;
    }
    const sigs = new Set();
    for (let i = 0; i < variations.length; i += 1) {
        const v = variations[i];
        const keys = new Set(Object.keys(v.combination));
        if (keys.size !== varAttrKeys.size || [...varAttrKeys].some((k) => !keys.has(k))) {
            throw new errorHandler_1.AppError(400, `Variation ${i + 1} must include every variation attribute`);
        }
        for (const [ak, vk] of Object.entries(v.combination)) {
            const a = attrs.find((x) => x.attr_key === ak);
            if (!a || !a.values.some((val) => val.value_key === vk)) {
                throw new errorHandler_1.AppError(400, `Invalid combination for variation ${i + 1}`);
            }
        }
        const sig = (0, combinationSignature_1.combinationSignature)(v.combination);
        if (sigs.has(sig))
            throw new errorHandler_1.AppError(400, 'Duplicate variation combination');
        sigs.add(sig);
    }
}
async function replaceCatalogAttributes(productId, body) {
    const existing = await productRepo.findProductById(productId);
    if (!existing)
        throw new errorHandler_1.AppError(404, 'Product not found');
    const list = parseAttributesFromBody(body.attributes ?? []);
    await variationRepo.deleteAllForProduct(null, productId);
    await attrRepo.replaceAttributesForProduct(null, productId, list);
    await insertAllVariationCombinationsForInputs(productId, list, Number(existing.price));
}
async function replaceCatalogVariations(productId, body) {
    const existing = await productRepo.findProductById(productId);
    if (!existing)
        throw new errorHandler_1.AppError(404, 'Product not found');
    const list = parseVariationsFromBody(body.variations ?? []);
    await assertVariationsMatchAttributes(productId, list);
    let previousDefaultSignature = null;
    if (existing.default_variation_id != null) {
        const previousDefault = await variationRepo.findVariationById(existing.default_variation_id);
        if (previousDefault && previousDefault.product_id === productId) {
            previousDefaultSignature = previousDefault.combination_signature;
        }
    }
    await variationRepo.replaceVariationsForProduct(null, productId, list);
    if (previousDefaultSignature == null)
        return;
    const nextVariations = await variationRepo.findVariationsByProductId(productId);
    const restoredDefault = nextVariations.find((row) => row.combination_signature === previousDefaultSignature && row.enabled === 1);
    await productRepo.updateProduct(productId, {
        default_variation_id: restoredDefault?.id ?? null,
    });
}
async function generateCatalogVariations(productId) {
    const product = await productRepo.findProductById(productId);
    if (!product)
        throw new errorHandler_1.AppError(404, 'Product not found');
    const attrs = await attrRepo.findAttributesWithValuesByProductId(productId);
    const dims = attrs
        .filter((a) => a.used_for_variations && a.kind === 'select' && a.values.length > 0)
        .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
        .map((a) => ({
        key: a.attr_key,
        values: a.values
            .slice()
            .sort((x, y) => x.sort_order - y.sort_order || x.id - y.id)
            .map((v) => v.value_key),
    }));
    if (dims.length === 0)
        return { added: 0 };
    const combos = cartesian(dims);
    const added = await variationRepo.insertGeneratedCombinations(null, productId, combos, Number(product.price));
    return { added };
}
//# sourceMappingURL=productCatalogService.js.map