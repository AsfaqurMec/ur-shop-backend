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
exports.canonicalSelectionObject = canonicalSelectionObject;
exports.selectionsSignature = selectionsSignature;
exports.resolveLinePricing = resolveLinePricing;
exports.toStorefrontVariable = toStorefrontVariable;
exports.toAdminVariable = toAdminVariable;
const errorHandler_1 = require("../middlewares/errorHandler");
const pvRepo = __importStar(require("../repositories/productPurchaseVariableRepository"));
const variationRepo = __importStar(require("../repositories/productVariationRepository"));
const attrRepo = __importStar(require("../repositories/productAttributeRepository"));
const productRepo = __importStar(require("../repositories/productRepository"));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Stable key order for storing selections and matching cart lines. */
function canonicalSelectionObject(raw) {
    if (raw == null)
        return {};
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return canonicalSelectionObject(parsed);
            }
        }
        catch {
            return {};
        }
        return {};
    }
    if (typeof raw !== 'object' || Array.isArray(raw))
        return {};
    const out = {};
    for (const key of Object.keys(raw).sort()) {
        const v = raw[key];
        if (v == null)
            continue;
        const s = typeof v === 'string' ? v.trim() : String(v).trim();
        if (s.length > 0)
            out[key] = s;
    }
    return out;
}
function selectionsSignature(sel) {
    return JSON.stringify(canonicalSelectionObject(sel));
}
/** Read selection value allowing case-insensitive key match (client / JSON quirks). */
function pickSelectionString(map, key) {
    if (map[key] != null && String(map[key]).trim() !== '')
        return String(map[key]).trim();
    const lk = key.toLowerCase();
    const found = Object.keys(map).find((k) => k.toLowerCase() === lk);
    return found != null && String(map[found]).trim() !== '' ? String(map[found]).trim() : '';
}
function isUsedForVariations(a) {
    const n = Number(a.used_for_variations);
    if (Number.isFinite(n))
        return n === 1;
    if (typeof a.used_for_variations === 'boolean')
        return a.used_for_variations;
    if (typeof a.used_for_variations === 'string') {
        const s = a.used_for_variations.trim().toLowerCase();
        return s === '1' || s === 'true';
    }
    return false;
}
function enabledDefinitions(vars) {
    return vars.filter((v) => v.enabled === 1).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}
/** When the client omits variation_id, pick a stable enabled row (matches storefront defaults). */
async function inferFallbackVariationId(productId) {
    const vars = await variationRepo.findVariationsByProductId(productId);
    const enabled = vars.filter((v) => v.enabled === 1);
    if (enabled.length === 0)
        return null;
    if (enabled.length === 1)
        return enabled[0].id;
    const product = await productRepo.findProductById(productId);
    const defId = product?.default_variation_id ?? null;
    if (defId != null) {
        const row = enabled.find((v) => v.id === defId);
        if (row)
            return row.id;
    }
    enabled.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    return enabled[0].id;
}
function normalizeVariationId(v) {
    if (v == null || v === '')
        return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 1)
        return null;
    return Math.trunc(n);
}
async function buildVariationChoiceSummary(productId, combination, variationSku) {
    const attrs = await attrRepo.findAttributesWithValuesByProductId(productId);
    const byKey = new Map(attrs.map((a) => [a.attr_key, a]));
    const lines = [];
    for (const k of Object.keys(combination).sort()) {
        const a = byKey.get(k);
        const vk = combination[k];
        const val = a?.values.find((v) => v.value_key === vk);
        lines.push({
            label: a?.name ?? k,
            value: val?.label ?? vk,
        });
    }
    if (variationSku?.trim()) {
        lines.push({ label: 'SKU', value: variationSku.trim() });
    }
    return lines;
}
/** Email/text catalog attributes not used for variations. */
async function resolveExtraCatalogFields(productId, normalized, opts) {
    const requireAll = opts?.requireAllExtras === true;
    const attrs = await attrRepo.findAttributesWithValuesByProductId(productId);
    const out = {};
    const extraSummary = [];
    for (const a of attrs.sort((x, y) => x.sort_order - y.sort_order || x.id - y.id)) {
        if (isUsedForVariations(a))
            continue;
        if (a.kind !== 'email' && a.kind !== 'text')
            continue;
        const attrKey = String(a.attr_key).trim();
        const trimmed = pickSelectionString(normalized, attrKey);
        if (!trimmed) {
            if (requireAll)
                throw new errorHandler_1.AppError(400, `${a.name} is required`);
            continue;
        }
        if (a.kind === 'email' && !EMAIL_RE.test(trimmed)) {
            throw new errorHandler_1.AppError(400, `Invalid email for ${a.name}`);
        }
        out[attrKey] = trimmed;
        extraSummary.push({ label: a.name, value: trimmed });
    }
    return { out, extraSummary };
}
async function resolveWithVariation(productId, basePrice, rawSelections, variationId) {
    const row = await variationRepo.findVariationById(variationId);
    if (!row || row.product_id !== productId) {
        throw new errorHandler_1.AppError(400, 'Invalid product option');
    }
    if (!row.enabled) {
        throw new errorHandler_1.AppError(400, 'This product option is not available');
    }
    const normalized = canonicalSelectionObject(rawSelections);
    const { out: extras, extraSummary } = await resolveExtraCatalogFields(productId, normalized, {
        requireAllExtras: true,
    });
    const choiceSummary = await buildVariationChoiceSummary(productId, row.combination, row.sku);
    const unit = roundMoney(Number(row.price));
    return {
        unit_price: unit,
        normalized_selections: canonicalSelectionObject(extras),
        summary: [...choiceSummary, ...extraSummary],
    };
}
/**
 * Validates selections and computes unit price (variation price, or base + purchase-variable adjustments).
 */
