"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateAdCache = invalidateAdCache;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.listAdmin = listAdmin;
exports.listPublic = listPublic;
const errorHandler_1 = require("../middlewares/errorHandler");
const repo = __importStar(require("../repositories/adRepository"));
function map(row) { return { id: Number(row.id), image_path: String(row.image_path), is_active: Boolean(row.is_active), created_at: new Date(row.created_at).toISOString() }; }
let cachedPublicAds = null;
let adCacheTimestamp = 0;
const AD_CACHE_TTL_MS = 60 * 1000;
function invalidateAdCache() {
    cachedPublicAds = null;
    adCacheTimestamp = 0;
}
async function create(image_path, is_active = true) {
    const id = await repo.create({ image_path, is_active });
    invalidateAdCache();
    const row = await repo.findById(id);
    if (!row)
        throw new errorHandler_1.AppError(500, 'Failed to create ad');
    return map(row);
}
async function update(id, data) {
    if (!await repo.findById(id))
        throw new errorHandler_1.AppError(404, 'Ad not found');
    await repo.update(id, data);
    invalidateAdCache();
    const row = await repo.findById(id);
    if (!row)
        throw new errorHandler_1.AppError(404, 'Ad not found');
    return map(row);
}
async function remove(id) {
    if (!await repo.remove(id))
        throw new errorHandler_1.AppError(404, 'Ad not found');
    invalidateAdCache();
}
async function listAdmin() {
    return (await repo.findAll()).map(map);
}
async function listPublic() {
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
//# sourceMappingURL=adService.js.map