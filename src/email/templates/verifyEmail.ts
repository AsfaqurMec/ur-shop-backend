import { wrapHtml, paragraph, link, getStoreName } from '../layout';

export interface VerifyEmailData {
  verifyUrl: string;
  token?: string;
}

export function renderVerifyEmail(data: VerifyEmailData): { subject: string; html: string; text: string } {
  const subject = `${getStoreName()}: verify your email`;
  const body = paragraph(
    'Please verify your email address by clicking the link below:'
  ) + paragraph(
    link(data.verifyUrl, 'Verify my email')
  ) + paragraph(
    'If you did not create an account, you can ignore this email.'
  );
  const html = wrapHtml(subject, body);
  const text = `Verify your email\n\nPlease verify your email address by visiting:\n${data.verifyUrl}\n\nIf you did not create an account, you can ignore this email.`;
  return { subject, html, text };
}
