import { wrapHtml, paragraph, escapeHtml, link, getStoreName } from '../layout';

export interface TicketReplyData {
  ticketId: number;
  subject: string;
  messagePreview: string;
  ticketUrl?: string;
}

export function renderTicketReply(data: TicketReplyData): { subject: string; html: string; text: string } {
  const subject = `${getStoreName()}: reply on ticket #${data.ticketId} — ${data.subject}`;
  let body = paragraph(
    'You have a new reply on your support ticket.'
  ) + paragraph(
    `<strong>${escapeHtml(data.subject)}</strong>`
  ) + paragraph(
    escapeHtml(data.messagePreview)
  );
  if (data.ticketUrl) {
    body += paragraph(
      link(data.ticketUrl, 'View ticket and reply')
    );
  } else {
    body += paragraph(`View and reply in your dashboard (Ticket #${data.ticketId}).`);
  }
  const html = wrapHtml(subject, body);
  const text = `${subject}\n\n${data.messagePreview}\n\n${data.ticketUrl ? data.ticketUrl : 'View and reply in your dashboard.'}`;
  return { subject, html, text };
}
