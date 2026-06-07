/**
 * Shared HTML / plain-text rendering for order line items in emails.
 */

import { escapeHtml } from './layout';
import type { PurchaseSelectionSummaryLine } from '../utils/orderItemDisplay';

export function renderOrderLineItemCellHtml(
  productName: string,
  detailLines?: PurchaseSelectionSummaryLine[] | null
): string {
  const title = escapeHtml(String(productName ?? '').trim() || 'Product');
  let html = `<div style="font-weight:600;color:#1c1917;line-height:1.35;word-break:break-word;overflow-wrap:break-word">${title}</div>`;
  if (!detailLines?.length) return html;
  for (const d of detailLines) {
    const lab = String(d.label ?? '').trim();
    const val = String(d.value ?? '').trim();
    if (!lab && !val) continue;
    const line = lab ? `${escapeHtml(lab)}: ${escapeHtml(val || '—')}` : escapeHtml(val);
    html += `<div style="margin-top:6px;font-size:12px;line-height:1.45;color:#57534e;word-break:break-word;overflow-wrap:break-word">${line}</div>`;
  }
  return html;
}

/** One plain-text block: product line + indented attributes. */
export function formatOrderLineItemPlainBlock(
  productName: string,
  detailLines: PurchaseSelectionSummaryLine[] | null | undefined,
  trailing: string
): string {
  const lines: string[] = [`${productName}${trailing}`];
  for (const d of detailLines ?? []) {
    const lab = String(d.label ?? '').trim();
    const val = String(d.value ?? '').trim();
    if (!lab && !val) continue;
    lines.push(`  ${lab ? `${lab}: ${val || '—'}` : val}`);
  }
  return lines.join('\n');
}
