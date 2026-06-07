import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../database/pool';
import type { AdminRow, AdminSessionRow } from '../types/auth';

export async function findAdminByEmail(email: string): Promise<AdminRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, email, password_hash, name, role, created_at, updated_at, deleted_at FROM admins WHERE email = ? AND deleted_at IS NULL LIMIT 1',
    [email]
  );
  return (rows[0] as AdminRow) ?? null;
}

export async function findAdminById(id: number): Promise<AdminRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, email, password_hash, name, role, created_at, updated_at, deleted_at FROM admins WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    [id]
  );
  return (rows[0] as AdminRow) ?? null;
}

export async function createAdminSession(
  adminId: number,
  tokenHash: string,
  expiresAt: Date,
  ip: string | null,
  userAgent: string | null
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO admin_sessions (admin_id, token_hash, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
    [adminId, tokenHash, expiresAt, ip, userAgent]
  );
  return result.insertId;
}

export async function updateAdminSessionTokenHash(sessionId: number, tokenHash: string): Promise<void> {
  await pool.execute('UPDATE admin_sessions SET token_hash = ? WHERE id = ?', [tokenHash, sessionId]);
}

export async function findAdminSessionByTokenHash(tokenHash: string): Promise<AdminSessionRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, admin_id, token_hash, ip, user_agent, expires_at, created_at FROM admin_sessions WHERE token_hash = ? LIMIT 1',
    [tokenHash]
  );
  return (rows[0] as AdminSessionRow) ?? null;
}

export async function findAdminSessionById(sessionId: number): Promise<AdminSessionRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, admin_id, token_hash, ip, user_agent, expires_at, created_at FROM admin_sessions WHERE id = ? LIMIT 1',
    [sessionId]
  );
  return (rows[0] as AdminSessionRow) ?? null;
}

export async function deleteAdminSessionById(sessionId: number): Promise<void> {
  await pool.execute('DELETE FROM admin_sessions WHERE id = ?', [sessionId]);
}

export async function deleteAllAdminSessionsForAdmin(adminId: number): Promise<void> {
  await pool.execute('DELETE FROM admin_sessions WHERE admin_id = ?', [adminId]);
}

export async function createAdmin(
  email: string,
  passwordHash: string,
  name: string,
  role: string
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO admins (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
    [email, passwordHash, name, role]
  );
  return result.insertId;
}

export async function updateAdminPassword(adminId: number, passwordHash: string): Promise<void> {
  await pool.execute(
    'UPDATE admins SET password_hash = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND deleted_at IS NULL',
    [passwordHash, adminId]
  );
}

export async function updateAdminName(adminId: number, name: string): Promise<void> {
  await pool.execute(
    'UPDATE admins SET name = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND deleted_at IS NULL',
    [name.trim(), adminId]
  );
}
