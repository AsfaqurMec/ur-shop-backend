"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTicket = createTicket;
exports.listMyTickets = listMyTickets;
exports.getTicketDetails = getTicketDetails;
exports.getTicketDetailsAdmin = getTicketDetailsAdmin;
exports.countTicketsByStatus = countTicketsByStatus;
exports.countMyTicketsByStatus = countMyTicketsByStatus;
exports.listAllTickets = listAllTickets;
exports.reply = reply;
exports.adminReply = adminReply;
exports.updateStatus = updateStatus;
exports.getAttachmentForDownload = getAttachmentForDownload;
const errorHandler_1 = require("../middlewares/errorHandler");
const ticketRepo = __importStar(require("../repositories/ticketRepository"));
const ticketMessageRepo = __importStar(require("../repositories/ticketMessageRepository"));
const ticketAttachmentRepo = __importStar(require("../repositories/ticketAttachmentRepository"));
const orderRepo = __importStar(require("../repositories/orderRepository"));
const authRepo = __importStar(require("../repositories/authRepository"));
const emailService = __importStar(require("./emailService"));
const config_1 = require("../config");
const TICKET_EXCERPT_MAX = 500;
function truncateTicketExcerpt(text) {
    const t = text.replace(/\s+/g, ' ').trim();
    return t.length <= TICKET_EXCERPT_MAX ? t : `${t.slice(0, TICKET_EXCERPT_MAX)}…`;
}
async function notifyAdminsTicketEvent(params) {
    const recipients = config_1.env.mail.adminNotificationEmails;
    if (recipients.length === 0)
        return;
    const adminUrl = config_1.env.frontendUrl ? `${config_1.env.frontendUrl}/admin/tickets/${params.ticketId}` : undefined;
    const payload = {
        ticketId: params.ticketId,
        subject: params.subject,
        excerpt: params.excerpt,
        eventTitle: params.eventTitle,
        adminUrl,
    };
    await Promise.all(recipients.map((to) => emailService.sendAdminTicketNotifyEmail(to, payload)));
}
async function notifyCustomerAdminReplied(params) {
    const user = await authRepo.findUserById(params.userId);
    if (!user)
        return;
    const ticketUrl = config_1.env.frontendUrl ? `${config_1.env.frontendUrl}/dashboard/tickets/${params.ticketId}` : undefined;
    await emailService.sendTicketReplyEmail(user.email, {
        ticketId: params.ticketId,
        subject: params.subject,
        messagePreview: truncateTicketExcerpt(params.message),
        ticketUrl,
    });
}
/** Customer: create ticket with optional order link and optional first-message attachment. */
async function createTicket(userId, data) {
    let orderId = data.order_id ?? null;
    if (orderId != null) {
        const order = await orderRepo.findOrderById(orderId);
        if (!order || order.user_id !== userId)
            throw new errorHandler_1.AppError(403, 'Order not found or access denied');
    }
    const ticketId = await ticketRepo.create({
        user_id: userId,
        order_id: orderId,
        subject: data.subject,
    });
    await ticketMessageRepo.create({
        ticket_id: ticketId,
        sender_type: 'user',
        user_id: userId,
        admin_id: null,
        message: data.message,
    });
    let messageId;
    const messages = await ticketMessageRepo.findByTicketId(ticketId);
    if (messages.length > 0)
        messageId = messages[messages.length - 1].id;
    if (messageId != null && data.attachment_path) {
        await ticketAttachmentRepo.create({
            ticket_message_id: messageId,
            file_path: data.attachment_path,
            file_name: data.attachment_name ?? 'attachment',
            file_size: data.attachment_size ?? null,
        });
    }
    void notifyAdminsTicketEvent({
        ticketId,
        subject: data.subject,
        excerpt: truncateTicketExcerpt(data.message),
        eventTitle: 'New support ticket',
    }).catch((err) => {
        if (config_1.env.nodeEnv !== 'test')
            console.error('[Mail] Admin new-ticket notify failed:', err);
    });
    return requireTicketDetails(ticketId);
}
/** Customer: list own tickets (paginated, optional status filter). */
async function listMyTickets(userId, options = {}) {
    const limit = options.limit != null ? Math.min(Math.max(1, options.limit), 200) : 20;
    const offset = options.offset != null ? Math.max(0, options.offset) : 0;
    const [rows, total] = await Promise.all([
        ticketRepo.findTicketsForUser(userId, { status: options.status, limit, offset }),
        ticketRepo.countTicketsForUser(userId, { status: options.status }),
    ]);
    const tickets = rows.map((r) => ({
        id: r.id,
        subject: r.subject,
        status: r.status,
        order_id: r.order_id,
        order_number: r.order_number,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
    }));
    return { tickets, total };
}
/** Customer: get ticket details (must own ticket). */
async function getTicketDetails(userId, ticketId) {
    const ticket = await ticketRepo.findById(ticketId);
    if (!ticket)
        throw new errorHandler_1.AppError(404, 'Ticket not found');
    if (ticket.user_id !== userId)
        throw new errorHandler_1.AppError(403, 'Forbidden');
    return requireTicketDetails(ticketId);
}
/** Admin: get any ticket details. */
async function getTicketDetailsAdmin(ticketId) {
    const ticket = await ticketRepo.findById(ticketId);
    if (!ticket)
        throw new errorHandler_1.AppError(404, 'Ticket not found');
    return requireTicketDetails(ticketId);
}
/** Admin: count tickets with a given status (e.g. open). */
async function countTicketsByStatus(status) {
    const count = await ticketRepo.countByStatus(status);
    return { count };
}
/** Customer: count own tickets with a given status (e.g. answered). */
async function countMyTicketsByStatus(userId, status) {
    const count = await ticketRepo.countByUserIdAndStatus(userId, status);
    return { count };
}
/** Admin: list all tickets with optional status filter. */
async function listAllTickets(options = {}) {
    const rows = await ticketRepo.findAll(options);
    const tickets = rows.map((r) => ({
        id: r.id,
        subject: r.subject,
        status: r.status,
        order_id: r.order_id,
        order_number: r.order_number,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
    }));
    return { tickets };
}
/** Customer: reply to own ticket; optional attachment. Sets status to customer_reply. */
async function reply(userId, ticketId, data) {
    const ticket = await ticketRepo.findById(ticketId);
    if (!ticket)
        throw new errorHandler_1.AppError(404, 'Ticket not found');
    if (ticket.user_id !== userId)
        throw new errorHandler_1.AppError(403, 'Forbidden');
    if (ticket.status === 'closed')
        throw new errorHandler_1.AppError(400, 'Cannot reply to a closed ticket');
    const messageId = await ticketMessageRepo.create({
        ticket_id: ticketId,
        sender_type: 'user',
        user_id: userId,
        admin_id: null,
        message: data.message,
    });
    if (data.attachment_path) {
        await ticketAttachmentRepo.create({
            ticket_message_id: messageId,
            file_path: data.attachment_path,
            file_name: data.attachment_name ?? 'attachment',
            file_size: data.attachment_size ?? null,
        });
    }
    await ticketRepo.updateStatus(ticketId, 'customer_reply');
    void notifyAdminsTicketEvent({
        ticketId,
        subject: ticket.subject,
        excerpt: truncateTicketExcerpt(data.message),
        eventTitle: 'Customer replied on ticket',
    }).catch((err) => {
        if (config_1.env.nodeEnv !== 'test')
            console.error('[Mail] Admin ticket-reply notify failed:', err);
    });
    return requireTicketDetails(ticketId);
}
/** Admin: reply to ticket. Sets status to answered. */
async function adminReply(adminId, ticketId, data) {
    const ticket = await ticketRepo.findById(ticketId);
    if (!ticket)
        throw new errorHandler_1.AppError(404, 'Ticket not found');
    if (ticket.status === 'closed')
        throw new errorHandler_1.AppError(400, 'Cannot reply to a closed ticket');
    const messageId = await ticketMessageRepo.create({
        ticket_id: ticketId,
        sender_type: 'admin',
        user_id: null,
        admin_id: adminId,
        message: data.message,
    });
    if (data.attachment_path) {
        await ticketAttachmentRepo.create({
            ticket_message_id: messageId,
            file_path: data.attachment_path,
            file_name: data.attachment_name ?? 'attachment',
            file_size: data.attachment_size ?? null,
        });
    }
    await ticketRepo.updateStatus(ticketId, 'answered');
    void notifyCustomerAdminReplied({
        userId: ticket.user_id,
        ticketId,
        subject: ticket.subject,
        message: data.message,
    }).catch((err) => {
        if (config_1.env.nodeEnv !== 'test')
            console.error('[Mail] Ticket reply to customer failed:', err);
    });
    return requireTicketDetails(ticketId);
}
/** Admin: change ticket status. */
async function updateStatus(ticketId, status) {
    const ticket = await ticketRepo.findById(ticketId);
    if (!ticket)
        throw new errorHandler_1.AppError(404, 'Ticket not found');
    await ticketRepo.updateStatus(ticketId, status);
    return requireTicketDetails(ticketId);
}
/** Resolve attachment download path for response (API path for frontend). */
function attachmentUrlPath(attachmentId) {
    return `${config_1.env.apiPrefix}/tickets/attachments/${attachmentId}`;
}
async function getTicketDetailsInternal(ticketId) {
    const row = await ticketRepo.findByIdWithOrderNumber(ticketId);
    if (!row)
        return null;
    const messages = await ticketMessageRepo.findByTicketId(ticketId);
    const messageDtos = [];
    for (const msg of messages) {
        const attachments = await ticketAttachmentRepo.findByMessageId(msg.id);
        const attachmentDtos = attachments.map((a) => ({
            id: a.id,
            file_name: a.file_name,
            file_size: a.file_size,
            url_path: attachmentUrlPath(a.id),
        }));
        messageDtos.push({
            id: msg.id,
            sender_type: msg.sender_type,
            message: msg.message,
            created_at: msg.created_at.toISOString(),
            attachments: attachmentDtos,
        });
    }
    return {
        id: row.id,
        subject: row.subject,
        status: row.status,
        order_id: row.order_id,
        order_number: row.order_number ?? null,
        user_id: row.user_id,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
        messages: messageDtos,
    };
}
async function requireTicketDetails(ticketId) {
    const details = await getTicketDetailsInternal(ticketId);
    if (!details)
        throw new errorHandler_1.AppError(404, 'Ticket not found');
    return details;
}
/** Get attachment for download; throws if not found or access denied. */
async function getAttachmentForDownload(attachmentId, options) {
    const att = await ticketAttachmentRepo.findByIdWithTicketId(attachmentId);
    if (!att)
        throw new errorHandler_1.AppError(404, 'Attachment not found');
    if (!options.isAdmin && options.userId != null) {
        const ticket = await ticketRepo.findById(att.ticket_id);
        if (!ticket || ticket.user_id !== options.userId)
            throw new errorHandler_1.AppError(403, 'Forbidden');
    }
    return { file_path: att.file_path, file_name: att.file_name };
}
//# sourceMappingURL=ticketService.js.map