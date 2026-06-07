import { wrapHtml, paragraph, escapeHtml, link, getStoreName } from '../layout';

export interface SubscriptionExpiringSoonData {
  productName: string;
  /** ISO end time for the current period. */
  periodEnd: string;
  /** Human-readable end (e.g. in UTC). */
  periodEndFormatted: string;
  /** Deep link to product page with renew query params. */
  renewUrl: string;
  /** Link to dashboard subscriptions list. */
  subscriptionsUrl?: string;
}

export function renderSubscriptionExpiringSoon(data: SubscriptionExpiringSoonData): {
  subject: string;
  html: string;
  text: string;
} {
  const store = getStoreName();
  const subject = `${store}: your subscription expires tomorrow — ${data.productName}`;

  let body = paragraph(
    `Your access for <strong>${escapeHtml(data.productName)}</strong> is set to end on <strong>${escapeHtml(data.periodEndFormatted)}</strong> (tomorrow).`
  );
  body += paragraph(
    `If you want to continue without interruption, please ${link(data.renewUrl, 'renew on the product page')} before it expires.`
  );
  if (data.subscriptionsUrl) {
    body += paragraph(`You can also open ${link(data.subscriptionsUrl, 'your subscriptions')} in your account.`);
  }

  const html = wrapHtml(subject, body);
  let text = `${subject}\n\n`;
  text += `Your subscription for ${data.productName} ends ${data.periodEndFormatted}.\n\n`;
  text += `Renew: ${data.renewUrl}\n`;
  if (data.subscriptionsUrl) text += `Subscriptions: ${data.subscriptionsUrl}\n`;
  return { subject, html, text };
}
