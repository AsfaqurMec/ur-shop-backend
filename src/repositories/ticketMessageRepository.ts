import { TicketMessageModel } from '../database/models';
import { nextId } from '../database/counter';
import type { TicketMessageRow, TicketSenderType } from '../types/ticket';

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function row(doc: any): TicketMessageRow {
  return {
    id: Number(doc.id),
    ticket_id: Number(doc.ticket_id),
    sender_type: doc.sender_type as TicketSenderType,
    user_id: doc.user_id ?? null,
    admin_id: doc.admin_id ?? null,
    message: String(doc.message),
    created_at: date(doc.created_at),
  };
}

export async function create(data: {
  ticket_id: number;
  sender_type: TicketSenderType;
  user_id: number | null;
  admin_id: number | null;
  message: string;
}): Promise<number> {
  const id = await nextId('ticket_messages');
  await TicketMessageModel.create({ id, ...data });
  return id;
}

export async function findByTicketId(ticketId: number): Promise<TicketMessageRow[]> {
  const rows = await TicketMessageModel.find({ ticket_id: ticketId }).sort({ created_at: 1, id: 1 }).lean();
  return rows.map(row);
}
