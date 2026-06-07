import { wrapHtml, paragraph, escapeHtml, link, getStoreName } from '../layout';

export interface AdminTicketNotifyData {
  ticketId: number;
  subject: string;
  excerpt: string;
  eventTitle: string;
  adminUrl?: string;
}

export function renderAdminTicketNotify(data: AdminTicketNotifyData): { subject: string; html: string; text: string } {
  const store = getStoreName();
  const subject = `[${store}] ${data.eventTitle} #${data.ticketId}`;
  let body =
    paragraph(`<strong>${escapeHtml(data.eventTitle)}</strong> — Ticket #${data.ticketId}`) +
    paragraph(`Subject: <strong>${escapeHtml(data.subject)}</strong>`) +
    paragraph(escapeHtml(data.excerpt));
  if (data.adminUrl) {
    body += paragraph(`Open in admin: ${link(data.adminUrl, 'View ticket')}`);
  } else {
    body += paragraph('Review this ticket in your admin dashboard.');
  }
  const html = wrapHtml(subject, body);
  const text = [
    subject,
    '',
    `Subject: ${data.subject}`,
    '',
    data.excerpt,
    '',
    data.adminUrl ?? '',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}
