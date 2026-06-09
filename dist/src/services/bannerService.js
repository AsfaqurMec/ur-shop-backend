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
exports.normalizeButtons = normalizeButtons;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.listAdmin = listAdmin;
exports.listPublic = listPublic;
const errorHandler_1 = require("../middlewares/errorHandler");
const bannerRepo = __importStar(require("../repositories/bannerRepository"));
function cleanString(input, maxLen) {
    return typeof input === 'string' ? input.trim().slice(0, maxLen) : '';
}
function normalizeButtons(input) {
    let raw = input;
    if (typeof raw === 'string') {
        try {
            raw = JSON.parse(raw);
        }
        catch {
            raw = [];
        }
    }
    if (!Array.isArray(raw))
        return [];
    const buttons = [];
    for (const item of raw.slice(0, 4)) {
        if (!item || typeof item !== 'object')
            continue;
        const record = item;
        const title = cleanString(record.title, 80);
        const route = cleanString(record.route, 500);
        if (title && route)
            buttons.push({ title, route });
    }
    return buttons;
}
function toPublic(row) {
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
async function create(data) {
    if (!data.background_image.trim())
        throw new errorHandler_1.AppError(400, 'Background image is required');
    const id = await bannerRepo.create({
        background_image: data.background_image.trim(),
        title: cleanString(data.title, 255) || null,
        subtitle: cleanString(data.subtitle, 1000) || null,
        buttons: normalizeButtons(data.buttons),
        sort_order: data.sort_order ?? 0,
        is_active: data.is_active ?? true,
    });
    const row = await bannerRepo.findById(id);
    if (!row)
        throw new errorHandler_1.AppError(500, 'Failed to create banner');
    return toPublic(row);
}
async function update(id, data) {
    const existing = await bannerRepo.findById(id);
    if (!existing)
        throw new errorHandler_1.AppError(404, 'Banner not found');
    const updates = {};
    if (data.background_image !== undefined) {
        if (!data.background_image.trim())
            throw new errorHandler_1.AppError(400, 'Background image cannot be empty');
        updates.background_image = data.background_image.trim();
    }
    if (data.title !== undefined)
        updates.title = cleanString(data.title, 255) || null;
    if (data.subtitle !== undefined)
        updates.subtitle = cleanString(data.subtitle, 1000) || null;
    if (data.buttons !== undefined)
        updates.buttons = normalizeButtons(data.buttons);
    if (data.sort_order !== undefined)
        updates.sort_order = data.sort_order;
    if (data.is_active !== undefined)
        updates.is_active = data.is_active;
    if (Object.keys(updates).length > 0)
        await bannerRepo.update(id, updates);
    const row = await bannerRepo.findById(id);
    if (!row)
        throw new errorHandler_1.AppError(404, 'Banner not found');
    return toPublic(row);
}
async function remove(id) {
    const existed = await bannerRepo.softDelete(id);
    if (!existed)
        throw new errorHandler_1.AppError(404, 'Banner not found');
}
async function listAdmin() {
    const rows = await bannerRepo.findAll();
    return rows.map(toPublic);
}
async function listPublic() {
    const rows = await bannerRepo.findActive();
    return rows.map(toPublic);
}
//# sourceMappingURL=bannerService.js.map