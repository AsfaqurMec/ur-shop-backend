import { wrapHtml, paragraph, escapeHtml } from '../layout';

export interface PaymentRejectedData {
  orderNumber: string;
  reason?: string;
}

export function renderPaymentRejected(data: PaymentRejectedData): { subject: string; html: string; text: string } {
  const subject = `Payment issue – Order #${data.orderNumber}`;
  let body = paragraph(
    `We were unable to verify your payment for order <strong>#${escapeHtml(data.orderNumber)}</strong>.`
  );
  if (data.reason) {
    body += paragraph(`Reason: ${escapeHtml(data.reason)}`);
  }
  body += paragraph(
    'You can submit a new payment proof from your order page, or contact support if you need help.'
  );
  const html = wrapHtml(subject, body);
  let text = `Payment issue – Order #${data.orderNumber}\n\nWe were unable to verify your payment. You can submit a new payment proof from your order page.`;
  if (data.reason) {
    text += `\n\nReason: ${data.reason}`;
  }
  return { subject, html, text };
}
