import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../database/pool';
import type { TicketMessageRow, TicketSenderType } from '../types/ticket';

export async function create(data: {
  ticket_id: number;
  sender_type: TicketSenderType;
  user_id: number | null;
  admin_id: number | null;
  message: string;
}): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO ticket_messages (ticket_id, sender_type, user_id, admin_id, message)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.ticket_id,
      data.sender_type,
      data.user_id ?? null,
      data.admin_id ?? null,
      data.message,
    ]
  );
  return result.insertId;
}

export async function findByTicketId(ticketId: number): Promise<TicketMessageRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, ticket_id, sender_type, user_id, admin_id, message, created_at
     FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC`,
    [ticketId]
  );
  return rows as TicketMessageRow[];
}
