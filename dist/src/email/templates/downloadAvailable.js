"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderDownloadAvailable = renderDownloadAvailable;
const layout_1 = require("../layout");
function renderDownloadAvailable(data) {
    const subject = `Download ready – ${data.productName}`;
    let body = (0, layout_1.paragraph)(`Your download for <strong>${(0, layout_1.escapeHtml)(data.productName)}</strong> is ready.`) + (0, layout_1.paragraph)(`File: ${(0, layout_1.escapeHtml)(data.fileName)}`);
    if (data.dashboardUrl) {
        body += (0, layout_1.paragraph)(`You can download it from your ${(0, layout_1.link)(data.dashboardUrl, 'dashboard')}.`);
    }
    else {
        body += (0, layout_1.paragraph)('You can download it from your account dashboard.');
    }
    const html = (0, layout_1.wrapHtml)(subject, body);
    const text = `Download ready – ${data.productName}\n\nFile: ${data.fileName}\n\nDownload from your account dashboard.`;
    return { subject, html, text };
}
//# sourceMappingURL=downloadAvailable.js.map