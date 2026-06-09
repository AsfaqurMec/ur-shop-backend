"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPasswordReset = renderPasswordReset;
const layout_1 = require("../layout");
function renderPasswordReset(data) {
    const subject = `${(0, layout_1.getStoreName)()}: reset your password`;
    const body = (0, layout_1.paragraph)('You requested a password reset. Click the link below to set a new password:') + (0, layout_1.paragraph)((0, layout_1.link)(data.resetUrl, 'Reset password')) + (0, layout_1.paragraph)(`This link expires in ${data.expiresInHours} hour(s). If you did not request this, you can ignore this email.`);
    const html = (0, layout_1.wrapHtml)(subject, body);
    const text = `Reset your password\n\nVisit the link below to set a new password:\n${data.resetUrl}\n\nThis link expires in ${data.expiresInHours} hour(s).`;
    return { subject, html, text };
}
//# sourceMappingURL=passwordReset.js.map