"use strict";
/**
 * Human-readable order line titles for emails and logs (variation choices + text/email extras).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPurchaseSelectionsSummaryLine = formatPurchaseSelectionsSummaryLine;
exports.formatOrderItemLineTitle = formatOrderItemLineTitle;
exports.filterSummaryForEmailDisplay = filterSummaryForEmailDisplay;
exports.orderItemEmailParts = orderItemEmailParts;
function formatPurchaseSelectionsSummaryLine(summary) {
    if (!summary?.length)
        return '';
    return summary
        .map((x) => {
        const label = String(x.label ?? '').trim();
        const value = String(x.value ?? '').trim();
        if (!label && !value)
            return '';
        return label ? `${label}: ${value || '—'}` : value;
    })
        .filter(Boolean)
        .join('; ');
}
/** Single line for non-email contexts (logs, legacy): "Product name (Size: L; …)" */
function formatOrderItemLineTitle(productName, summary) {
    const tail = formatPurchaseSelectionsSummaryLine(summary);
    const name = String(productName ?? '').trim() || 'Product';
    return tail ? `${name} (${tail})` : name;
}
/** Labels omitted from transactional emails (e.g. numeric stock from variation SKU). */
const EMAIL_EXCLUDED_LABELS = new Set(['available']);
/** Summary rows safe to show in email bodies (excludes inventory-only lines). */
function filterSummaryForEmailDisplay(summary) {
    if (!summary?.length)
        return [];
    return summary.filter((s) => {
        const lab = String(s.label ?? '').trim().toLowerCase();
        if (!lab)
            return String(s.value ?? '').trim().length > 0;
        return !EMAIL_EXCLUDED_LABELS.has(lab);
    });
}
/** Split product title vs option rows for email templates. */
function orderItemEmailParts(productName, summary) {
    return {
        product_name: String(productName ?? '').trim() || 'Product',
        detail_lines: filterSummaryForEmailDisplay(summary),
    };
}
//# sourceMappingURL=orderItemDisplay.js.map