import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../database/pool';

export type EmailLogStatus = 'sent' | 'failed';

export interface EmailLogRow {
  id: number;
  to_email: string;
  subject: string | null;
  template: string | null;
  status: EmailLogStatus;
  error_message: string | null;
  sent_at: Date;
}

export interface CreateEmailLogInput {
  to_email: string;
  subject: string | null;
  template: string | null;
  status: EmailLogStatus;
  error_message?: string | null;
}

export async function create(data: CreateEmailLogInput): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO email_logs (to_email, subject, template, status, error_message)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.to_email,
      data.subject ?? null,
      data.template ?? null,
      data.status,
      data.error_message ?? null,
    ]
  );
  return result.insertId;
}

export async function findRecentByTo(toEmail: string, limit = 50): Promise<EmailLogRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, to_email, subject, template, status, error_message, sent_at
     FROM email_logs WHERE to_email = ? ORDER BY sent_at DESC LIMIT ?`,
    [toEmail, limit]
  );
  return rows as EmailLogRow[];
}

function mapEmailLogRows(rows: RowDataPacket[]): EmailLogRow[] {
  return (rows as RowDataPacket[]).map((r) => ({
    id: Number(r.id),
    to_email: String(r.to_email),
    subject: r.subject != null ? String(r.subject) : null,
    template: r.template != null ? String(r.template) : null,
    status: r.status as EmailLogStatus,
    error_message: r.error_message != null ? String(r.error_message) : null,
    sent_at: r.sent_at instanceof Date ? r.sent_at : new Date(r.sent_at as string),
  }));
}

/** Total rows, optionally filtered by exact template name. */
export async function countLogs(template?: string | null): Promise<number> {
  if (template) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM email_logs WHERE template = ?',
      [template]
    );
    return Number((rows[0] as RowDataPacket).total);
  }
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM email_logs');
  return Number((rows[0] as RowDataPacket).total);
}

/** Latest first; optional template filter (exact match). */
export async function listPaginated(
  limit: number,
  offset: number,
  template?: string | null
): Promise<EmailLogRow[]> {
  if (template) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, to_email, subject, template, status, error_message, sent_at
       FROM email_logs WHERE template = ? ORDER BY sent_at DESC LIMIT ? OFFSET ?`,
      [template, limit, offset]
    );
    return mapEmailLogRows(rows);
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, to_email, subject, template, status, error_message, sent_at
     FROM email_logs ORDER BY sent_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return mapEmailLogRows(rows);
}

/** Distinct non-empty template names for admin filters. */
export async function listDistinctTemplates(): Promise<string[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT DISTINCT template FROM email_logs
     WHERE template IS NOT NULL AND TRIM(template) != ''
     ORDER BY template ASC`
  );
  return (rows as RowDataPacket[]).map((r) => String(r.template));
}
