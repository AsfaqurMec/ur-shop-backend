import { wrapHtml, paragraph, escapeHtml, getStoreName, link } from '../layout';

export interface PasswordChangedData {
  name?: string;
  loginUrl?: string;
}

export function renderPasswordChanged(data: PasswordChangedData): { subject: string; html: string; text: string } {
  const store = getStoreName();
  const subject = `${store}: your password was updated`;
  const greeting = data.name ? `Hi ${escapeHtml(data.name)},` : 'Hi,';
  let body =
    paragraph(greeting) +
    paragraph(
      'Your account password was just changed using a password reset link. You can sign in with your new password.'
    );
  if (data.loginUrl) {
    body += paragraph(`If this was you, no further action is needed. ${link(data.loginUrl, 'Sign in')}`);
  } else {
    body += paragraph('If this was you, no further action is needed.');
  }
  body += paragraph(
    '<strong>If you did not change your password,</strong> contact support immediately — someone else may have access to your account.'
  );
  const html = wrapHtml(subject, body);
  const text = [
    `${subject}`,
    '',
    data.name ? `Hi ${data.name},` : 'Hi,',
    '',
    'Your password was changed via the reset link.',
    data.loginUrl ? `Sign in: ${data.loginUrl}` : '',
    '',
    'If you did not do this, contact support right away.',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, html, text };
}
