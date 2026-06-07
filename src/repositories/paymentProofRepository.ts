import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../database/pool';
import type { PaymentProofRow, PaymentProofStatus } from '../types/payment';

export type PaymentProofWithUserEmail = PaymentProofRow & {
  user_email: string;
  order_number: string;
  order_total: number | string;
  order_currency: string;
};

export async function create(data: {
  order_id: number;
  user_id: number;
  sender_number: string | null;
  transaction_id: string | null;
  paid_amount: number | null;
  file_path: string | null;
}): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO payment_proofs (order_id, user_id, sender_number, transaction_id, paid_amount, file_path)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.order_id, data.user_id, data.sender_number ?? null, data.transaction_id ?? null, data.paid_amount ?? null, data.file_path]
  );
  return result.insertId;
}

export async function findById(id: number): Promise<PaymentProofRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, order_id, user_id, sender_number, transaction_id, paid_amount, file_path, status, created_at, updated_at
     FROM payment_proofs WHERE id = ? LIMIT 1`,
    [id]
  );
  return (rows[0] as PaymentProofRow) ?? null;
}

export async function findByOrderId(orderId: number): Promise<PaymentProofRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, order_id, user_id, sender_number, transaction_id, paid_amount, file_path, status, created_at, updated_at
     FROM payment_proofs WHERE order_id = ? ORDER BY created_at DESC`,
    [orderId]
  );
  return rows as PaymentProofRow[];
}

export async function findAllPending(): Promise<PaymentProofWithUserEmail[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.id, p.order_id, p.user_id, p.sender_number, p.transaction_id, p.paid_amount, p.file_path, p.status, p.created_at, p.updated_at,
            u.email AS user_email,
            o.order_number, o.total AS order_total, o.currency AS order_currency
     FROM payment_proofs p
     INNER JOIN users u ON u.id = p.user_id
     INNER JOIN orders o ON o.id = p.order_id
     WHERE p.status = 'pending' AND u.deleted_at IS NULL
     ORDER BY p.created_at ASC`
  );
  return rows as PaymentProofWithUserEmail[];
}

function buildRecentForAdminWhere(
  status: PaymentProofStatus | undefined,
  excludePending: boolean | undefined
): { clause: string; params: (string | number)[] } {
  let clause = ' WHERE u.deleted_at IS NULL';
  const params: (string | number)[] = [];
  if (status) {
    clause += ' AND p.status = ?';
    params.push(status);
  }
  if (excludePending) {
    clause += " AND p.status != 'pending'";
  }
  return { clause, params };
}

export async function countRecentForAdmin(options: {
  status?: PaymentProofStatus;
  excludePending?: boolean;
}): Promise<number> {
  const { clause, params } = buildRecentForAdminWhere(options.status, options.excludePending);
  const sql = `SELECT COUNT(*) AS cnt
               FROM payment_proofs p
               INNER JOIN users u ON u.id = p.user_id
               INNER JOIN orders o ON o.id = p.order_id${clause}`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  const n = Number((rows[0] as { cnt: number })?.cnt);
  return Number.isFinite(n) ? n : 0;
}

export async function findRecentForAdmin(options: {
  limit: number;
  offset?: number;
  status?: PaymentProofStatus;
  excludePending?: boolean;
}): Promise<PaymentProofWithUserEmail[]> {
  const { clause, params: whereParams } = buildRecentForAdminWhere(options.status, options.excludePending);
  const offset = Math.max(0, options.offset ?? 0);
  let sql = `SELECT p.id, p.order_id, p.user_id, p.sender_number, p.transaction_id, p.paid_amount, p.file_path, p.status, p.created_at, p.updated_at,
                    u.email AS user_email,
                    o.order_number, o.total AS order_total, o.currency AS order_currency
             FROM payment_proofs p
             INNER JOIN users u ON u.id = p.user_id
             INNER JOIN orders o ON o.id = p.order_id${clause}
             ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`;
  const params = [...whereParams, options.limit, offset];
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as PaymentProofWithUserEmail[];
}

export async function updateStatus(id: number, status: PaymentProofStatus): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE payment_proofs SET status = ? WHERE id = ?',
    [status, id]
  );
  return result.affectedRows > 0;
}
