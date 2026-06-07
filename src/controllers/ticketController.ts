import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as ticketService from '../services/ticketService';
import type { TicketStatus } from '../types/ticket';

const TICKET_STATUSES: readonly TicketStatus[] = ['open', 'answered', 'customer_reply', 'closed'];

function parseBodyTicketStatus(body: unknown): TicketStatus | null {
  if (typeof body !== 'object' || body === null) return null;
  const raw = (body as { status?: unknown }).status;
  return typeof raw === 'string' && (TICKET_STATUSES as readonly string[]).includes(raw)
    ? (raw as TicketStatus)
    : null;
}
import { getTicketAttachmentRelativePath, getTicketAttachmentAbsolutePath } from '../middlewares/upload';

export async function createTicket(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const userId = req.user.id;
  const subject = (req.body.subject as string)?.trim();
  const message = (req.body.message as string)?.trim();
  const orderId = req.body.order_id != null ? Number(req.body.order_id) : null;
  const file = req.file;

  let attachment_path: string | null = null;
  let attachment_name: string | null = null;
  let attachment_size: number | null = null;
  if (file?.filename) {
    attachment_path = getTicketAttachmentRelativePath(file.filename);
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
  return sendSuccess(res, ticket, 201, 'Ticket created');
}

export async function listMyTickets(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const statusRaw = req.query.status as string | undefined;
  const status =
    statusRaw && (TICKET_STATUSES as readonly string[]).includes(statusRaw)
      ? (statusRaw as TicketStatus)
      : undefined;
  const limitRaw = req.query.limit;
  const offsetRaw = req.query.offset;
  const limit =
    limitRaw !== undefined && limitRaw !== '' ? Number(limitRaw) : 20;
  const offset =
    offsetRaw !== undefined && offsetRaw !== '' ? Number(offsetRaw) : 0;
  const result = await ticketService.listMyTickets(req.user.id, {
    status,
    limit: Number.isFinite(limit) ? limit : 20,
    offset: Number.isFinite(offset) ? offset : 0,
  });
  return sendSuccess(res, result);
}

export async function getMyTicketCount(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const raw = req.query.status as string | undefined;
  const status = (raw ?? 'answered') as TicketStatus;
  if (!(TICKET_STATUSES as readonly string[]).includes(status)) {
    return sendError(res, 'Invalid status', 400);
  }
  const result = await ticketService.countMyTicketsByStatus(req.user.id, status);
  return sendSuccess(res, result);
}

export async function getTicketDetails(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const ticketId = Number(req.params.ticketId);
  const ticket = await ticketService.getTicketDetails(req.user.id, ticketId);
  return sendSuccess(res, ticket);
}

export async function reply(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const ticketId = Number(req.params.ticketId);
  const message = (req.body.message as string)?.trim();
  const file = req.file;

  let attachment_path: string | null = null;
  let attachment_name: string | null = null;
  let attachment_size: number | null = null;
  if (file?.filename) {
    attachment_path = getTicketAttachmentRelativePath(file.filename);
    attachment_name = file.originalname || file.filename;
    attachment_size = file.size ?? null;
  }

  const ticket = await ticketService.reply(req.user.id, ticketId, {
    message,
    attachment_path,
    attachment_name,
    attachment_size,
  });
  return sendSuccess(res, ticket, 200, 'Reply sent');
}

// ---- Admin ----
export async function listAllTickets(req: Request, res: Response): Promise<Response> {
  const status = req.query.status as string | undefined;
  const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
  const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
  const result = await ticketService.listAllTickets({
    status: status as 'open' | 'answered' | 'customer_reply' | 'closed' | undefined,
    limit,
    offset,
  });
  return sendSuccess(res, result);
}

export async function getAdminTicketCount(req: Request, res: Response): Promise<Response> {
  const raw = req.query.status as string | undefined;
  const status = (raw ?? 'open') as TicketStatus;
  if (!(TICKET_STATUSES as readonly string[]).includes(status)) {
    return sendError(res, 'Invalid status', 400);
  }
  const result = await ticketService.countTicketsByStatus(status);
  return sendSuccess(res, result);
}

export async function getTicketDetailsAdmin(req: Request, res: Response): Promise<Response> {
  const ticketId = Number(req.params.ticketId);
  const ticket = await ticketService.getTicketDetailsAdmin(ticketId);
  return sendSuccess(res, ticket);
}

export async function updateStatus(req: Request, res: Response): Promise<Response> {
  const ticketId = Number(req.params.ticketId);
  const status = parseBodyTicketStatus(req.body);
  if (!status) return sendError(res, 'Invalid status', 400);
  const ticket = await ticketService.updateStatus(ticketId, status);
  return sendSuccess(res, ticket, 200, 'Status updated');
}

export async function adminReply(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const adminId = req.user.id;
  const ticketId = Number(req.params.ticketId);
  const message = (req.body.message as string)?.trim();
  const file = req.file;

  let attachment_path: string | null = null;
  let attachment_name: string | null = null;
  let attachment_size: number | null = null;
  if (file?.filename) {
    attachment_path = getTicketAttachmentRelativePath(file.filename);
    attachment_name = file.originalname || file.filename;
    attachment_size = file.size ?? null;
  }

  const ticket = await ticketService.adminReply(adminId, ticketId, {
    message,
    attachment_path,
    attachment_name,
    attachment_size,
  });
  return sendSuccess(res, ticket, 200, 'Reply sent');
}

// ---- Attachment download (auth: customer own ticket or admin) ----
export async function downloadAttachment(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'Unauthorized', 401);
    return;
  }
  const attachmentId = Number(req.params.attachmentId);
  const isAdmin = req.user.role === 'admin';
  const userId = isAdmin ? undefined : req.user.id;

  const { file_path, file_name } = await ticketService.getAttachmentForDownload(attachmentId, {
    userId,
    isAdmin,
  });
  const absolutePath = getTicketAttachmentAbsolutePath(file_path);
  if (!fs.existsSync(absolutePath)) {
    sendError(res, 'File not found', 404);
    return;
  }
  const safeName = path.basename(file_name) || 'attachment';
  res.setHeader('Content-Disposition', `attachment; filename="${safeName.replace(/"/g, '\\"')}"`);
  const stream = fs.createReadStream(absolutePath);
  stream.on('error', () => {
    if (!res.headersSent) res.status(500).end();
    else res.end();
  });
  stream.pipe(res);
}
