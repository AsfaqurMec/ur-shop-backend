import type { ResultSetHeader } from 'mysql2/promise';
import pool from '../database/pool';

export async function create(data: {
  user_id: number | null;
  admin_id: number | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip: string | null;
}): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO audit_logs (user_id, admin_id, action, entity_type, entity_id, old_values, new_values, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.user_id ?? null,
      data.admin_id ?? null,
      data.action,
      data.entity_type ?? null,
      data.entity_id ?? null,
      data.old_values ? JSON.stringify(data.old_values) : null,
      data.new_values ? JSON.stringify(data.new_values) : null,
      data.ip ?? null,
    ]
  );
  return result.insertId;
}
