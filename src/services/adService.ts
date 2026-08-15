import { AppError } from '../middlewares/errorHandler';
import * as repo from '../repositories/adRepository';

function map(row: any) { return { id: Number(row.id), image_path: String(row.image_path), is_active: Boolean(row.is_active), created_at: new Date(row.created_at).toISOString() }; }
export async function create(image_path: string, is_active = true) { const id = await repo.create({ image_path, is_active }); const row = await repo.findById(id); if (!row) throw new AppError(500, 'Failed to create ad'); return map(row); }
export async function update(id: number, data: { image_path?: string; is_active?: boolean }) { if (!await repo.findById(id)) throw new AppError(404, 'Ad not found'); await repo.update(id, data); const row = await repo.findById(id); if (!row) throw new AppError(404, 'Ad not found'); return map(row); }
export async function remove(id: number) { if (!await repo.remove(id)) throw new AppError(404, 'Ad not found'); }
export async function listAdmin() { return (await repo.findAll()).map(map); }
export async function listPublic() { return (await repo.findAll(true)).map(map); }
