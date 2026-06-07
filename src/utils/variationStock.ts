/**
 * When a variation's `sku` column is a plain non-negative integer string (e.g. "15"),
 * it is treated as **available quantity** for that variation. Any other `sku` value is
 * treated as a normal SKU label (no stock cap from this field).
 */
const NUMERIC_STOCK_RE = /^\d+$/;

export function parseNumericStockFromSku(sku: string | null | undefined): number | null {
  if (sku == null) return null;
  const t = String(sku).trim();
  if (!NUMERIC_STOCK_RE.test(t)) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > 999_999_999) return null;
  return Math.floor(n);
}

export function formatSkuFromNumericStock(n: number): string {
  return String(Math.max(0, Math.floor(n)));
}
