/**
 * Human-readable order line titles for emails and logs (variation choices + text/email extras).
 */
export type PurchaseSelectionSummaryLine = {
    label: string;
    value: string;
};
export declare function formatPurchaseSelectionsSummaryLine(summary: PurchaseSelectionSummaryLine[] | null | undefined): string;
/** Single line for non-email contexts (logs, legacy): "Product name (Size: L; …)" */
export declare function formatOrderItemLineTitle(productName: string, summary: PurchaseSelectionSummaryLine[] | null | undefined): string;
/** Summary rows safe to show in email bodies (excludes inventory-only lines). */
export declare function filterSummaryForEmailDisplay(summary: PurchaseSelectionSummaryLine[] | null | undefined): PurchaseSelectionSummaryLine[];
/** Split product title vs option rows for email templates. */
export declare function orderItemEmailParts(productName: string, summary: PurchaseSelectionSummaryLine[] | null | undefined): {
    product_name: string;
    detail_lines: PurchaseSelectionSummaryLine[];
};
//# sourceMappingURL=orderItemDisplay.d.ts.map