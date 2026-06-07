import { wrapHtml, paragraph, escapeHtml, link } from '../layout';

export interface DownloadAvailableData {
  orderNumber: string;
  productName: string;
  fileName: string;
  dashboardUrl?: string;
}

export function renderDownloadAvailable(data: DownloadAvailableData): { subject: string; html: string; text: string } {
  const subject = `Download ready – ${data.productName}`;
  let body = paragraph(
    `Your download for <strong>${escapeHtml(data.productName)}</strong> is ready.`
  ) + paragraph(
    `File: ${escapeHtml(data.fileName)}`
  );
  if (data.dashboardUrl) {
    body += paragraph(
      `You can download it from your ${link(data.dashboardUrl, 'dashboard')}.`
    );
  } else {
    body += paragraph('You can download it from your account dashboard.');
  }
  const html = wrapHtml(subject, body);
  const text = `Download ready – ${data.productName}\n\nFile: ${data.fileName}\n\nDownload from your account dashboard.`;
  return { subject, html, text };
}
