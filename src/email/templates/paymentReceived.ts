import { wrapHtml, paragraph, escapeHtml } from '../layout';

export interface PaymentReceivedData {
  orderNumber: string;
  amount: string;
  currency: string;
}

export function renderPaymentReceived(data: PaymentReceivedData): { subject: string; html: string; text: string } {
  const subject = `Payment received for order #${data.orderNumber}`;
  const body = paragraph(
    'We have received your payment proof for the order below.'
  ) + paragraph(
    `Order: <strong>#${escapeHtml(data.orderNumber)}</strong><br>Amount: ${escapeHtml(data.amount)} ${escapeHtml(data.currency)}`
  ) + paragraph(
    'We will verify and process your order shortly. You will receive another email when your order is approved and delivery is completed.'
  );
  const html = wrapHtml(subject, body);
  const text = `Payment received for order #${data.orderNumber}\n\nWe have received your payment proof. We will verify and process your order shortly.`;
  return { subject, html, text };
}
