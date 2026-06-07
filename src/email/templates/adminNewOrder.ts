import { wrapHtml, paragraph, escapeHtml, link, getStoreName, mobileFieldLabel } from '../layout';
import { renderOrderLineItemCellHtml, formatOrderLineItemPlainBlock } from '../orderItemCell';

export interface AdminNewOrderLine {
  product_name: string;
  detail_lines?: Array<{ label: string; value: string }>;
  quantity: number;
  product_type: string;
  line_total: string;
}

export interface AdminNewOrderData {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  total: string;
  currency: string;
  subtotal?: string;
  discount?: string;
  lines: AdminNewOrderLine[];
  adminOrdersUrl?: string;
}

export function renderAdminNewOrder(data: AdminNewOrderData): { subject: string; html: string; text: string } {
  const store = getStoreName();
  const subject = `[${store}] New order #${data.orderNumber}`;
  const rows = data.lines
    .map(
      (l) =>
        `<tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e7e5e4;word-break:break-word;vertical-align:top">${renderOrderLineItemCellHtml(l.product_name, l.detail_lines)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e7e5e4;text-align:center;vertical-align:top">${mobileFieldLabel('Qty:')}${l.quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e7e5e4;font-size:12px;color:#57534e;vertical-align:top">${mobileFieldLabel('Type:')}${escapeHtml(l.product_type)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e7e5e4;text-align:right;vertical-align:top">${mobileFieldLabel('Line total:')}${escapeHtml(l.line_total)}</td>
        </tr>`
    )
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

  let body =
    paragraph(`A new order was placed: <strong>#${escapeHtml(data.orderNumber)}</strong> (status: pending payment).`) +
    paragraph(
      `Customer: <strong>${escapeHtml(data.customerName || data.customerEmail)}</strong><br/>Email: ${escapeHtml(data.customerEmail)}`
    ) +
    table;
  if (data.subtotal != null) {
    body += paragraph(`Subtotal: ${escapeHtml(data.subtotal)} ${escapeHtml(data.currency)}`);
  }
  if (data.discount != null && Number(data.discount) > 0) {
    body += paragraph(`Discount: −${escapeHtml(data.discount)} ${escapeHtml(data.currency)}`);
  }
  body += paragraph(`<strong>Order total: ${escapeHtml(data.total)} ${escapeHtml(data.currency)}</strong>`);
  if (data.adminOrdersUrl) {
    body += paragraph(`Review in admin: ${link(data.adminOrdersUrl, 'Open orders')}`);
  } else {
    body += paragraph('Review this order in your admin dashboard.');
  }

  const html = wrapHtml(subject, body);
  const linesPlain = data.lines
    .map((l) =>
      formatOrderLineItemPlainBlock(
        l.product_name,
        l.detail_lines,
        ` x${l.quantity} (${l.product_type}) — ${l.line_total} ${data.currency}`
      )
    )
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
