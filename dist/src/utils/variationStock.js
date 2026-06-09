"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNumericStockFromSku = parseNumericStockFromSku;
exports.formatSkuFromNumericStock = formatSkuFromNumericStock;
/**
 * When a variation's `sku` column is a plain non-negative integer string (e.g. "15"),
 * it is treated as **available quantity** for that variation. Any other `sku` value is
 * treated as a normal SKU label (no stock cap from this field).
 */
const NUMERIC_STOCK_RE = /^\d+$/;
function parseNumericStockFromSku(sku) {
    if (sku == null)
        return null;
    const t = String(sku).trim();
    if (!NUMERIC_STOCK_RE.test(t))
        return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0 || n > 999_999_999)
        return null;
    return Math.floor(n);
}
function formatSkuFromNumericStock(n) {
    return String(Math.max(0, Math.floor(n)));
}
//# sourceMappingURL=variationStock.js.map