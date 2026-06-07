import { AppError } from '../middlewares/errorHandler';
import * as ticketRepo from '../repositories/ticketRepository';
import * as ticketMessageRepo from '../repositories/ticketMessageRepository';
import * as ticketAttachmentRepo from '../repositories/ticketAttachmentRepository';
import * as orderRepo from '../repositories/orderRepository';
import * as authRepo from '../repositories/authRepository';
import * as emailService from './emailService';
import type {
  TicketStatus,
  TicketListItemPublic,
  TicketDetailPublic,
  TicketMessagePublic,
  TicketAttachmentPublic,
} from '../types/ticket';
import { env } from '../config';

const TICKET_EXCERPT_MAX = 500;

function truncateTicketExcerpt(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= TICKET_EXCERPT_MAX ? t : `${t.slice(0, TICKET_EXCERPT_MAX)}…`;
}

async function notifyAdminsTicketEvent(params: {
  ticketId: number;
  subject: string;
  excerpt: string;
  eventTitle: string;
}): Promise<void> {
  const recipients = env.mail.adminNotificationEmails;
  if (recipients.length === 0) return;
  const adminUrl = env.frontendUrl ? `${env.frontendUrl}/admin/tickets/${params.ticketId}` : undefined;
  const payload = {
    ticketId: params.ticketId,
    subject: params.subject,
    excerpt: params.excerpt,
    eventTitle: params.eventTitle,
    adminUrl,
  };
  await Promise.all(recipients.map((to) => emailService.sendAdminTicketNotifyEmail(to, payload)));
}

async function notifyCustomerAdminReplied(params: {
  userId: number;
  ticketId: number;
  subject: string;
  message: string;
}): Promise<void> {
  const user = await authRepo.findUserById(params.userId);
  if (!user) return;
  const ticketUrl = env.frontendUrl ? `${env.frontendUrl}/dashboard/tickets/${params.ticketId}` : undefined;
  await emailService.sendTicketReplyEmail(user.email, {
    ticketId: params.ticketId,
    subject: params.subject,
    messagePreview: truncateTicketExcerpt(params.message),
    ticketUrl,
  });
}

/** Customer: create ticket with optional order link and optional first-message attachment. */
export async function createTicket(
  userId: number,
  data: {
    subject: string;
    message: string;
    order_id?: number | null;
    attachment_path?: string | null;
    attachment_name?: string | null;
    attachment_size?: number | null;
  }
): Promise<TicketDetailPublic> {
  let orderId: number | null = data.order_id ?? null;
  if (orderId != null) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order || order.user_id !== userId) throw new AppError(403, 'Order not found or access denied');
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

  let messageId: number | undefined;
  const messages = await ticketMessageRepo.findByTicketId(ticketId);
  if (messages.length > 0) messageId = messages[messages.length - 1].id;

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
    if (env.nodeEnv !== 'test') console.error('[Mail] Admin new-ticket notify failed:', err);
  });

  return requireTicketDetails(ticketId);
}

/** Customer: list own tickets (paginated, optional status filter). */
export async function listMyTickets(
  userId: number,
  options: { status?: TicketStatus; limit?: number; offset?: number } = {}
): Promise<{ tickets: TicketListItemPublic[]; total: number }> {
  const limit = options.limit != null ? Math.min(Math.max(1, options.limit), 200) : 20;
  const offset = options.offset != null ? Math.max(0, options.offset) : 0;
  const [rows, total] = await Promise.all([
    ticketRepo.findTicketsForUser(userId, { status: options.status, limit, offset }),
    ticketRepo.countTicketsForUser(userId, { status: options.status }),
  ]);
  const tickets: TicketListItemPublic[] = rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    status: r.status as TicketStatus,
    order_id: r.order_id,
    order_number: r.order_number,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  }));
  return { tickets, total };
}

/** Customer: get ticket details (must own ticket). */
export async function getTicketDetails(userId: number, ticketId: number): Promise<TicketDetailPublic> {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError(404, 'Ticket not found');
  if (ticket.user_id !== userId) throw new AppError(403, 'Forbidden');
  return requireTicketDetails(ticketId);
}

/** Admin: get any ticket details. */
export async function getTicketDetailsAdmin(ticketId: number): Promise<TicketDetailPublic> {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError(404, 'Ticket not found');
  return requireTicketDetails(ticketId);
}

