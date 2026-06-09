"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderVerifyEmail = renderVerifyEmail;
const layout_1 = require("../layout");
function renderVerifyEmail(data) {
    const subject = `${(0, layout_1.getStoreName)()}: verify your email`;
    const body = (0, layout_1.paragraph)('Please verify your email address by clicking the link below:') + (0, layout_1.paragraph)((0, layout_1.link)(data.verifyUrl, 'Verify my email')) + (0, layout_1.paragraph)('If you did not create an account, you can ignore this email.');
    const html = (0, layout_1.wrapHtml)(subject, body);
    const text = `Verify your email\n\nPlease verify your email address by visiting:\n${data.verifyUrl}\n\nIf you did not create an account, you can ignore this email.`;
    return { subject, html, text };
}
//# sourceMappingURL=verifyEmail.js.map