import { StoreSettingsModel } from '../database/models';
import { STORE_SETTINGS_KEY } from '../types/storeSettings';
import { nextId } from '../database/counter';

export async function getStoreSettingsRaw(): Promise<string | null> {
  const row = await StoreSettingsModel.findOne({ key: STORE_SETTINGS_KEY }).lean();
  return typeof row?.value === 'string' ? row.value : null;
}

export async function upsertStoreSettingsRaw(value: string): Promise<void> {
  const existing = await StoreSettingsModel.findOne({ key: STORE_SETTINGS_KEY }).lean();
  if (existing) {
    await StoreSettingsModel.updateOne({ key: STORE_SETTINGS_KEY }, { $set: { value } });
    return;
  }
  await StoreSettingsModel.create({
    id: await nextId('store_settings'),
    key: STORE_SETTINGS_KEY,
    value,
    deleted_at: null,
  });
}
