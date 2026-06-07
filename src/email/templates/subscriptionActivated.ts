import { wrapHtml, paragraph, escapeHtml, link, getStoreName } from '../layout';
import { renderOrderLineItemCellHtml, formatOrderLineItemPlainBlock } from '../orderItemCell';

export interface SubscriptionActivatedData {
  orderNumber: string;
  productName: string;
  /** Variation / extras under the product name in the body (not in the email subject). */
  productDetailLines?: Array<{ label: string; value: string }>;
  periodEnd?: string;
  dashboardUrl?: string;
}

function formatPeriodEnd(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }) + ' UTC';
}

export function renderSubscriptionActivated(data: SubscriptionActivatedData): { subject: string; html: string; text: string } {
  const store = getStoreName();
  const subject = `${store}: subscription active — ${data.productName}`;
  const periodLabel = formatPeriodEnd(data.periodEnd);

  const introLead = `Your subscription (order <strong>#${escapeHtml(data.orderNumber)}</strong>) is now active.`;
  const itemBlock = renderOrderLineItemCellHtml(data.productName, data.productDetailLines);
  let body = `<div style="margin:0 0 14px 0"><p style="margin:0 0 10px 0">${introLead}</p>${itemBlock}</div>`;
  if (periodLabel) {
    body += paragraph(`Current period ends: <strong>${escapeHtml(periodLabel)}</strong>`);
  }
  if (data.dashboardUrl) {
    body += paragraph(`Manage your subscription in your ${link(data.dashboardUrl, 'dashboard')}.`);
  } else {
    body += paragraph('You can manage your subscription in your account dashboard.');
  }

  const html = wrapHtml(subject, body);
  const itemPlain = formatOrderLineItemPlainBlock(data.productName, data.productDetailLines, '');
  let text = `${subject}\n\nOrder #${data.orderNumber}\n\n${itemPlain}\n\n`;
  if (periodLabel) text += `Current period ends: ${periodLabel}\n\n`;
  text += data.dashboardUrl
    ? `Dashboard: ${data.dashboardUrl}`
    : 'Manage your subscription in your account dashboard.';
  return { subject, html, text };
}
