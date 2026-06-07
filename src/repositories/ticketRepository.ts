import { OrderModel, TicketModel } from '../database/models';
import { nextId } from '../database/counter';
import type { TicketRow, TicketStatus } from '../types/ticket';

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function row(doc: any): TicketRow {
  return {
    id: Number(doc.id),
    user_id: Number(doc.user_id),
    order_id: doc.order_id ?? null,
    subject: String(doc.subject),
    status: (doc.status ?? 'open') as TicketStatus,
    created_at: date(doc.created_at),
    updated_at: date(doc.updated_at),
  };
}

async function orderNumberMap(orderIds: number[]): Promise<Map<number, string>> {
  const orders = await OrderModel.find({ id: { $in: orderIds } }).lean();
  return new Map(orders.map((order: any) => [Number(order.id), String(order.order_number)]));
}

export async function create(data: { user_id: number; order_id: number | null; subject: string }): Promise<number> {
  const id = await nextId('tickets');
  await TicketModel.create({ id, user_id: data.user_id, order_id: data.order_id ?? null, subject: data.subject, status: 'open' });
  return id;
}

export async function findById(id: number): Promise<TicketRow | null> {
  const doc = await TicketModel.findOne({ id }).lean();
  return doc ? row(doc) : null;
}

export interface TicketListRow {
  id: number;
  subject: string;
  status: string;
  order_id: number | null;
  order_number: string | null;
  created_at: Date;
  updated_at: Date;
}

async function listRows(query: Record<string, unknown>, limit: number, offset: number): Promise<TicketListRow[]> {
  const tickets = await TicketModel.find(query).sort({ updated_at: -1 }).skip(offset).limit(limit).lean();
  const orderNumbers = await orderNumberMap(tickets.map((t: any) => t.order_id).filter((id) => id != null).map(Number));
  return tickets.map((t: any) => ({
    id: Number(t.id),
    subject: String(t.subject),
    status: String(t.status),
    order_id: t.order_id ?? null,
    order_number: t.order_id != null ? orderNumbers.get(Number(t.order_id)) ?? null : null,
    created_at: date(t.created_at),
    updated_at: date(t.updated_at),
  }));
}

export async function findTicketsForUser(
  userId: number,
  options: { status?: TicketStatus; limit: number; offset: number }
): Promise<TicketListRow[]> {
  return listRows({ user_id: userId, ...(options.status ? { status: options.status } : {}) }, options.limit, options.offset);
}

export async function countTicketsForUser(userId: number, options: { status?: TicketStatus } = {}): Promise<number> {
  return TicketModel.countDocuments({ user_id: userId, ...(options.status ? { status: options.status } : {}) });
}

export async function findAll(options: { status?: TicketStatus; limit?: number; offset?: number } = {}): Promise<TicketListRow[]> {
  return listRows(options.status ? { status: options.status } : {}, Math.min(options.limit ?? 100, 200), options.offset ?? 0);
}

export async function updateStatus(id: number, status: TicketStatus): Promise<boolean> {
  const result = await TicketModel.updateOne({ id }, { $set: { status } });
  return result.modifiedCount > 0;
}

export async function findByIdWithOrderNumber(id: number): Promise<(TicketRow & { order_number: string | null }) | null> {
  const ticket = await TicketModel.findOne({ id }).lean();
  if (!ticket) return null;
  const order = ticket.order_id != null ? await OrderModel.findOne({ id: Number(ticket.order_id) }).lean() : null;
  return { ...row(ticket), order_number: order ? String((order as any).order_number) : null };
}

export async function countByStatus(status: TicketStatus): Promise<number> {
  return TicketModel.countDocuments({ status });
}

export async function countByUserIdAndStatus(userId: number, status: TicketStatus): Promise<number> {
  return TicketModel.countDocuments({ user_id: userId, status });
}
