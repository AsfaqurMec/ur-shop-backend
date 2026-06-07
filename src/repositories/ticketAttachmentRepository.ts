import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../database/pool';
import type { TicketAttachmentRow } from '../types/ticket';

export async function create(data: {
  ticket_message_id: number;
  file_path: string;
  file_name: string;
  file_size: number | null;
}): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO ticket_message_attachments (ticket_message_id, file_path, file_name, file_size)
     VALUES (?, ?, ?, ?)`,
    [data.ticket_message_id, data.file_path, data.file_name, data.file_size ?? null]
  );
  return result.insertId;
}

export async function findByMessageId(ticketMessageId: number): Promise<TicketAttachmentRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, ticket_message_id, file_path, file_name, file_size, created_at
     FROM ticket_message_attachments WHERE ticket_message_id = ? ORDER BY id ASC`,
    [ticketMessageId]
  );
  return rows as TicketAttachmentRow[];
}

export async function findById(id: number): Promise<TicketAttachmentRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, ticket_message_id, file_path, file_name, file_size, created_at FROM ticket_message_attachments WHERE id = ? LIMIT 1',
    [id]
  );
  return (rows[0] as TicketAttachmentRow) ?? null;
}

/** Get attachment with ticket_id for access check. */
export async function findByIdWithTicketId(
  id: number
): Promise<(TicketAttachmentRow & { ticket_id: number }) | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT a.id, a.ticket_message_id, a.file_path, a.file_name, a.file_size, a.created_at, m.ticket_id
     FROM ticket_message_attachments a
     JOIN ticket_messages m ON m.id = a.ticket_message_id
     WHERE a.id = ? LIMIT 1`,
    [id]
  );
  return (rows[0] as (TicketAttachmentRow & { ticket_id: number })) ?? null;
}
