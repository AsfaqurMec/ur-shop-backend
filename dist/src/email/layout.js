"use strict";
/**
 * Base HTML layout for all transactional emails (shared header & footer).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mobileFieldLabel = mobileFieldLabel;
exports.getStoreName = getStoreName;
exports.wrapHtml = wrapHtml;
exports.escapeHtml = escapeHtml;
exports.link = link;
exports.escapeAttr = escapeAttr;
exports.paragraph = paragraph;
const config_1 = require("../config");
const storeSettingsService_1 = require("../services/storeSettingsService");
const ACCENT = '#0d9488';
const ACCENT_DARK = '#0f766e';
const BG_PAGE = '#f0fdfa';
const TEXT_MUTED = '#5c6b69';
function isEmailSafeImageSrc(value) {
    const v = value.trim();
    if (!v)
        return false;
    // Avoid embedding base64/data URLs in email HTML; they can bloat markup and trigger clipping.
    if (v.startsWith('data:'))
        return false;
    return /^https?:\/\//i.test(v);
}
/** Shown only under 600px width when line-item tables stack (no inline display — would block media queries). */
function mobileFieldLabel(text) {
    return `<span class="m-label">${escapeHtml(text)}</span>`;
}
function emailHeadStyles(title) {
    return `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style type="text/css">
    html, body { margin:0 !important; padding:0 !important; height:100% !important; width:100% !important; }
    body { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    img { border:0; outline:none; text-decoration:none; max-width:100%; height:auto; }
    table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    .m-label { display:none !important; font-size:12px !important; line-height:1.45 !important; font-weight:600 !important; color:#57534e !important; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding:16px 10px !important; }
      .email-card { width:100% !important; max-width:100% !important; border-radius:8px !important; }
      .email-header { padding:20px 16px 18px !important; }
      .email-header-kicker { font-size:10px !important; letter-spacing:0.16em !important; }
      .email-header-brand { font-size:19px !important; line-height:1.3 !important; }
      .email-header-tagline { font-size:13px !important; margin-top:8px !important; }
      .email-body { padding:20px 16px 8px !important; font-size:15px !important; }
      .email-footer { padding:16px 16px 22px !important; font-size:12px !important; }
      .m-label { display:inline !important; margin-right:6px !important; }
      .order-line-table { width:100% !important; table-layout:fixed !important; }
      .order-line-table thead { display:none !important; }
      .order-line-table tbody tr { display:block !important; width:100% !important; padding-bottom:4px !important; margin:0 0 14px 0 !important; border-bottom:2px solid #d6d3d1 !important; }
      .order-line-table tbody tr:last-child { border-bottom:none !important; margin-bottom:0 !important; }
      .order-line-table tbody td { display:block !important; width:100% !important; max-width:100% !important; text-align:left !important; padding:10px 6px !important; box-sizing:border-box !important; border-bottom:1px solid #f5f5f4 !important; vertical-align:top !important; }
      .order-line-table tbody td:last-child { border-bottom:none !important; padding-bottom:4px !important; }
    }
  </style>`;
}
function getStoreName() {
    const settings = (0, storeSettingsService_1.getStoreSettingsSnapshot)();
    return settings.siteTitle || settings.storeName || config_1.env.store.name;
}
function wrapHtml(title, bodyHtml) {
    const settings = (0, storeSettingsService_1.getStoreSettingsSnapshot)();
    const brandName = settings.siteTitle || settings.storeName || config_1.env.store.name;
    const name = escapeHtml(brandName);
    const tagline = escapeHtml(settings.emailHeaderSlogan || config_1.env.store.tagline);
    const subTitle = escapeHtml(settings.emailHeaderSubtitle || '');
    const headerLogo = settings.emailHeaderLogo || settings.siteLogo;
    const shopUrl = config_1.env.frontendUrl ? escapeAttr(config_1.env.frontendUrl) : '';
    const shopLink = config_1.env.frontendUrl
        ? `<a href="${shopUrl}" style="color:#fff;text-decoration:none;font-weight:600">${name}</a>`
        : `<span style="font-weight:600">${name}</span>`;
    const supportEmail = settings.emailFooterSupportEmail || settings.contactEmail || config_1.env.store.supportEmail || '';
    const support = supportEmail
        ? `<a href="mailto:${escapeAttr(supportEmail)}" style="color:${ACCENT};text-decoration:none">${escapeHtml(supportEmail)}</a>`
        : '';
    const supportNumber = settings.emailFooterSupportNumber
        ? `<span style="color:${TEXT_MUTED}">Phone: ${escapeHtml(settings.emailFooterSupportNumber)}</span>`
        : '';
    const logoHtml = isEmailSafeImageSrc(headerLogo)
        ? `<div style="margin-bottom:10px"><img src="${escapeAttr(headerLogo)}" alt="${name} logo" style="max-height:56px;max-width:180px"></div>`
        : '';
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  ${emailHeadStyles(title)}
</head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;line-height:1.55;color:#1c1917;background:${BG_PAGE}">
  <table role="presentation" class="email-outer" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;padding:0;background:${BG_PAGE};border-collapse:collapse">
    <tr>
      <td align="center" class="email-wrapper" style="padding:28px 16px">
        <!--[if mso]>
        <table role="presentation" align="center" width="580" cellpadding="0" cellspacing="0" border="0" style="width:580px;border-collapse:collapse"><tr><td>
        <![endif]-->
        <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,118,110,0.12);border:1px solid rgba(13,148,136,0.15);border-collapse:collapse">
          <tr>
            <td class="email-header" style="background:linear-gradient(135deg,${ACCENT_DARK} 0%,${ACCENT} 50%,#134e4a 100%);color:#fff;padding:28px 28px 24px;text-align:center">
              ${logoHtml}
              
              <div class="email-header-brand" style="font-size:22px;line-height:1.25">${shopLink}</div>
              ${subTitle ? `<div style="font-size:12px;opacity:0.86;margin-top:6px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">${subTitle}</div>` : ''}
            </td>
          </tr>
          <tr>
            <td class="email-body" style="padding:28px 28px 8px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;word-break:break-word;overflow-wrap:break-word">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td class="email-footer" style="padding:20px 28px 28px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${TEXT_MUTED};border-top:1px solid #e7e5e4;background:#fafaf9;text-align:center;word-break:break-word;overflow-wrap:break-word">
              
              <p style="margin:0 0 10px">
                ${config_1.env.frontendUrl ? `<a href="${shopUrl}" style="color:${ACCENT};text-decoration:none">Visit shop</a>` : ''}
                ${config_1.env.frontendUrl && support ? ' · ' : ''}
                ${support ? `Support: ${support}` : ''}
              </p>
              ${supportNumber ? `<p style="margin:0 0 10px">${supportNumber}</p>` : ''}
              <p style="margin:0;font-size:11px;color:#a8a29e">This is an automated message. Please do not reply directly unless replying to a support address above.</p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}
function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function link(url, text) {
    const t = text ?? url;
    return `<a href="${escapeAttr(url)}" style="color:${ACCENT};text-decoration:underline;font-weight:500">${escapeHtml(t)}</a>`;
}
function escapeAttr(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function paragraph(html) {
    return `<p style="margin:0 0 14px 0;word-break:break-word;overflow-wrap:break-word">${html}</p>`;
}
//# sourceMappingURL=layout.js.map