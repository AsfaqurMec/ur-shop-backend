import { TicketAttachmentModel, TicketMessageModel } from '../database/models';
import { nextId } from '../database/counter';
import type { TicketAttachmentRow } from '../types/ticket';

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function row(doc: any): TicketAttachmentRow {
  return {
    id: Number(doc.id),
    ticket_message_id: Number(doc.ticket_message_id),
    file_path: String(doc.file_path),
    file_name: String(doc.file_name),
    file_size: doc.file_size != null ? Number(doc.file_size) : null,
    created_at: date(doc.created_at),
  };
}

export async function create(data: {
  ticket_message_id: number;
  file_path: string;
  file_name: string;
  file_size: number | null;
}): Promise<number> {
  const id = await nextId('ticket_message_attachments');
  await TicketAttachmentModel.create({ id, ...data, file_size: data.file_size ?? null });
  return id;
}

export async function findByMessageId(ticketMessageId: number): Promise<TicketAttachmentRow[]> {
  const rows = await TicketAttachmentModel.find({ ticket_message_id: ticketMessageId }).sort({ id: 1 }).lean();
  return rows.map(row);
}

export async function findById(id: number): Promise<TicketAttachmentRow | null> {
  const doc = await TicketAttachmentModel.findOne({ id }).lean();
  return doc ? row(doc) : null;
}

export async function findByIdWithTicketId(
  id: number
): Promise<(TicketAttachmentRow & { ticket_id: number }) | null> {
  const attachment = await TicketAttachmentModel.findOne({ id }).lean();
  if (!attachment) return null;
  const message = await TicketMessageModel.findOne({ id: Number(attachment.ticket_message_id) }).lean();
  if (!message) return null;
  return { ...row(attachment), ticket_id: Number((message as any).ticket_id) };
}
