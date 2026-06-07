import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import pool from '../database/pool';
import type { DownloadTokenRow } from '../types/download';

export async function create(
  conn: PoolConnection,
  data: {
    token: string;
    entitlement_id: number;
    user_id: number;
    expires_at: Date;
    max_uses: number;
  }
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `INSERT INTO download_tokens (token, entitlement_id, user_id, expires_at, max_uses)
     VALUES (?, ?, ?, ?, ?)`,
    [data.token, data.entitlement_id, data.user_id, data.expires_at, data.max_uses]
  );
  return result.insertId;
}

export async function findByToken(token: string): Promise<DownloadTokenRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, token, entitlement_id, user_id, expires_at, max_uses, use_count, created_at
     FROM download_tokens WHERE token = ? LIMIT 1`,
    [token]
  );
  return (rows[0] as DownloadTokenRow) ?? null;
}

/** Atomically increment use_count if use_count < max_uses. Returns true if incremented. */
export async function incrementUseCount(conn: PoolConnection, tokenId: number): Promise<boolean> {
  const [result] = await conn.execute<ResultSetHeader>(
    `UPDATE download_tokens SET use_count = use_count + 1
     WHERE id = ? AND use_count < max_uses`,
    [tokenId]
  );
  return result.affectedRows > 0;
}
