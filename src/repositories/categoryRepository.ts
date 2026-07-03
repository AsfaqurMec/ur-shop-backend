import { CategoryModel } from '../database/models';
import { nextId } from '../database/counter';
import type { CategoryRow } from '../types/category';

function toRow(doc: any): CategoryRow {
  return {
    id: Number(doc.id),
    parent_id: doc.parent_id ?? null,
    name: String(doc.name),
    slug: String(doc.slug),
    description: doc.description ?? null,
    image: doc.image ?? null,
    banner_image: doc.banner_image ?? null,
    sort_order: Number(doc.sort_order ?? 0),
    created_at: new Date(doc.created_at),
    updated_at: new Date(doc.updated_at),
    deleted_at: doc.deleted_at ? new Date(doc.deleted_at) : null,
  };
}

export async function create(data: {
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  image?: string | null;
  banner_image?: string | null;
  sort_order: number;
}): Promise<number> {
  const id = await nextId('categories');
  await CategoryModel.create({ id, ...data, deleted_at: null });
  return id;
}

export async function update(
  id: number,
  data: {
    parent_id?: number | null;
    name?: string;
    slug?: string;
    description?: string | null;
    image?: string | null;
    banner_image?: string | null;
    sort_order?: number;
  }
): Promise<void> {
  await CategoryModel.updateOne({ id, deleted_at: null }, { $set: data });
}

export async function softDelete(id: number): Promise<boolean> {
  const result = await CategoryModel.updateOne({ id, deleted_at: null }, { $set: { deleted_at: new Date() } });
  return result.modifiedCount > 0;
}

export async function slugExists(slug: string, excludeId?: number): Promise<boolean> {
  const query: Record<string, unknown> = { slug, deleted_at: null };
  if (excludeId != null) query.id = { $ne: excludeId };
  return Boolean(await CategoryModel.exists(query));
}

export async function findById(id: number): Promise<CategoryRow | null> {
  const row = await CategoryModel.findOne({ id, deleted_at: null }).lean();
  return row ? toRow(row) : null;
}

export async function findBySlug(slug: string): Promise<CategoryRow | null> {
  const row = await CategoryModel.findOne({ slug, deleted_at: null }).lean();
  return row ? toRow(row) : null;
}

export async function findAll(): Promise<CategoryRow[]> {
  const rows = await CategoryModel.find({ deleted_at: null }).sort({ sort_order: 1, name: 1 }).lean();
  return rows.map(toRow);
}

export async function countActive(): Promise<number> {
  return CategoryModel.countDocuments({ deleted_at: null });
}

export async function findPage(limit: number, offset: number): Promise<CategoryRow[]> {
  const rows = await CategoryModel.find({ deleted_at: null })
    .sort({ sort_order: 1, name: 1 })
    .skip(offset)
    .limit(limit)
    .lean();
  return rows.map(toRow);
}