async function resolveLinePricing(productId, basePrice, rawSelections, variationId) {
    const enabledVariations = await variationRepo.countEnabledVariations(productId);
    if (enabledVariations > 0) {
        let vid = normalizeVariationId(variationId);
        if (vid == null) {
            vid = await inferFallbackVariationId(productId);
        }
        if (vid == null) {
            throw new errorHandler_1.AppError(400, 'Please choose product options before adding to cart');
        }
        const resolved = await resolveWithVariation(productId, basePrice, rawSelections, vid);
        return { ...resolved, effective_variation_id: vid };
    }
    const allVars = await pvRepo.findVariablesWithOptionsByProductId(productId);
    const active = enabledDefinitions(allVars);
    const normalized = canonicalSelectionObject(rawSelections);
    if (active.length === 0) {
        const extra = await resolveExtraCatalogFields(productId, normalized);
        const normKeys = Object.keys(normalized);
        if (normKeys.length > 0) {
            const consumed = new Set(Object.keys(extra.out));
            const leftover = normKeys.filter((k) => !consumed.has(k));
            if (leftover.length > 0) {
                throw new errorHandler_1.AppError(400, 'This product has no purchase options; remove selections and try again');
            }
        }
        return {
            unit_price: roundMoney(basePrice),
            normalized_selections: canonicalSelectionObject(extra.out),
            summary: extra.extraSummary,
        };
    }
    let adjustment = 0;
    const summary = [];
    const outSel = {};
    for (const def of active) {
        const trimmed = pickSelectionString(normalized, def.var_key);
        if (def.kind === 'email') {
            if (!trimmed) {
                throw new errorHandler_1.AppError(400, `${def.label} is required`);
            }
            if (!EMAIL_RE.test(trimmed)) {
                throw new errorHandler_1.AppError(400, `Invalid email for ${def.label}`);
            }
            outSel[def.var_key] = trimmed;
            summary.push({ label: def.label, value: trimmed });
            continue;
        }
        const selectVal = trimmed;
        if (!selectVal) {
            throw new errorHandler_1.AppError(400, `Please choose: ${def.label}`);
        }
        const opt = def.options.find((o) => o.option_key === selectVal);
        if (!opt) {
            throw new errorHandler_1.AppError(400, `Invalid option for ${def.label}`);
        }
        adjustment += Number(opt.price_adjustment);
        outSel[def.var_key] = selectVal;
        summary.push({ label: def.label, value: opt.label });
    }
    const catalogExtra = await resolveExtraCatalogFields(productId, normalized);
    for (const [k, v] of Object.entries(catalogExtra.out)) {
        if (outSel[k] === undefined)
            outSel[k] = v;
    }
    const unit = roundMoney(basePrice + adjustment);
    return {
        unit_price: unit,
        normalized_selections: canonicalSelectionObject(outSel),
        summary: [...summary, ...catalogExtra.extraSummary],
    };
}
function roundMoney(n) {
    return Math.round(n * 100) / 100;
}
function toStorefrontVariable(def) {
    const base = {
        var_key: def.var_key,
        label: def.label,
        kind: def.kind,
        required: def.required === 1,
        sort_order: def.sort_order,
    };
    if (def.kind !== 'select')
        return base;
    return {
        ...base,
        options: def.options
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
            .map((o) => ({
            option_key: o.option_key,
            label: o.label,
            price_adjustment: Number(o.price_adjustment),
            sort_order: o.sort_order,
        })),
    };
}
function toAdminVariable(def) {
    const s = toStorefrontVariable(def);
    return { ...s, enabled: def.enabled === 1 };
}
//# sourceMappingURL=purchaseSelectionService.js.map