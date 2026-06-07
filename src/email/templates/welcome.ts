import { wrapHtml, paragraph, escapeHtml, getStoreName, link } from '../layout';

export interface WelcomeData {
  name: string;
  email: string;
  /** e.g. https://yoursite.com/login */
  loginUrl?: string;
  /** e.g. https://yoursite.com/shop */
  shopUrl?: string;
}

export function renderWelcome(data: WelcomeData): { subject: string; html: string; text: string } {
  const subject = `Welcome to ${getStoreName()}`;
  let body =
    paragraph(`Hi ${escapeHtml(data.name || 'there')},`) +
    paragraph(
      'Your account has been created. You can sign in and start browsing our digital products.'
    ) +
    paragraph(`Sign in with: <strong>${escapeHtml(data.email)}</strong>`);

  if (data.shopUrl || data.loginUrl) {
    const parts: string[] = [];
    if (data.shopUrl) parts.push(link(data.shopUrl, 'Browse the shop'));
    if (data.loginUrl) parts.push(link(data.loginUrl, 'Sign in'));
    body += paragraph(parts.join(' · '));
  }

  const html = wrapHtml(subject, body);
  const textLines = [
    `Welcome to ${getStoreName()}`,
    '',
    `Hi ${data.name || 'there'},`,
    '',
    'Your account has been created. You can sign in and start browsing our digital products.',
    '',
    `Sign in with: ${data.email}`,
    '',
    data.shopUrl ? `Shop: ${data.shopUrl}` : '',
    data.loginUrl ? `Sign in: ${data.loginUrl}` : '',
  ];
  const text = textLines.filter(Boolean).join('\n');
  return { subject, html, text };
}
