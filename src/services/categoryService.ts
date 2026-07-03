import { AppError } from '../middlewares/errorHandler';
import * as categoryRepo from '../repositories/categoryRepository';
import { slugify, uniqueSlug } from '../utils/slugHelpers';
import type { CategoryPublic, CategoryNested } from '../types/category';

function toPublic(row: {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  banner_image: string | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}): CategoryPublic {
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

function buildTree(flat: CategoryPublic[], parentId: number | null): CategoryNested[] {
  return flat
    .filter((c) => c.parent_id === parentId)
    .map((c) => ({
      ...c,
      children: buildTree(flat, c.id),
    }))
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export async function create(data: {
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  banner_image?: string | null;
  parent_id?: number | null;
  sort_order?: number;
}): Promise<CategoryPublic> {
  if (data.parent_id != null) {
    const parent = await categoryRepo.findById(data.parent_id);
    if (!parent) throw new AppError(400, 'Parent category not found');
  }
  const baseSlug = data.slug?.trim()
    ? slugify(data.slug)
    : slugify(data.name);
  const slug = await uniqueSlug(baseSlug, (s) => categoryRepo.slugExists(s));
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
  if (!row) throw new AppError(500, 'Failed to create category');
  return toPublic(row);
}

export async function update(
  id: number,
  data: {
    name?: string;
    slug?: string;
    description?: string | null;
    image?: string | null;
    banner_image?: string | null;
    parent_id?: number | null;
    sort_order?: number;
  }
): Promise<CategoryPublic> {
  const existing = await categoryRepo.findById(id);
  if (!existing) throw new AppError(404, 'Category not found');
  if (data.parent_id !== undefined && data.parent_id !== null) {
    if (data.parent_id === id) throw new AppError(400, 'Category cannot be its own parent');
    const parent = await categoryRepo.findById(data.parent_id);
    if (!parent) throw new AppError(400, 'Parent category not found');
  }
  const updates: Parameters<typeof categoryRepo.update>[1] = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.description !== undefined) updates.description = data.description?.trim() || null;
  if (data.image !== undefined) updates.image = data.image;
  if (data.banner_image !== undefined) updates.banner_image = data.banner_image;
  if (data.sort_order !== undefined) updates.sort_order = data.sort_order;
  if (data.parent_id !== undefined) updates.parent_id = data.parent_id;
  if (data.slug !== undefined) {
    updates.slug = data.slug.trim() ? slugify(data.slug) : slugify(existing.name);
    updates.slug = await uniqueSlug(updates.slug, (s) => categoryRepo.slugExists(s, id));
  } else if (data.name !== undefined && data.name.trim() !== existing.name) {
    const baseSlug = slugify(data.name);
    updates.slug = await uniqueSlug(baseSlug, (s) => categoryRepo.slugExists(s, id));
  }
  if (Object.keys(updates).length > 0) {
    await categoryRepo.update(id, updates);
  }
  const row = await categoryRepo.findById(id);
  if (!row) throw new AppError(404, 'Category not found');
  return toPublic(row);
}

export async function remove(id: number): Promise<void> {
  const existed = await categoryRepo.softDelete(id);
  if (!existed) throw new AppError(404, 'Category not found');
}

export async function list(nested: boolean): Promise<CategoryPublic[] | CategoryNested[]> {
  const rows = await categoryRepo.findAll();
  const flat = rows.map(toPublic);
  if (nested) return buildTree(flat, null);
  return flat;
}

export async function listPaginated(page: number, limit: number): Promise<{
  categories: CategoryPublic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
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

export async function getBySlug(slug: string): Promise<CategoryPublic> {
  const row = await categoryRepo.findBySlug(slug);
  if (!row) throw new AppError(404, 'Category not found');
  return toPublic(row);
}
