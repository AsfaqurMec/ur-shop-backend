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
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.list = list;
exports.listPaginated = listPaginated;
exports.getBySlug = getBySlug;
const errorHandler_1 = require("../middlewares/errorHandler");
const categoryRepo = __importStar(require("../repositories/categoryRepository"));
const slugHelpers_1 = require("../utils/slugHelpers");
function toPublic(row) {
    return {
        id: row.id,
        parent_id: row.parent_id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        image: row.image,
        banner_image: row.banner_image,
        sort_order: row.sort_order,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
    };
}
function buildTree(flat, parentId) {
    return flat
        .filter((c) => c.parent_id === parentId)
        .map((c) => ({
        ...c,
        children: buildTree(flat, c.id),
    }))
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}
async function create(data) {
    if (data.parent_id != null) {
        const parent = await categoryRepo.findById(data.parent_id);
        if (!parent)
            throw new errorHandler_1.AppError(400, 'Parent category not found');
    }
    const baseSlug = data.slug?.trim()
        ? (0, slugHelpers_1.slugify)(data.slug)
        : (0, slugHelpers_1.slugify)(data.name);
    const slug = await (0, slugHelpers_1.uniqueSlug)(baseSlug, (s) => categoryRepo.slugExists(s));
    const sortOrder = data.sort_order ?? 0;
    const id = await categoryRepo.create({
        parent_id: data.parent_id ?? null,
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        image: data.image ?? null,
        banner_image: data.banner_image ?? null,
        sort_order: sortOrder,
    });
    const row = await categoryRepo.findById(id);
    if (!row)
        throw new errorHandler_1.AppError(500, 'Failed to create category');
    return toPublic(row);
}
async function update(id, data) {
    const existing = await categoryRepo.findById(id);
    if (!existing)
        throw new errorHandler_1.AppError(404, 'Category not found');
    if (data.parent_id !== undefined && data.parent_id !== null) {
        if (data.parent_id === id)
            throw new errorHandler_1.AppError(400, 'Category cannot be its own parent');
        const parent = await categoryRepo.findById(data.parent_id);
        if (!parent)
            throw new errorHandler_1.AppError(400, 'Parent category not found');
    }
    const updates = {};
    if (data.name !== undefined)
        updates.name = data.name.trim();
    if (data.description !== undefined)
        updates.description = data.description?.trim() || null;
    if (data.image !== undefined)
        updates.image = data.image;
    if (data.banner_image !== undefined)
        updates.banner_image = data.banner_image;
    if (data.sort_order !== undefined)
        updates.sort_order = data.sort_order;
    if (data.parent_id !== undefined)
        updates.parent_id = data.parent_id;
    if (data.slug !== undefined) {
        updates.slug = data.slug.trim() ? (0, slugHelpers_1.slugify)(data.slug) : (0, slugHelpers_1.slugify)(existing.name);
        updates.slug = await (0, slugHelpers_1.uniqueSlug)(updates.slug, (s) => categoryRepo.slugExists(s, id));
    }
    else if (data.name !== undefined && data.name.trim() !== existing.name) {
        const baseSlug = (0, slugHelpers_1.slugify)(data.name);
        updates.slug = await (0, slugHelpers_1.uniqueSlug)(baseSlug, (s) => categoryRepo.slugExists(s, id));
    }
    if (Object.keys(updates).length > 0) {
        await categoryRepo.update(id, updates);
    }
    const row = await categoryRepo.findById(id);
    if (!row)
        throw new errorHandler_1.AppError(404, 'Category not found');
    return toPublic(row);
}
async function remove(id) {
    const existed = await categoryRepo.softDelete(id);
    if (!existed)
        throw new errorHandler_1.AppError(404, 'Category not found');
}
async function list(nested) {
    const rows = await categoryRepo.findAll();
    const flat = rows.map(toPublic);
    if (nested)
        return buildTree(flat, null);
    return flat;
}
async function listPaginated(page, limit) {
    const safeLimit = Math.min(Math.max(1, limit), 200);
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;
    const [total, rows] = await Promise.all([
        categoryRepo.countActive(),
        categoryRepo.findPage(safeLimit, offset),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / safeLimit) || 1);
    return {
        categories: rows.map(toPublic),
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
    };
}
async function getBySlug(slug) {
    const row = await categoryRepo.findBySlug(slug);
    if (!row)
        throw new errorHandler_1.AppError(404, 'Category not found');
    return toPublic(row);
}
//# sourceMappingURL=categoryService.js.map