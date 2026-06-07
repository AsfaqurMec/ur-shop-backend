import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../database/pool';
import { STORE_SETTINGS_KEY } from '../types/storeSettings';

type SettingsRow = RowDataPacket & {
  id: number;
  key: string;
  value: string | null;
};

export async function getStoreSettingsRaw(): Promise<string | null> {
  const [rows] = await pool.execute<SettingsRow[]>(
    'SELECT id, `key`, value FROM settings WHERE `key` = ? LIMIT 1',
    [STORE_SETTINGS_KEY]
  );
  const row = rows[0];
  return row?.value ?? null;
}

export async function upsertStoreSettingsRaw(value: string): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO settings (\`key\`, value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP(3)`,
    [STORE_SETTINGS_KEY, value]
  );
}
