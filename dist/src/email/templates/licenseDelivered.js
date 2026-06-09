"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderLicenseDelivered = renderLicenseDelivered;
const layout_1 = require("../layout");
function collectKeys(data) {
    if (data.licenseKeys?.length)
        return data.licenseKeys;
    if (data.licenseKey)
        return [data.licenseKey];
    return [];
}
function renderLicenseDelivered(data) {
    const keys = collectKeys(data);
    const store = (0, layout_1.getStoreName)();
    const subject = keys.length > 1
        ? `${store}: ${keys.length} license keys — ${data.productName}`
        : `${store}: license key — ${data.productName}`;
    const keysHtml = keys
        .map((k) => `<div style="margin:8px 0;padding:10px 14px;background:#f5f5f4;border-radius:8px;font-family:ui-monospace,monospace;font-size:14px;word-break:break-all">${(0, layout_1.escapeHtml)(k)}</div>`)
        .join('');
    let body = (0, layout_1.paragraph)(`Your license for <strong>${(0, layout_1.escapeHtml)(data.productName)}</strong> (order <strong>#${(0, layout_1.escapeHtml)(data.orderNumber)}</strong>) is ready.`) + keysHtml;
    if (data.dashboardUrl) {
        body += (0, layout_1.paragraph)(`You can also view keys in your ${(0, layout_1.link)(data.dashboardUrl, 'licenses dashboard')}.`);
    }
    else {
        body += (0, layout_1.paragraph)('You can view your keys anytime in your account dashboard.');
    }
    const html = (0, layout_1.wrapHtml)(subject, body);
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
//# sourceMappingURL=licenseDelivered.js.map