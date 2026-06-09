/**
 * Shared HTML / plain-text rendering for order line items in emails.
 */
import type { PurchaseSelectionSummaryLine } from '../utils/orderItemDisplay';
export declare function renderOrderLineItemCellHtml(productName: string, detailLines?: PurchaseSelectionSummaryLine[] | null): string;
/** One plain-text block: product line + indented attributes. */
export declare function formatOrderLineItemPlainBlock(productName: string, detailLines: PurchaseSelectionSummaryLine[] | null | undefined, trailing: string): string;
//# sourceMappingURL=orderItemCell.d.ts.map