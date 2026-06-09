"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderAdminNewOrder = renderAdminNewOrder;
const layout_1 = require("../layout");
const orderItemCell_1 = require("../orderItemCell");
function renderAdminNewOrder(data) {
    const store = (0, layout_1.getStoreName)();
    const subject = `[${store}] New order #${data.orderNumber}`;
    const rows = data.lines
        .map((l) => `<tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e7e5e4;word-break:break-word;vertical-align:top">${(0, orderItemCell_1.renderOrderLineItemCellHtml)(l.product_name, l.detail_lines)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e7e5e4;text-align:center;vertical-align:top">${(0, layout_1.mobileFieldLabel)('Qty:')}${l.quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e7e5e4;font-size:12px;color:#57534e;vertical-align:top">${(0, layout_1.mobileFieldLabel)('Type:')}${(0, layout_1.escapeHtml)(l.product_type)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e7e5e4;text-align:right;vertical-align:top">${(0, layout_1.mobileFieldLabel)('Line total:')}${(0, layout_1.escapeHtml)(l.line_total)}</td>
        </tr>`)
        .join('');
    const table = `<table role="presentation" class="order-line-table" cellpadding="0" cellspacing="0" style="width:100%;max-width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
    <thead><tr style="background:#f5f5f4">
      <th align="left" style="padding:10px 8px;border-bottom:2px solid #d6d3d1">Item</th>
      <th style="padding:10px 8px;border-bottom:2px solid #d6d3d1">Qty</th>
      <th align="left" style="padding:10px 8px;border-bottom:2px solid #d6d3d1">Type</th>
      <th align="right" style="padding:10px 8px;border-bottom:2px solid #d6d3d1">Line total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
    let body = (0, layout_1.paragraph)(`A new order was placed: <strong>#${(0, layout_1.escapeHtml)(data.orderNumber)}</strong> (status: pending payment).`) +
        (0, layout_1.paragraph)(`Customer: <strong>${(0, layout_1.escapeHtml)(data.customerName || data.customerEmail)}</strong><br/>Email: ${(0, layout_1.escapeHtml)(data.customerEmail)}`) +
        table;
    if (data.subtotal != null) {
        body += (0, layout_1.paragraph)(`Subtotal: ${(0, layout_1.escapeHtml)(data.subtotal)} ${(0, layout_1.escapeHtml)(data.currency)}`);
    }
    if (data.discount != null && Number(data.discount) > 0) {
        body += (0, layout_1.paragraph)(`Discount: −${(0, layout_1.escapeHtml)(data.discount)} ${(0, layout_1.escapeHtml)(data.currency)}`);
    }
    body += (0, layout_1.paragraph)(`<strong>Order total: ${(0, layout_1.escapeHtml)(data.total)} ${(0, layout_1.escapeHtml)(data.currency)}</strong>`);
    if (data.adminOrdersUrl) {
        body += (0, layout_1.paragraph)(`Review in admin: ${(0, layout_1.link)(data.adminOrdersUrl, 'Open orders')}`);
    }
    else {
        body += (0, layout_1.paragraph)('Review this order in your admin dashboard.');
    }
    const html = (0, layout_1.wrapHtml)(subject, body);
    const linesPlain = data.lines
        .map((l) => (0, orderItemCell_1.formatOrderLineItemPlainBlock)(l.product_name, l.detail_lines, ` x${l.quantity} (${l.product_type}) — ${l.line_total} ${data.currency}`))
        .join('\n\n');
    const textLines = [
        `New order #${data.orderNumber} (pending payment)`,
        `Customer: ${data.customerName || data.customerEmail} <${data.customerEmail}>`,
        '',
        linesPlain,
        '',
        data.subtotal != null ? `Subtotal: ${data.subtotal} ${data.currency}` : '',
        data.discount != null && Number(data.discount) > 0 ? `Discount: ${data.discount} ${data.currency}` : '',
        `Total: ${data.total} ${data.currency}`,
        data.adminOrdersUrl ? `Admin: ${data.adminOrdersUrl}` : '',
    ];
    const text = textLines.filter(Boolean).join('\n');
    return { subject, html, text };
}
//# sourceMappingURL=adminNewOrder.js.map