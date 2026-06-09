"use strict";
/**
 * Shared HTML / plain-text rendering for order line items in emails.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderOrderLineItemCellHtml = renderOrderLineItemCellHtml;
exports.formatOrderLineItemPlainBlock = formatOrderLineItemPlainBlock;
const layout_1 = require("./layout");
function renderOrderLineItemCellHtml(productName, detailLines) {
    const title = (0, layout_1.escapeHtml)(String(productName ?? '').trim() || 'Product');
    let html = `<div style="font-weight:600;color:#1c1917;line-height:1.35;word-break:break-word;overflow-wrap:break-word">${title}</div>`;
    if (!detailLines?.length)
        return html;
    for (const d of detailLines) {
        const lab = String(d.label ?? '').trim();
        const val = String(d.value ?? '').trim();
        if (!lab && !val)
            continue;
        const line = lab ? `${(0, layout_1.escapeHtml)(lab)}: ${(0, layout_1.escapeHtml)(val || '—')}` : (0, layout_1.escapeHtml)(val);
        html += `<div style="margin-top:6px;font-size:12px;line-height:1.45;color:#57534e;word-break:break-word;overflow-wrap:break-word">${line}</div>`;
    }
    return html;
}
/** One plain-text block: product line + indented attributes. */
function formatOrderLineItemPlainBlock(productName, detailLines, trailing) {
    const lines = [`${productName}${trailing}`];
    for (const d of detailLines ?? []) {
        const lab = String(d.label ?? '').trim();
        const val = String(d.value ?? '').trim();
        if (!lab && !val)
            continue;
        lines.push(`  ${lab ? `${lab}: ${val || '—'}` : val}`);
    }
    return lines.join('\n');
}
//# sourceMappingURL=orderItemCell.js.map