import { DownloadTokenModel } from '../database/models';
import { nextId } from '../database/counter';
import type { DownloadTokenRow } from '../types/download';

function row(doc: any): DownloadTokenRow {
  return {
    id: Number(doc.id),
    token: String(doc.token),
    entitlement_id: Number(doc.entitlement_id),
    user_id: Number(doc.user_id),
    expires_at: doc.expires_at ? new Date(doc.expires_at) : new Date(),
    max_uses: Number(doc.max_uses ?? 1),
    use_count: Number(doc.use_count ?? 0),
    created_at: doc.created_at ? new Date(doc.created_at) : new Date(),
  };
}

export async function create(
  _conn: unknown,
  data: {
    token: string;
    entitlement_id: number;
    user_id: number;
    expires_at: Date;
    max_uses: number;
  }
): Promise<number> {
  const id = await nextId('download_tokens');
  await DownloadTokenModel.create({ id, ...data, use_count: 0 });
  return id;
}

export async function findByToken(token: string): Promise<DownloadTokenRow | null> {
  const doc = await DownloadTokenModel.findOne({ token }).lean();
  return doc ? row(doc) : null;
}

export async function incrementUseCount(_conn: unknown, tokenId: number): Promise<boolean> {
  const result = await DownloadTokenModel.updateOne(
    { id: tokenId, $expr: { $lt: ['$use_count', '$max_uses'] } },
    { $inc: { use_count: 1 } }
  );
  return result.modifiedCount > 0;
}
