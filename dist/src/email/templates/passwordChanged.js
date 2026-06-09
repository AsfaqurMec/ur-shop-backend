"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPasswordChanged = renderPasswordChanged;
const layout_1 = require("../layout");
function renderPasswordChanged(data) {
    const store = (0, layout_1.getStoreName)();
    const subject = `${store}: your password was updated`;
    const greeting = data.name ? `Hi ${(0, layout_1.escapeHtml)(data.name)},` : 'Hi,';
    let body = (0, layout_1.paragraph)(greeting) +
        (0, layout_1.paragraph)('Your account password was just changed using a password reset link. You can sign in with your new password.');
    if (data.loginUrl) {
        body += (0, layout_1.paragraph)(`If this was you, no further action is needed. ${(0, layout_1.link)(data.loginUrl, 'Sign in')}`);
    }
    else {
        body += (0, layout_1.paragraph)('If this was you, no further action is needed.');
    }
    body += (0, layout_1.paragraph)('<strong>If you did not change your password,</strong> contact support immediately — someone else may have access to your account.');
    const html = (0, layout_1.wrapHtml)(subject, body);
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
//# sourceMappingURL=passwordChanged.js.map