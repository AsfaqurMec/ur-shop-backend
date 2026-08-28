import { AppError } from '../middlewares/errorHandler';
import * as repo from '../repositories/adRepository';

function map(row: any) { return { id: Number(row.id), image_path: String(row.image_path), is_active: Boolean(row.is_active), created_at: new Date(row.created_at).toISOString() }; }
let cachedPublicAds: Array<{ id: number; image_path: string; is_active: boolean; created_at: string }> | null = null;
let adCacheTimestamp = 0;
const AD_CACHE_TTL_MS = 60 * 1000;

export function invalidateAdCache(): void {
  cachedPublicAds = null;
  adCacheTimestamp = 0;
}

export async function create(image_path: string, is_active = true) {
  const id = await repo.create({ image_path, is_active });
  invalidateAdCache();
  const row = await repo.findById(id);
  if (!row) throw new AppError(500, 'Failed to create ad');
  return map(row);
}

export async function update(id: number, data: { image_path?: string; is_active?: boolean }) {
  if (!await repo.findById(id)) throw new AppError(404, 'Ad not found');
  await repo.update(id, data);
  invalidateAdCache();
  const row = await repo.findById(id);
  if (!row) throw new AppError(404, 'Ad not found');
  return map(row);
}

export async function remove(id: number) {
  if (!await repo.remove(id)) throw new AppError(404, 'Ad not found');
  invalidateAdCache();
}

export async function listAdmin() {
  return (await repo.findAll()).map(map);
}

export async function listPublic() {
  const now = Date.now();
  if (cachedPublicAds && adCacheTimestamp > 0 && now - adCacheTimestamp < AD_CACHE_TTL_MS) {
    return cachedPublicAds;
  }
  const rows = await repo.findAll(true);
  const list = rows.map(map);
  cachedPublicAds = list;
  adCacheTimestamp = now;
  return list;
}
