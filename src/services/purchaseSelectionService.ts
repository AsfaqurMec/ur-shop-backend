import { AppError } from '../middlewares/errorHandler';
import type { PurchaseVariableWithOptions } from '../repositories/productPurchaseVariableRepository';
import * as pvRepo from '../repositories/productPurchaseVariableRepository';
import * as variationRepo from '../repositories/productVariationRepository';
import * as attrRepo from '../repositories/productAttributeRepository';
import * as productRepo from '../repositories/productRepository';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SelectionSummaryLine {
  label: string;
  value: string;
}

/** Stable key order for storing selections and matching cart lines. */
export function canonicalSelectionObject(raw: unknown): Record<string, string> {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return canonicalSelectionObject(parsed);
      }
    } catch {
      return {};
    }
    return {};
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const key of Object.keys(raw as Record<string, unknown>).sort()) {
    const v = (raw as Record<string, unknown>)[key];
    if (v == null) continue;
    const s = typeof v === 'string' ? v.trim() : String(v).trim();
    if (s.length > 0) out[key] = s;
  }
  return out;
}

export function selectionsSignature(sel: Record<string, string>): string {
  return JSON.stringify(canonicalSelectionObject(sel));
}

/** Read selection value allowing case-insensitive key match (client / JSON quirks). */
function pickSelectionString(map: Record<string, string>, key: string): string {
  if (map[key] != null && String(map[key]).trim() !== '') return String(map[key]).trim();
  const lk = key.toLowerCase();
  const found = Object.keys(map).find((k) => k.toLowerCase() === lk);
  return found != null && String(map[found]).trim() !== '' ? String(map[found]).trim() : '';
}

function isUsedForVariations(a: { used_for_variations: number | boolean | string }): boolean {
  const n = Number(a.used_for_variations);
  if (Number.isFinite(n)) return n === 1;
  if (typeof a.used_for_variations === 'boolean') return a.used_for_variations;
  if (typeof a.used_for_variations === 'string') {
    const s = a.used_for_variations.trim().toLowerCase();
    return s === '1' || s === 'true';
  }
  return false;
}

