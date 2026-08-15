import { AdModel } from '../database/models';
import { nextId } from '../database/counter';

export async function create(data: { image_path: string; is_active: boolean }): Promise<number> {
  const id = await nextId('ads');
  await AdModel.create({ id, ...data, deleted_at: null });
  return id;
}
export async function findById(id: number) { return AdModel.findOne({ id, deleted_at: null }).lean(); }
export async function findAll(activeOnly = false) { return AdModel.find({ deleted_at: null, ...(activeOnly ? { is_active: true } : {}) }).sort({ created_at: -1 }).lean(); }
export async function update(id: number, data: Record<string, unknown>) { await AdModel.updateOne({ id, deleted_at: null }, { $set: data }); }
export async function remove(id: number) { const r = await AdModel.updateOne({ id, deleted_at: null }, { $set: { deleted_at: new Date() } }); return r.modifiedCount > 0; }
