import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../database/pool';
import type { CategoryRow } from '../types/category';

export async function create(data: {
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO categories (parent_id, name, slug, description, sort_order) VALUES (?, ?, ?, ?, ?)',
    [data.parent_id, data.name, data.slug, data.description ?? null, data.sort_order]
  );
  return result.insertId;
}

export async function update(
  id: number,
  data: {
    parent_id?: number | null;
    name?: string;
    slug?: string;
    description?: string | null;
    sort_order?: number;
  }
): Promise<void> {
  const updates: string[] = [];
  const values: (number | string | null)[] = [];
  if (data.parent_id !== undefined) {
    updates.push('parent_id = ?');
    values.push(data.parent_id);
  }
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.slug !== undefined) {
    updates.push('slug = ?');
    values.push(data.slug);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.sort_order !== undefined) {
    updates.push('sort_order = ?');
    values.push(data.sort_order);
  }
  if (updates.length === 0) return;
  values.push(id);
  await pool.execute(
    `UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
}

export async function softDelete(id: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE categories SET deleted_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return result.affectedRows > 0;
}

export async function slugExists(slug: string, excludeId?: number): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    excludeId
      ? 'SELECT 1 FROM categories WHERE slug = ? AND deleted_at IS NULL AND id != ? LIMIT 1'
      : 'SELECT 1 FROM categories WHERE slug = ? AND deleted_at IS NULL LIMIT 1',
    excludeId ? [slug, excludeId] : [slug]
  );
  return rows.length > 0;
}

export async function findById(id: number): Promise<CategoryRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, parent_id, name, slug, description, sort_order, created_at, updated_at, deleted_at FROM categories WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    [id]
  );
  return (rows[0] as CategoryRow) ?? null;
}

export async function findBySlug(slug: string): Promise<CategoryRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, parent_id, name, slug, description, sort_order, created_at, updated_at, deleted_at FROM categories WHERE slug = ? AND deleted_at IS NULL LIMIT 1',
    [slug]
  );
  return (rows[0] as CategoryRow) ?? null;
}

export async function findAll(): Promise<CategoryRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, parent_id, name, slug, description, sort_order, created_at, updated_at, deleted_at FROM categories WHERE deleted_at IS NULL ORDER BY sort_order ASC, name ASC'
  );
  return rows as CategoryRow[];
}

export async function countActive(): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM categories WHERE deleted_at IS NULL'
  );
  return Number((rows[0] as { total: number }).total);
}

export async function findPage(limit: number, offset: number): Promise<CategoryRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, parent_id, name, slug, description, sort_order, created_at, updated_at, deleted_at
     FROM categories WHERE deleted_at IS NULL ORDER BY sort_order ASC, name ASC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows as CategoryRow[];
}
