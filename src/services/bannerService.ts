import { AppError } from '../middlewares/errorHandler';
import * as bannerRepo from '../repositories/bannerRepository';
import type { BannerButton, BannerPublic, BannerRow } from '../types/banner';

function cleanString(input: unknown, maxLen: number): string {
  return typeof input === 'string' ? input.trim().slice(0, maxLen) : '';
}

export function normalizeButtons(input: unknown): BannerButton[] {
  let raw = input;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = [];
    }
  }
  if (!Array.isArray(raw)) return [];

  const buttons: BannerButton[] = [];
  for (const item of raw.slice(0, 4)) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const title = cleanString(record.title, 80);
    const route = cleanString(record.route, 500);
    if (title && route) buttons.push({ title, route });
  }
  return buttons;
}

function toPublic(row: BannerRow): BannerPublic {
  return {
    id: row.id,
    background_image: row.background_image,
    title: row.title,
    subtitle: row.subtitle,
    buttons: row.buttons,
    sort_order: row.sort_order,
    is_active: row.is_active,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export async function create(data: {
  background_image: string;
  title?: string | null;
  subtitle?: string | null;
  buttons?: unknown;
  sort_order?: number;
  is_active?: boolean;
}): Promise<BannerPublic> {
  if (!data.background_image.trim()) throw new AppError(400, 'Background image is required');
  const id = await bannerRepo.create({
    background_image: data.background_image.trim(),
    title: cleanString(data.title, 255) || null,
    subtitle: cleanString(data.subtitle, 1000) || null,
    buttons: normalizeButtons(data.buttons),
    sort_order: data.sort_order ?? 0,
    is_active: data.is_active ?? true,
  });
  const row = await bannerRepo.findById(id);
  if (!row) throw new AppError(500, 'Failed to create banner');
  return toPublic(row);
}

export async function update(
  id: number,
  data: Partial<{
    background_image: string;
    title: string | null;
    subtitle: string | null;
    buttons: unknown;
    sort_order: number;
    is_active: boolean;
  }>
): Promise<BannerPublic> {
  const existing = await bannerRepo.findById(id);
  if (!existing) throw new AppError(404, 'Banner not found');

  const updates: Parameters<typeof bannerRepo.update>[1] = {};
  if (data.background_image !== undefined) {
    if (!data.background_image.trim()) throw new AppError(400, 'Background image cannot be empty');
    updates.background_image = data.background_image.trim();
  }
  if (data.title !== undefined) updates.title = cleanString(data.title, 255) || null;
  if (data.subtitle !== undefined) updates.subtitle = cleanString(data.subtitle, 1000) || null;
  if (data.buttons !== undefined) updates.buttons = normalizeButtons(data.buttons);
  if (data.sort_order !== undefined) updates.sort_order = data.sort_order;
  if (data.is_active !== undefined) updates.is_active = data.is_active;

  if (Object.keys(updates).length > 0) await bannerRepo.update(id, updates);
  const row = await bannerRepo.findById(id);
  if (!row) throw new AppError(404, 'Banner not found');
  return toPublic(row);
}

export async function remove(id: number): Promise<void> {
  const existed = await bannerRepo.softDelete(id);
  if (!existed) throw new AppError(404, 'Banner not found');
}

export async function listAdmin(): Promise<BannerPublic[]> {
  const rows = await bannerRepo.findAll();
  return rows.map(toPublic);
}

export async function listPublic(): Promise<BannerPublic[]> {
  const rows = await bannerRepo.findActive();
  return rows.map(toPublic);
}
