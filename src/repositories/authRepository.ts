import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../database/pool';
import type { UserRow, UserSessionRow, EmailVerificationRow, PasswordResetRow } from '../types/auth';

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, email, password_hash, name, email_verified_at, created_at, updated_at, deleted_at FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
    [email]
  );
  return (rows[0] as UserRow) ?? null;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, email, password_hash, name, email_verified_at, created_at, updated_at, deleted_at FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    [id]
  );
  return (rows[0] as UserRow) ?? null;
}

export async function createUser(email: string, passwordHash: string, name: string): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
    [email, passwordHash, name]
  );
  return result.insertId;
}

export async function updateUserEmailVerified(userId: number): Promise<void> {
  await pool.execute(
    'UPDATE users SET email_verified_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
    [userId]
  );
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
}

/** True if another non-deleted user already has this email. */
export async function emailExistsExcludingUser(email: string, excludeUserId: number): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT 1 FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL LIMIT 1',
    [email.trim(), excludeUserId]
  );
  return rows.length > 0;
}

export async function updateUserProfile(userId: number, email: string, name: string): Promise<void> {
  await pool.execute(
    'UPDATE users SET email = ?, name = ? WHERE id = ? AND deleted_at IS NULL',
    [email.trim(), name.trim(), userId]
  );
}

export async function updateUserName(userId: number, name: string): Promise<void> {
  await pool.execute('UPDATE users SET name = ? WHERE id = ? AND deleted_at IS NULL', [
    name.trim(),
    userId,
  ]);
}

export async function softDeleteUser(userId: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE users SET deleted_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND deleted_at IS NULL',
    [userId]
  );
  return result.affectedRows > 0;
}

export async function createSession(
  userId: number,
  tokenHash: string,
  expiresAt: Date,
  ip: string | null,
  userAgent: string | null
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO user_sessions (user_id, token_hash, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
    [userId, tokenHash, expiresAt, ip, userAgent]
  );
  return result.insertId;
}

export async function updateSessionTokenHash(sessionId: number, tokenHash: string): Promise<void> {
  await pool.execute('UPDATE user_sessions SET token_hash = ? WHERE id = ?', [tokenHash, sessionId]);
}

export async function findSessionByTokenHash(tokenHash: string): Promise<UserSessionRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, user_id, token_hash, ip, user_agent, expires_at, created_at FROM user_sessions WHERE token_hash = ? LIMIT 1',
    [tokenHash]
  );
  return (rows[0] as UserSessionRow) ?? null;
}

export async function findSessionById(sessionId: number): Promise<UserSessionRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, user_id, token_hash, ip, user_agent, expires_at, created_at FROM user_sessions WHERE id = ? LIMIT 1',
    [sessionId]
  );
  return (rows[0] as UserSessionRow) ?? null;
}

export async function deleteSessionById(sessionId: number): Promise<void> {
  await pool.execute('DELETE FROM user_sessions WHERE id = ?', [sessionId]);
}

export async function deleteSessionsByUserId(userId: number): Promise<void> {
  await pool.execute('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
}

export async function createEmailVerification(
  userId: number,
  email: string,
  token: string,
  expiresAt: Date
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO email_verifications (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
    [userId, email, token, expiresAt]
  );
  return result.insertId;
}

export async function findEmailVerificationByToken(token: string): Promise<EmailVerificationRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, user_id, email, token, expires_at, verified_at, created_at FROM email_verifications WHERE token = ? LIMIT 1',
    [token]
  );
  return (rows[0] as EmailVerificationRow) ?? null;
}

export async function markEmailVerificationVerified(verificationId: number): Promise<void> {
  await pool.execute(
    'UPDATE email_verifications SET verified_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
    [verificationId]
  );
}

export async function createPasswordReset(
  userId: number,
  token: string,
  expiresAt: Date
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
  return result.insertId;
}

export async function findPasswordResetByToken(token: string): Promise<PasswordResetRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, user_id, token, expires_at, used_at, created_at FROM password_resets WHERE token = ? AND used_at IS NULL LIMIT 1',
    [token]
  );
  return (rows[0] as PasswordResetRow) ?? null;
}

export async function markPasswordResetUsed(resetId: number): Promise<void> {
  await pool.execute('UPDATE password_resets SET used_at = CURRENT_TIMESTAMP(3) WHERE id = ?', [
    resetId,
  ]);
}
