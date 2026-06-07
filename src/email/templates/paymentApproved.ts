import { wrapHtml, paragraph, escapeHtml, link, getStoreName, mobileFieldLabel } from '../layout';
import { renderOrderLineItemCellHtml, formatOrderLineItemPlainBlock } from '../orderItemCell';

export interface PaymentApprovedLine {
  product_name: string;
  detail_lines?: Array<{ label: string; value: string }>;
  quantity: number;
  product_type: string;
}

export interface PaymentApprovedLicenseGroup {
  product_name: string;
  detail_lines?: Array<{ label: string; value: string }>;
  keys: string[];
}

export interface PaymentApprovedData {
  orderNumber: string;
  customerName?: string;
  total?: string;
  currency?: string;
  lines?: PaymentApprovedLine[];
  licenseGroups?: PaymentApprovedLicenseGroup[];
  filesAttached?: boolean;
  fulfillmentNote?: string;
  dashboardUrl?: string;
}

export function renderPaymentApproved(data: PaymentApprovedData): { subject: string; html: string; text: string } {
  const store = getStoreName();
  const subject = `${store}: Order #${data.orderNumber} confirmed — you're all set`;
  const greeting = data.customerName
    ? `Hi ${escapeHtml(data.customerName)},`
    : 'Hi there,';

  let body = paragraph(greeting) + paragraph(
    `Your payment for order <strong>#${escapeHtml(data.orderNumber)}</strong> has been approved. Thank you for your purchase.`
  );

  if (data.total != null && data.currency != null) {
    body += paragraph(`Amount paid: <strong>${escapeHtml(data.total)} ${escapeHtml(data.currency)}</strong>`);
  }

  if (data.lines && data.lines.length > 0) {
    const rows = data.lines
      .map(
        (l) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #e7e5e4;word-break:break-word;vertical-align:top">${renderOrderLineItemCellHtml(l.product_name, l.detail_lines)}</td>
            <td style="padding:8px;border-bottom:1px solid #e7e5e4;text-align:center;vertical-align:top">${mobileFieldLabel('Qty:')}${l.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #e7e5e4;font-size:12px;color:#57534e;vertical-align:top">${mobileFieldLabel('Type:')}${escapeHtml(l.product_type)}</td>
          </tr>`
      )
      .join('');
    body += `<table role="presentation" class="order-line-table" cellpadding="0" cellspacing="0" style="width:100%;max-width:100%;border-collapse:collapse;margin:12px 0;font-size:14px">
      <thead><tr style="background:#f5f5f4">
        <th align="left" style="padding:8px;border-bottom:2px solid #d6d3d1">Item</th>
        <th style="padding:8px;border-bottom:2px solid #d6d3d1">Qty</th>
        <th align="left" style="padding:8px;border-bottom:2px solid #d6d3d1">Type</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
  }

  if (data.licenseGroups && data.licenseGroups.length > 0) {
    for (const g of data.licenseGroups) {
      const keysHtml = g.keys
        .map(
          (k) =>
            `<div style="margin:6px 0;padding:8px 12px;background:#f5f5f4;border-radius:6px;font-family:ui-monospace,monospace;font-size:13px;word-break:break-all;overflow-wrap:anywhere;max-width:100%">${escapeHtml(k)}</div>`
        )
        .join('');
      const itemBlock = renderOrderLineItemCellHtml(g.product_name, g.detail_lines);
      body += `<div style="margin:0 0 14px 0">${itemBlock}<p style="margin:10px 0 6px 0;font-weight:600">License key(s)</p>${keysHtml}</div>`;
    }
  }

  if (data.filesAttached) {
    body += paragraph(
      '<strong>Your downloadable files are attached to this email.</strong> You can also download them anytime from your dashboard (subject to your plan limits).'
    );
  }

  if (data.fulfillmentNote) {
    body += paragraph(escapeHtml(data.fulfillmentNote));
  }

  if (data.dashboardUrl) {
    body += paragraph(`Manage orders and downloads: ${link(data.dashboardUrl, 'Open your dashboard')}.`);
  }

  const html = wrapHtml(subject, body);

  const textParts = [
    `${store}: Order #${data.orderNumber} confirmed`,
    '',
    data.customerName ? `Hi ${data.customerName},` : 'Hi there,',
    '',
    'Your payment has been approved. Thank you for your purchase.',
    '',
    data.total != null && data.currency != null ? `Amount paid: ${data.total} ${data.currency}` : '',
    '',
    ...(data.lines?.length
      ? [
          data.lines
            .map((l) =>
              formatOrderLineItemPlainBlock(
                l.product_name,
                l.detail_lines,
                ` x${l.quantity} (${l.product_type})`
              )
            )
            .join('\n\n'),
          '',
        ]
      : []),
    ...(data.licenseGroups?.length
      ? data.licenseGroups.flatMap((g) => [
          formatOrderLineItemPlainBlock(g.product_name, g.detail_lines, ':'),
          ...g.keys.map((k) => `  ${k}`),
          '',
        ])
      : []),
    data.filesAttached ? 'Downloadable files are attached to this email.' : '',
    data.fulfillmentNote ?? '',
    data.dashboardUrl ? `Dashboard: ${data.dashboardUrl}` : '',
  ];
  const text = textParts.filter(Boolean).join('\n');
  return { subject, html, text };
}
