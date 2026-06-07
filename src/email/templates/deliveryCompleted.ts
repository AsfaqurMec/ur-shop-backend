import { wrapHtml, paragraph, escapeHtml } from '../layout';

export interface DeliveryCompletedData {
  orderNumber: string;
  summary: string;
}

export function renderDeliveryCompleted(data: DeliveryCompletedData): { subject: string; html: string; text: string } {
  const subject = `Order #${data.orderNumber} – Delivery completed`;
  const body = paragraph(
    `Your order <strong>#${escapeHtml(data.orderNumber)}</strong> has been fulfilled.`
  ) + paragraph(
    escapeHtml(data.summary)
  ) + paragraph(
    'Downloads, license keys, and subscription access are available in your dashboard.'
  );
  const html = wrapHtml(subject, body);
  const text = `Order #${data.orderNumber} – Delivery completed\n\n${data.summary}\n\nCheck your dashboard for downloads and licenses.`;
  return { subject, html, text };
}
