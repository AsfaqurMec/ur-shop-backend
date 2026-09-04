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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTicket = createTicket;
exports.listMyTickets = listMyTickets;
exports.getMyTicketCount = getMyTicketCount;
exports.getTicketDetails = getTicketDetails;
exports.reply = reply;
exports.listAllTickets = listAllTickets;
exports.getAdminTicketCount = getAdminTicketCount;
exports.getTicketDetailsAdmin = getTicketDetailsAdmin;
exports.updateStatus = updateStatus;
exports.adminReply = adminReply;
exports.downloadAttachment = downloadAttachment;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const apiResponse_1 = require("../utils/apiResponse");
const ticketService = __importStar(require("../services/ticketService"));
const TICKET_STATUSES = ['open', 'answered', 'customer_reply', 'closed'];
function parseBodyTicketStatus(body) {
    if (typeof body !== 'object' || body === null)
        return null;
    const raw = body.status;
    return typeof raw === 'string' && TICKET_STATUSES.includes(raw)
        ? raw
        : null;
}
const upload_1 = require("../middlewares/upload");
async function createTicket(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const userId = req.user.id;
    const subject = req.body.subject?.trim();
    const message = req.body.message?.trim();
    const orderId = req.body.order_id != null ? Number(req.body.order_id) : null;
    const file = req.file;
    let attachment_path = null;
    let attachment_name = null;
    let attachment_size = null;
    if (file?.filename) {
        attachment_path = (0, upload_1.getTicketAttachmentRelativePath)(file.filename);
        attachment_name = file.originalname || file.filename;
        attachment_size = file.size ?? null;
    }
    const ticket = await ticketService.createTicket(userId, {
        subject,
        message,
        order_id: orderId && Number.isInteger(Number(orderId)) ? orderId : null,
        attachment_path,
        attachment_name,
        attachment_size,
    });
    return (0, apiResponse_1.sendSuccess)(res, ticket, 201, 'Ticket created');
}
async function listMyTickets(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const statusRaw = req.query.status;
    const status = statusRaw && TICKET_STATUSES.includes(statusRaw)
        ? statusRaw
        : undefined;
    const limitRaw = req.query.limit;
    const offsetRaw = req.query.offset;
    const limit = limitRaw !== undefined && limitRaw !== '' ? Number(limitRaw) : 20;
    const offset = offsetRaw !== undefined && offsetRaw !== '' ? Number(offsetRaw) : 0;
    const result = await ticketService.listMyTickets(req.user.id, {
        status,
        limit: Number.isFinite(limit) ? limit : 20,
        offset: Number.isFinite(offset) ? offset : 0,
    });
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getMyTicketCount(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const raw = req.query.status;
    const status = (raw ?? 'answered');
    if (!TICKET_STATUSES.includes(status)) {
        return (0, apiResponse_1.sendError)(res, 'Invalid status', 400);
    }
    const result = await ticketService.countMyTicketsByStatus(req.user.id, status);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getTicketDetails(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const ticketId = Number(req.params.ticketId);
    const ticket = await ticketService.getTicketDetails(req.user.id, ticketId);
    return (0, apiResponse_1.sendSuccess)(res, ticket);
}
async function reply(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const ticketId = Number(req.params.ticketId);
    const message = req.body.message?.trim();
    const file = req.file;
    let attachment_path = null;
    let attachment_name = null;
    let attachment_size = null;
    if (file?.filename) {
        attachment_path = (0, upload_1.getTicketAttachmentRelativePath)(file.filename);
        attachment_name = file.originalname || file.filename;
        attachment_size = file.size ?? null;
    }
    const ticket = await ticketService.reply(req.user.id, ticketId, {
        message,
        attachment_path,
        attachment_name,
        attachment_size,
    });
    return (0, apiResponse_1.sendSuccess)(res, ticket, 200, 'Reply sent');
}
// ---- Admin ----
async function listAllTickets(req, res) {
    const status = req.query.status;
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
    const result = await ticketService.listAllTickets({
        status: status,
        limit,
        offset,
    });
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getAdminTicketCount(req, res) {
    const raw = req.query.status;
    const status = (raw ?? 'open');
    if (!TICKET_STATUSES.includes(status)) {
        return (0, apiResponse_1.sendError)(res, 'Invalid status', 400);
    }
    const result = await ticketService.countTicketsByStatus(status);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getTicketDetailsAdmin(req, res) {
    const ticketId = Number(req.params.ticketId);
    const ticket = await ticketService.getTicketDetailsAdmin(ticketId);
    return (0, apiResponse_1.sendSuccess)(res, ticket);
}
async function updateStatus(req, res) {
    const ticketId = Number(req.params.ticketId);
    const status = parseBodyTicketStatus(req.body);
    if (!status)
        return (0, apiResponse_1.sendError)(res, 'Invalid status', 400);
    const ticket = await ticketService.updateStatus(ticketId, status);
    return (0, apiResponse_1.sendSuccess)(res, ticket, 200, 'Status updated');
}
async function adminReply(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const adminId = req.user.id;
    const ticketId = Number(req.params.ticketId);
    const message = req.body.message?.trim();
    const file = req.file;
    let attachment_path = null;
    let attachment_name = null;
    let attachment_size = null;
    if (file?.filename) {
        attachment_path = (0, upload_1.getTicketAttachmentRelativePath)(file.filename);
        attachment_name = file.originalname || file.filename;
        attachment_size = file.size ?? null;
    }
    const ticket = await ticketService.adminReply(adminId, ticketId, {
        message,
        attachment_path,
        attachment_name,
        attachment_size,
    });
    return (0, apiResponse_1.sendSuccess)(res, ticket, 200, 'Reply sent');
}
// ---- Attachment download (auth: customer own ticket or admin) ----
async function downloadAttachment(req, res) {
    if (!req.user) {
        (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
        return;
    }
    const attachmentId = Number(req.params.attachmentId);
    const isAdmin = req.user.role === 'admin';
    const userId = isAdmin ? undefined : req.user.id;
    const { file_path, file_name } = await ticketService.getAttachmentForDownload(attachmentId, {
        userId,
        isAdmin,
    });
    const absolutePath = (0, upload_1.getTicketAttachmentAbsolutePath)(file_path);
    if (!fs_1.default.existsSync(absolutePath)) {
        (0, apiResponse_1.sendError)(res, 'File not found', 404);
        return;
    }
    const safeName = path_1.default.basename(file_name) || 'attachment';
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName.replace(/"/g, '\\"')}"`);
    const stream = fs_1.default.createReadStream(absolutePath);
    stream.on('error', () => {
        if (!res.headersSent)
            res.status(500).end();
        else
            res.end();
    });
    stream.pipe(res);
}
//# sourceMappingURL=ticketController.js.map