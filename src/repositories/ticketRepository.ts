import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../database/pool';
import type { TicketRow, TicketStatus } from '../types/ticket';

export async function create(data: {
  user_id: number;
  order_id: number | null;
  subject: string;
}): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO tickets (user_id, order_id, subject) VALUES (?, ?, ?)',
    [data.user_id, data.order_id ?? null, data.subject]
  );
  return result.insertId;
}

export async function findById(id: number): Promise<TicketRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, user_id, order_id, subject, status, created_at, updated_at FROM tickets WHERE id = ? LIMIT 1',
    [id]
  );
  return (rows[0] as TicketRow) ?? null;
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

/** Customer: paginated list with optional status filter. */
export async function findTicketsForUser(
  userId: number,
  options: { status?: TicketStatus; limit: number; offset: number }
): Promise<TicketListRow[]> {
  let sql = `SELECT t.id, t.subject, t.status, t.order_id, o.order_number, t.created_at, t.updated_at
     FROM tickets t
     LEFT JOIN orders o ON o.id = t.order_id
     WHERE t.user_id = ?`;
  const params: (string | number)[] = [userId];
  if (options.status) {
    sql += ' AND t.status = ?';
    params.push(options.status);
  }
  sql += ' ORDER BY t.updated_at DESC LIMIT ? OFFSET ?';
  params.push(options.limit, options.offset);
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as TicketListRow[];
}

export async function countTicketsForUser(userId: number, options: { status?: TicketStatus } = {}): Promise<number> {
  let sql = 'SELECT COUNT(*) AS total FROM tickets WHERE user_id = ?';
  const params: (string | number)[] = [userId];
  if (options.status) {
    sql += ' AND status = ?';
    params.push(options.status);
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return Number((rows[0] as { total: number }).total);
}

export async function findAll(options: { status?: TicketStatus; limit?: number; offset?: number } = {}): Promise<TicketListRow[]> {
  let sql = `SELECT t.id, t.subject, t.status, t.order_id, o.order_number, t.created_at, t.updated_at
             FROM tickets t
             LEFT JOIN orders o ON o.id = t.order_id`;
  const params: (string | number)[] = [];
  if (options.status) {
    sql += ' WHERE t.status = ?';
    params.push(options.status);
  }
  sql += ' ORDER BY t.updated_at DESC';
  const limit = Math.min(options.limit ?? 100, 200);
  const offset = options.offset ?? 0;
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as TicketListRow[];
}

export async function updateStatus(id: number, status: TicketStatus): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE tickets SET status = ? WHERE id = ?',
    [status, id]
  );
  return result.affectedRows > 0;
}

export async function findByIdWithOrderNumber(id: number): Promise<(TicketRow & { order_number: string | null }) | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT t.id, t.user_id, t.order_id, t.subject, t.status, t.created_at, t.updated_at, o.order_number
     FROM tickets t
     LEFT JOIN orders o ON o.id = t.order_id
     WHERE t.id = ? LIMIT 1`,
    [id]
  );
  return (rows[0] as (TicketRow & { order_number: string | null })) ?? null;
}

export async function countByStatus(status: TicketStatus): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM tickets WHERE status = ?',
    [status]
  );
  return Number((rows[0] as { total: number }).total);
}

export async function countByUserIdAndStatus(userId: number, status: TicketStatus): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM tickets WHERE user_id = ? AND status = ?',
    [userId, status]
  );
  return Number((rows[0] as { total: number }).total);
}
