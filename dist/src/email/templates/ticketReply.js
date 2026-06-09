"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTicketReply = renderTicketReply;
const layout_1 = require("../layout");
function renderTicketReply(data) {
    const subject = `${(0, layout_1.getStoreName)()}: reply on ticket #${data.ticketId} — ${data.subject}`;
    let body = (0, layout_1.paragraph)('You have a new reply on your support ticket.') + (0, layout_1.paragraph)(`<strong>${(0, layout_1.escapeHtml)(data.subject)}</strong>`) + (0, layout_1.paragraph)((0, layout_1.escapeHtml)(data.messagePreview));
    if (data.ticketUrl) {
        body += (0, layout_1.paragraph)((0, layout_1.link)(data.ticketUrl, 'View ticket and reply'));
    }
    else {
        body += (0, layout_1.paragraph)(`View and reply in your dashboard (Ticket #${data.ticketId}).`);
    }
    const html = (0, layout_1.wrapHtml)(subject, body);
    const text = `${subject}\n\n${data.messagePreview}\n\n${data.ticketUrl ? data.ticketUrl : 'View and reply in your dashboard.'}`;
    return { subject, html, text };
}
//# sourceMappingURL=ticketReply.js.map