function enabledDefinitions(vars: PurchaseVariableWithOptions[]): PurchaseVariableWithOptions[] {
  return vars.filter((v) => v.enabled === 1).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

export interface ResolvedLinePricing {
  unit_price: number;
  normalized_selections: Record<string, string>;
  summary: SelectionSummaryLine[];
  /** Catalog variation row used for this line (set when product has variations; may be inferred). */
  effective_variation_id?: number;
}

/** When the client omits variation_id, pick a stable enabled row (matches storefront defaults). */
async function inferFallbackVariationId(productId: number): Promise<number | null> {
  const vars = await variationRepo.findVariationsByProductId(productId);
  const enabled = vars.filter((v) => v.enabled === 1);
  if (enabled.length === 0) return null;
  if (enabled.length === 1) return enabled[0].id;
  const product = await productRepo.findProductById(productId);
  const defId = product?.default_variation_id ?? null;
  if (defId != null) {
    const row = enabled.find((v) => v.id === defId);
    if (row) return row.id;
  }
  enabled.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  return enabled[0].id;
}

function normalizeVariationId(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.trunc(n);
}

async function buildVariationChoiceSummary(
  productId: number,
  combination: Record<string, string>,
  variationSku: string | null
): Promise<SelectionSummaryLine[]> {
  const attrs = await attrRepo.findAttributesWithValuesByProductId(productId);
  const byKey = new Map(attrs.map((a) => [a.attr_key, a]));
  const lines: SelectionSummaryLine[] = [];
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
async function resolveExtraCatalogFields(
  productId: number,
  normalized: Record<string, string>,
  opts?: { requireAllExtras?: boolean }
): Promise<{ out: Record<string, string>; extraSummary: SelectionSummaryLine[] }> {
  const requireAll = opts?.requireAllExtras === true;
  const attrs = await attrRepo.findAttributesWithValuesByProductId(productId);
  const out: Record<string, string> = {};
  const extraSummary: SelectionSummaryLine[] = [];

  for (const a of attrs.sort((x, y) => x.sort_order - y.sort_order || x.id - y.id)) {
    if (isUsedForVariations(a)) continue;
    if (a.kind !== 'email' && a.kind !== 'text') continue;
    const attrKey = String(a.attr_key).trim();
    const trimmed = pickSelectionString(normalized, attrKey);
    if (!trimmed) {
      if (requireAll) throw new AppError(400, `${a.name} is required`);
      continue;
    }
    if (a.kind === 'email' && !EMAIL_RE.test(trimmed)) {
      throw new AppError(400, `Invalid email for ${a.name}`);
    }
    out[attrKey] = trimmed;
    extraSummary.push({ label: a.name, value: trimmed });
  }
  return { out, extraSummary };
}

async function resolveWithVariation(
  productId: number,
  basePrice: number,
  rawSelections: unknown,
  variationId: number
): Promise<ResolvedLinePricing> {
  const row = await variationRepo.findVariationById(variationId);
  if (!row || row.product_id !== productId) {
    throw new AppError(400, 'Invalid product option');
  }
  if (!row.enabled) {
    throw new AppError(400, 'This product option is not available');
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
export async function resolveLinePricing(
  productId: number,
  basePrice: number,
  rawSelections: unknown,
  variationId?: number | null
): Promise<ResolvedLinePricing> {
  const enabledVariations = await variationRepo.countEnabledVariations(productId);

  if (enabledVariations > 0) {
    let vid = normalizeVariationId(variationId);
    if (vid == null) {
      vid = await inferFallbackVariationId(productId);
    }
    if (vid == null) {
      throw new AppError(400, 'Please choose product options before adding to cart');
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
        throw new AppError(400, 'This product has no purchase options; remove selections and try again');
      }
    }
    return {
      unit_price: roundMoney(basePrice),
      normalized_selections: canonicalSelectionObject(extra.out),
      summary: extra.extraSummary,
    };
  }

  let adjustment = 0;
  const summary: SelectionSummaryLine[] = [];
  const outSel: Record<string, string> = {};

  for (const def of active) {
    const trimmed = pickSelectionString(normalized, def.var_key);

    if (def.kind === 'email') {
      if (!trimmed) {
        throw new AppError(400, `${def.label} is required`);
      }
      if (!EMAIL_RE.test(trimmed)) {
        throw new AppError(400, `Invalid email for ${def.label}`);
      }
      outSel[def.var_key] = trimmed;
      summary.push({ label: def.label, value: trimmed });
      continue;
    }

    const selectVal = trimmed;
    if (!selectVal) {
      throw new AppError(400, `Please choose: ${def.label}`);
    }
    const opt = def.options.find((o) => o.option_key === selectVal);
    if (!opt) {
      throw new AppError(400, `Invalid option for ${def.label}`);
    }
    adjustment += Number(opt.price_adjustment);
    outSel[def.var_key] = selectVal;
    summary.push({ label: def.label, value: opt.label });
  }

  const catalogExtra = await resolveExtraCatalogFields(productId, normalized);
  for (const [k, v] of Object.entries(catalogExtra.out)) {
    if (outSel[k] === undefined) outSel[k] = v;
  }

  const unit = roundMoney(basePrice + adjustment);
  return {
    unit_price: unit,
    normalized_selections: canonicalSelectionObject(outSel),
    summary: [...summary, ...catalogExtra.extraSummary],
  };
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function toStorefrontVariable(def: PurchaseVariableWithOptions): {
  var_key: string;
  label: string;
  kind: 'select' | 'email';
  required: boolean;
  sort_order: number;
  options?: Array<{ option_key: string; label: string; price_adjustment: number; sort_order: number }>;
} {
  const base = {
    var_key: def.var_key,
    label: def.label,
    kind: def.kind,
    required: def.required === 1,
    sort_order: def.sort_order,
  };
  if (def.kind !== 'select') return base;
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

export function toAdminVariable(def: PurchaseVariableWithOptions): ReturnType<typeof toStorefrontVariable> & {
  enabled: boolean;
} {
  const s = toStorefrontVariable(def);
  return { ...s, enabled: def.enabled === 1 };
}
