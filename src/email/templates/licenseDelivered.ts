import { wrapHtml, paragraph, escapeHtml, link, getStoreName } from '../layout';

export interface LicenseDeliveredData {
  orderNumber: string;
  productName: string;
  /** Single key (use this or licenseKeys) */
  licenseKey?: string;
  /** Multiple keys for the same line item */
  licenseKeys?: string[];
  dashboardUrl?: string;
}

function collectKeys(data: LicenseDeliveredData): string[] {
  if (data.licenseKeys?.length) return data.licenseKeys;
  if (data.licenseKey) return [data.licenseKey];
  return [];
}

export function renderLicenseDelivered(data: LicenseDeliveredData): { subject: string; html: string; text: string } {
  const keys = collectKeys(data);
  const store = getStoreName();
  const subject =
    keys.length > 1
      ? `${store}: ${keys.length} license keys — ${data.productName}`
      : `${store}: license key — ${data.productName}`;

  const keysHtml = keys
    .map(
      (k) =>
        `<div style="margin:8px 0;padding:10px 14px;background:#f5f5f4;border-radius:8px;font-family:ui-monospace,monospace;font-size:14px;word-break:break-all">${escapeHtml(k)}</div>`
    )
    .join('');

  let body =
    paragraph(
      `Your license for <strong>${escapeHtml(data.productName)}</strong> (order <strong>#${escapeHtml(data.orderNumber)}</strong>) is ready.`
    ) + keysHtml;

  if (data.dashboardUrl) {
    body += paragraph(`You can also view keys in your ${link(data.dashboardUrl, 'licenses dashboard')}.`);
  } else {
    body += paragraph('You can view your keys anytime in your account dashboard.');
  }

  const html = wrapHtml(subject, body);
  const text = [
    subject,
    '',
    `Order #${data.orderNumber}`,
    '',
    ...keys.map((k) => k),
    '',
    data.dashboardUrl ?? 'View keys in your dashboard.',
  ].join('\n');

  return { subject, html, text };
}
