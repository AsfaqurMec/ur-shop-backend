import { DownloadModel } from '../database/models';
import { nextId } from '../database/counter';

export async function create(
  _conn: unknown,
  data: {
    order_item_id: number;
    user_id: number;
    product_file_id: number;
    ip?: string | null;
    user_agent?: string | null;
  }
): Promise<number> {
  const id = await nextId('downloads');
  await DownloadModel.create({ id, ...data, ip: data.ip ?? null, user_agent: data.user_agent ?? null });
  return id;
}

export async function countByOrderItemAndFile(orderItemId: number, productFileId: number): Promise<number> {
  return DownloadModel.countDocuments({ order_item_id: orderItemId, product_file_id: productFileId });
}
