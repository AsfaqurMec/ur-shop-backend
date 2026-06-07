import { AuditLogModel } from '../database/models';
import { nextId } from '../database/counter';

export async function create(data: {
  user_id: number | null;
  admin_id: number | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip: string | null;
}): Promise<number> {
  const id = await nextId('audit_logs');
  await AuditLogModel.create({ id, ...data });
  return id;
}
