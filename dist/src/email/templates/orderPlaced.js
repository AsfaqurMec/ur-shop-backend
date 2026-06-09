"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderOrderPlaced = renderOrderPlaced;
const layout_1 = require("../layout");
const orderItemCell_1 = require("../orderItemCell");
function renderOrderPlaced(data) {
    const store = (0, layout_1.getStoreName)();
    const subject = `${store}: Order #${data.orderNumber} received`;
    const greeting = data.customerName
        ? `Hi ${(0, layout_1.escapeHtml)(data.customerName)},`
        : 'Hi there,';
    let body = (0, layout_1.paragraph)(greeting) + (0, layout_1.paragraph)(`Thank you — we received your order <strong>#${(0, layout_1.escapeHtml)(data.orderNumber)}</strong>.`);
    if (data.lines && data.lines.length > 0) {
        const rows = data.lines
            .map((l) => `<tr>
            <td style="padding:8px;border-bottom:1px solid #e7e5e4;word-break:break-word;vertical-align:top">${(0, orderItemCell_1.renderOrderLineItemCellHtml)(l.product_name, l.detail_lines)}</td>
            <td style="padding:8px;border-bottom:1px solid #e7e5e4;text-align:center;vertical-align:top">${(0, layout_1.mobileFieldLabel)('Qty:')}${l.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #e7e5e4;text-align:right;vertical-align:top">${(0, layout_1.mobileFieldLabel)('Line total:')}${(0, layout_1.escapeHtml)(l.line_total)}</td>
          </tr>`)
            .join('');
        body += `<table role="presentation" class="order-line-table" cellpadding="0" cellspacing="0" style="width:100%;max-width:100%;border-collapse:collapse;margin:12px 0 18px;font-size:14px">
      <thead><tr style="background:#f5f5f4">
        <th align="left" style="padding:8px;border-bottom:2px solid #d6d3d1">Item</th>
        <th style="padding:8px;border-bottom:2px solid #d6d3d1">Qty</th>
        <th align="right" style="padding:8px;border-bottom:2px solid #d6d3d1">Line total</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
    }
    if (data.subtotal != null) {
        body += (0, layout_1.paragraph)(`Subtotal: ${(0, layout_1.escapeHtml)(data.subtotal)} ${(0, layout_1.escapeHtml)(data.currency)}`);
    }
    if (data.discount != null && Number(data.discount) > 0) {
        body += (0, layout_1.paragraph)(`Discount: −${(0, layout_1.escapeHtml)(data.discount)} ${(0, layout_1.escapeHtml)(data.currency)}`);
    }
    body += (0, layout_1.paragraph)(`<strong>Total: ${(0, layout_1.escapeHtml)(data.total)} ${(0, layout_1.escapeHtml)(data.currency)}</strong>`);
    if (data.paymentInstructions) {
        body += (0, layout_1.paragraph)((0, layout_1.escapeHtml)(data.paymentInstructions));
    }
    if (data.dashboardUrl) {
        body += (0, layout_1.paragraph)(`Complete payment (if required) and track your order in your ${(0, layout_1.link)(data.dashboardUrl, 'account dashboard')}.`);
    }
    else {
        body += (0, layout_1.paragraph)('You can view your order and complete payment from your account dashboard.');
    }
    body += (0, layout_1.paragraph)('We will email you again when your payment is confirmed and your products are ready.');
    const html = (0, layout_1.wrapHtml)(subject, body);
    const itemsPlain = data.lines
        ?.map((l) => (0, orderItemCell_1.formatOrderLineItemPlainBlock)(l.product_name, l.detail_lines, ` x${l.quantity} — ${l.line_total} ${data.currency}`))
        .join('\n\n') ?? '';
    const textParts = [
        `${store}: Order #${data.orderNumber} received`,
        '',
        data.customerName ? `Hi ${data.customerName},` : 'Hi there,',
        '',
        'Thank you — we received your order.',
        '',
        itemsPlain,
        data.subtotal != null ? `Subtotal: ${data.subtotal} ${data.currency}` : '',
        data.discount != null && Number(data.discount) > 0 ? `Discount: ${data.discount} ${data.currency}` : '',
        `Total: ${data.total} ${data.currency}`,
        '',
        data.paymentInstructions ?? '',
        data.dashboardUrl ? `Dashboard: ${data.dashboardUrl}` : '',
        '',
        'We will email you again when your payment is confirmed.',
    ];
    const text = textParts.filter(Boolean).join('\n');
    return { subject, html, text };
}
//# sourceMappingURL=orderPlaced.js.map