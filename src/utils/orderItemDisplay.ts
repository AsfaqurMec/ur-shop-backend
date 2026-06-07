/**
 * Human-readable order line titles for emails and logs (variation choices + text/email extras).
 */

export type PurchaseSelectionSummaryLine = { label: string; value: string };

export function formatPurchaseSelectionsSummaryLine(
  summary: PurchaseSelectionSummaryLine[] | null | undefined
): string {
  if (!summary?.length) return '';
  return summary
    .map((x) => {
      const label = String(x.label ?? '').trim();
      const value = String(x.value ?? '').trim();
      if (!label && !value) return '';
      return label ? `${label}: ${value || '—'}` : value;
    })
    .filter(Boolean)
    .join('; ');
}

/** Single line for non-email contexts (logs, legacy): "Product name (Size: L; …)" */
export function formatOrderItemLineTitle(
  productName: string,
  summary: PurchaseSelectionSummaryLine[] | null | undefined
): string {
  const tail = formatPurchaseSelectionsSummaryLine(summary);
  const name = String(productName ?? '').trim() || 'Product';
  return tail ? `${name} (${tail})` : name;
}

/** Labels omitted from transactional emails (e.g. numeric stock from variation SKU). */
const EMAIL_EXCLUDED_LABELS = new Set(['available']);

/** Summary rows safe to show in email bodies (excludes inventory-only lines). */
export function filterSummaryForEmailDisplay(
  summary: PurchaseSelectionSummaryLine[] | null | undefined
): PurchaseSelectionSummaryLine[] {
  if (!summary?.length) return [];
  return summary.filter((s) => {
    const lab = String(s.label ?? '').trim().toLowerCase();
    if (!lab) return String(s.value ?? '').trim().length > 0;
    return !EMAIL_EXCLUDED_LABELS.has(lab);
  });
}

/** Split product title vs option rows for email templates. */
export function orderItemEmailParts(
  productName: string,
  summary: PurchaseSelectionSummaryLine[] | null | undefined
): { product_name: string; detail_lines: PurchaseSelectionSummaryLine[] } {
  return {
    product_name: String(productName ?? '').trim() || 'Product',
    detail_lines: filterSummaryForEmailDisplay(summary),
  };
}