/** Admin: count tickets with a given status (e.g. open). */
export async function countTicketsByStatus(status: TicketStatus): Promise<{ count: number }> {
  const count = await ticketRepo.countByStatus(status);
  return { count };
}

/** Customer: count own tickets with a given status (e.g. answered). */
export async function countMyTicketsByStatus(
  userId: number,
  status: TicketStatus
): Promise<{ count: number }> {
  const count = await ticketRepo.countByUserIdAndStatus(userId, status);
  return { count };
}

/** Admin: list all tickets with optional status filter. */
export async function listAllTickets(options: {
  status?: TicketStatus;
  limit?: number;
  offset?: number;
} = {}): Promise<{ tickets: TicketListItemPublic[] }> {
  const rows = await ticketRepo.findAll(options);
  const tickets: TicketListItemPublic[] = rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    status: r.status as TicketStatus,
    order_id: r.order_id,
    order_number: r.order_number,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  }));
  return { tickets };
}

/** Customer: reply to own ticket; optional attachment. Sets status to customer_reply. */
export async function reply(
  userId: number,
  ticketId: number,
  data: {
    message: string;
    attachment_path?: string | null;
    attachment_name?: string | null;
    attachment_size?: number | null;
  }
): Promise<TicketDetailPublic> {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError(404, 'Ticket not found');
  if (ticket.user_id !== userId) throw new AppError(403, 'Forbidden');
  if (ticket.status === 'closed') throw new AppError(400, 'Cannot reply to a closed ticket');

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
    if (env.nodeEnv !== 'test') console.error('[Mail] Admin ticket-reply notify failed:', err);
  });

  return requireTicketDetails(ticketId);
}

/** Admin: reply to ticket. Sets status to answered. */
export async function adminReply(
  adminId: number,
  ticketId: number,
  data: {
    message: string;
    attachment_path?: string | null;
    attachment_name?: string | null;
    attachment_size?: number | null;
  }
): Promise<TicketDetailPublic> {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError(404, 'Ticket not found');
  if (ticket.status === 'closed') throw new AppError(400, 'Cannot reply to a closed ticket');

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
    if (env.nodeEnv !== 'test') console.error('[Mail] Ticket reply to customer failed:', err);
  });

  return requireTicketDetails(ticketId);
}

/** Admin: change ticket status. */
export async function updateStatus(
  ticketId: number,
  status: TicketStatus
): Promise<TicketDetailPublic> {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError(404, 'Ticket not found');
  await ticketRepo.updateStatus(ticketId, status);
  return requireTicketDetails(ticketId);
}

/** Resolve attachment download path for response (API path for frontend). */
function attachmentUrlPath(attachmentId: number): string {
  return `${env.apiPrefix}/tickets/attachments/${attachmentId}`;
}

async function getTicketDetailsInternal(ticketId: number): Promise<TicketDetailPublic | null> {
  const row = await ticketRepo.findByIdWithOrderNumber(ticketId);
  if (!row) return null;

  const messages = await ticketMessageRepo.findByTicketId(ticketId);
  const messageDtos: TicketMessagePublic[] = [];

  for (const msg of messages) {
    const attachments = await ticketAttachmentRepo.findByMessageId(msg.id);
    const attachmentDtos: TicketAttachmentPublic[] = attachments.map((a) => ({
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

async function requireTicketDetails(ticketId: number): Promise<TicketDetailPublic> {
  const details = await getTicketDetailsInternal(ticketId);
  if (!details) throw new AppError(404, 'Ticket not found');
  return details;
}

/** Get attachment for download; throws if not found or access denied. */
export async function getAttachmentForDownload(
  attachmentId: number,
  options: { userId?: number; isAdmin?: boolean }
): Promise<{ file_path: string; file_name: string }> {
  const att = await ticketAttachmentRepo.findByIdWithTicketId(attachmentId);
  if (!att) throw new AppError(404, 'Attachment not found');
  if (!options.isAdmin && options.userId != null) {
    const ticket = await ticketRepo.findById(att.ticket_id);
    if (!ticket || ticket.user_id !== options.userId) throw new AppError(403, 'Forbidden');
  }
  return { file_path: att.file_path, file_name: att.file_name };
}
