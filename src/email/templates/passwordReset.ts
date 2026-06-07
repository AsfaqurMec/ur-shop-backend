import { wrapHtml, paragraph, link, getStoreName } from '../layout';

export interface PasswordResetData {
  resetUrl: string;
  expiresInHours: number;
}

export function renderPasswordReset(data: PasswordResetData): { subject: string; html: string; text: string } {
  const subject = `${getStoreName()}: reset your password`;
  const body = paragraph(
    'You requested a password reset. Click the link below to set a new password:'
  ) + paragraph(
    link(data.resetUrl, 'Reset password')
  ) + paragraph(
    `This link expires in ${data.expiresInHours} hour(s). If you did not request this, you can ignore this email.`
  );
  const html = wrapHtml(subject, body);
  const text = `Reset your password\n\nVisit the link below to set a new password:\n${data.resetUrl}\n\nThis link expires in ${data.expiresInHours} hour(s).`;
  return { subject, html, text };
}
