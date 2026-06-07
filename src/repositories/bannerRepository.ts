import { BannerModel } from '../database/models';
import { nextId } from '../database/counter';
import type { BannerButton, BannerRow } from '../types/banner';

function toRow(doc: any): BannerRow {
  return {
    id: Number(doc.id),
    background_image: String(doc.background_image),
    title: doc.title ?? null,
    subtitle: doc.subtitle ?? null,
    buttons: Array.isArray(doc.buttons) ? doc.buttons : [],
    sort_order: Number(doc.sort_order ?? 0),
    is_active: doc.is_active !== false,
    created_at: new Date(doc.created_at),
    updated_at: new Date(doc.updated_at),
    deleted_at: doc.deleted_at ? new Date(doc.deleted_at) : null,
  };
}

export async function create(data: {
  background_image: string;
  title: string | null;
  subtitle: string | null;
  buttons: BannerButton[];
  sort_order: number;
  is_active: boolean;
}): Promise<number> {
  const id = await nextId('banners');
  await BannerModel.create({ id, ...data, deleted_at: null });
  return id;
}

export async function update(
  id: number,
  data: Partial<{
    background_image: string;
    title: string | null;
    subtitle: string | null;
    buttons: BannerButton[];
    sort_order: number;
    is_active: boolean;
  }>
): Promise<void> {
  await BannerModel.updateOne({ id, deleted_at: null }, { $set: data });
}

export async function softDelete(id: number): Promise<boolean> {
  const result = await BannerModel.updateOne({ id, deleted_at: null }, { $set: { deleted_at: new Date() } });
  return result.modifiedCount > 0;
}

export async function findById(id: number): Promise<BannerRow | null> {
  const row = await BannerModel.findOne({ id, deleted_at: null }).lean();
  return row ? toRow(row) : null;
}

export async function findAll(): Promise<BannerRow[]> {
  const rows = await BannerModel.find({ deleted_at: null }).sort({ sort_order: 1, created_at: -1 }).lean();
  return rows.map(toRow);
}

export async function findActive(): Promise<BannerRow[]> {
  const rows = await BannerModel.find({ deleted_at: null, is_active: true }).sort({ sort_order: 1, created_at: -1 }).lean();
  return rows.map(toRow);
}
