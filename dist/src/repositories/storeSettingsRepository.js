"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoreSettingsRaw = getStoreSettingsRaw;
exports.upsertStoreSettingsRaw = upsertStoreSettingsRaw;
const models_1 = require("../database/models");
const storeSettings_1 = require("../types/storeSettings");
const counter_1 = require("../database/counter");
async function getStoreSettingsRaw() {
    const row = await models_1.StoreSettingsModel.findOne({ key: storeSettings_1.STORE_SETTINGS_KEY }).lean();
    return typeof row?.value === 'string' ? row.value : null;
}
async function upsertStoreSettingsRaw(value) {
    const existing = await models_1.StoreSettingsModel.findOne({ key: storeSettings_1.STORE_SETTINGS_KEY }).lean();
    if (existing) {
        await models_1.StoreSettingsModel.updateOne({ key: storeSettings_1.STORE_SETTINGS_KEY }, { $set: { value } });
        return;
    }
    await models_1.StoreSettingsModel.create({
        id: await (0, counter_1.nextId)('store_settings'),
        key: storeSettings_1.STORE_SETTINGS_KEY,
        value,
        deleted_at: null,
    });
}
//# sourceMappingURL=storeSettingsRepository.js.map