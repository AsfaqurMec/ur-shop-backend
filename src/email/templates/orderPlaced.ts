import { wrapHtml, paragraph, escapeHtml, link, getStoreName, mobileFieldLabel } from '../layout';
import { renderOrderLineItemCellHtml, formatOrderLineItemPlainBlock } from '../orderItemCell';

export interface OrderPlacedLine {
  product_name: string;
  /** Variation / text-email options; each rendered on its own row under the product name. */
  detail_lines?: Array<{ label: string; value: string }>;
  quantity: number;
  line_total: string;
}

export interface OrderPlacedData {
  orderNumber: string;
  customerName?: string;
  total: string;
  currency: string;
  subtotal?: string;
  discount?: string;
  lines?: OrderPlacedLine[];
  paymentInstructions?: string;
  dashboardUrl?: string;
}

export function renderOrderPlaced(data: OrderPlacedData): { subject: string; html: string; text: string } {
  const store = getStoreName();
  const subject = `${store}: Order #${data.orderNumber} received`;
  const greeting = data.customerName
    ? `Hi ${escapeHtml(data.customerName)},`
    : 'Hi there,';
  let body = paragraph(greeting) + paragraph(
    `Thank you — we received your order <strong>#${escapeHtml(data.orderNumber)}</strong>.`
  );

  if (data.lines && data.lines.length > 0) {
    const rows = data.lines
      .map(
        (l) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #e7e5e4;word-break:break-word;vertical-align:top">${renderOrderLineItemCellHtml(l.product_name, l.detail_lines)}</td>
            <td style="padding:8px;border-bottom:1px solid #e7e5e4;text-align:center;vertical-align:top">${mobileFieldLabel('Qty:')}${l.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #e7e5e4;text-align:right;vertical-align:top">${mobileFieldLabel('Line total:')}${escapeHtml(l.line_total)}</td>
          </tr>`
      )
      .join('');
    body += `<table role="presentation" class="order-line-table" cellpadding="0" cellspacing="0" style="width:100%;max-width:100%;border-collapse:collapse;margin:12px 0 18px;font-size:14px">
      <thead><tr style="background:#f5f5f4">
        <th align="left" style="padding:8px;border-bottom:2px solid #d6d3d1">Item</th>
        <th style="padding:8px;border-bottom:2px solid #d6d3d1">Qty</th>
        <th align="right" style="padding:8px;border-bottom:2px solid #d6d3d1">Line total</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
  }

  if (data.subtotal != null) {
    body += paragraph(`Subtotal: ${escapeHtml(data.subtotal)} ${escapeHtml(data.currency)}`);
  }
  if (data.discount != null && Number(data.discount) > 0) {
    body += paragraph(`Discount: −${escapeHtml(data.discount)} ${escapeHtml(data.currency)}`);
  }
  body += paragraph(`<strong>Total: ${escapeHtml(data.total)} ${escapeHtml(data.currency)}</strong>`);

  if (data.paymentInstructions) {
    body += paragraph(escapeHtml(data.paymentInstructions));
  }
  if (data.dashboardUrl) {
    body += paragraph(
      `Complete payment (if required) and track your order in your ${link(data.dashboardUrl, 'account dashboard')}.`
    );
  } else {
    body += paragraph('You can view your order and complete payment from your account dashboard.');
  }
  body += paragraph('We will email you again when your payment is confirmed and your products are ready.');

  const html = wrapHtml(subject, body);
  const itemsPlain =
    data.lines
      ?.map((l) =>
        formatOrderLineItemPlainBlock(
          l.product_name,
          l.detail_lines,
          ` x${l.quantity} — ${l.line_total} ${data.currency}`
        )
      )
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
