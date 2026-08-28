import { CategoryModel, ProductModel, ReviewModel } from '../database/models';
import { nextId } from '../database/counter';
import type { ReviewRow } from '../types/review';

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function row(doc: any): ReviewRow {
  return {
    id: Number(doc.id),
    product_id: Number(doc.product_id),
    user_id: Number(doc.user_id),
    order_id: doc.order_id ?? null,
    rating: Number(doc.rating ?? 0),
    title: doc.title ?? null,
    body: doc.body ?? null,
    image_path: doc.image_path ?? null,
    reviewer_name: doc.reviewer_name ?? null,
    status: doc.status ?? 'approved',
    created_at: date(doc.created_at),
    updated_at: date(doc.updated_at),
    deleted_at: doc.deleted_at ? date(doc.deleted_at) : null,
  };
}

export async function create(data: {
  product_id: number;
  user_id: number;
  order_id: number | null;
  rating: number;
  title: string | null;
  body: string | null;
  image_path?: string | null;
  reviewer_name?: string | null;
}): Promise<number> {
  const id = await nextId('reviews');
  await ReviewModel.create({ id, ...data, status: 'approved', deleted_at: null });
  return id;
}

export async function findById(id: number): Promise<ReviewRow | null> {
  const doc = await ReviewModel.findOne({ id }).lean();
  return doc ? row(doc) : null;
}

export async function findByUserAndProduct(userId: number, productId: number): Promise<ReviewRow | null> {
  const doc = await ReviewModel.findOne({ user_id: userId, product_id: productId }).lean();
  return doc ? row(doc) : null;
}

export interface ReviewListRow {
  id: number;
  product_id: number;
  user_id: number;
  order_id: number | null;
  rating: number;
  title: string | null;
  body: string | null;
  image_path: string | null;
  reviewer_name: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export async function findByProductIdPublic(
  productId: number,
  options: { limit?: number; offset?: number } = {}
): Promise<ReviewListRow[]> {
  const rows = await ReviewModel.find({ product_id: productId, deleted_at: null })
    .sort({ created_at: -1 })
    .skip(options.offset ?? 0)
    .limit(Math.min(options.limit ?? 50, 100))
    .lean();
  return rows.map(row);
}

export async function countByProductIdPublic(productId: number): Promise<number> {
  return ReviewModel.countDocuments({ product_id: productId, deleted_at: null });
}

export interface ReviewAdminTableJoinRow extends ReviewListRow {
  product_name: string;
  product_slug: string;
  category_id: number | null;
  category_name: string | null;
}

/** Public review enriched with the product needed to link from the homepage. */
export interface ReviewPublicJoinRow extends ReviewListRow {
  product_name: string;
  product_slug: string;
}

async function enrichAdminRows(reviews: any[]): Promise<ReviewAdminTableJoinRow[]> {
  const productIds = [...new Set(reviews.map((r) => Number(r.product_id)))];
  const products = await ProductModel.find({ id: { $in: productIds }, deleted_at: null }).lean();
  const categoryIds = [...new Set(products.map((p: any) => p.category_id).filter((id) => id != null).map(Number))];
  const categories = await CategoryModel.find({ id: { $in: categoryIds }, deleted_at: null }).lean();
  const productById = new Map(products.map((p: any) => [Number(p.id), p]));
  const categoryById = new Map(categories.map((c: any) => [Number(c.id), c]));
  return reviews.flatMap((reviewDoc) => {
    const product = productById.get(Number(reviewDoc.product_id)) as any;
    if (!product) return [];
    const category = product.category_id != null ? categoryById.get(Number(product.category_id)) as any : null;
    return [{
      ...row(reviewDoc),
      product_name: String(product.name),
      product_slug: String(product.slug),
      category_id: product.category_id ?? null,
      category_name: category ? String(category.name) : null,
    }];
  });
}

function productQueryForCategory(categoryId: number | undefined): Record<string, unknown> {
  const query: Record<string, unknown> = { deleted_at: null };
  if (categoryId === 0) query.category_id = null;
  else if (categoryId != null && categoryId > 0) query.category_id = categoryId;
  return query;
}

export async function findAllAdmin(
  categoryId: number | undefined,
  options: { limit?: number; offset?: number } = {}
): Promise<ReviewAdminTableJoinRow[]> {
  const products = await ProductModel.find(productQueryForCategory(categoryId)).select({ id: 1 }).lean();
  const productIds = products.map((p: any) => Number(p.id));
  const rows = await ReviewModel.find({ product_id: { $in: productIds } })
    .sort({ created_at: -1 })
    .skip(options.offset ?? 0)
    .limit(Math.min(options.limit ?? 10, 100))
    .lean();
  return enrichAdminRows(rows);
}

export async function countAllAdmin(categoryId: number | undefined): Promise<number> {
  const products = await ProductModel.find(productQueryForCategory(categoryId)).select({ id: 1 }).lean();
  return ReviewModel.countDocuments({ product_id: { $in: products.map((p: any) => Number(p.id)) } });
}

/** Latest non-hidden reviews across all existing products, for storefront testimonials. */
export async function findAllPublic(
  options: { limit?: number; offset?: number } = {}
): Promise<ReviewPublicJoinRow[]> {
  const reviews = await ReviewModel.find({ deleted_at: null })
    .sort({ created_at: -1 })
    .skip(options.offset ?? 0)
    .limit(Math.min(options.limit ?? 50, 100))
    .lean();
  return enrichAdminRows(reviews);
}

export async function countAllPublic(): Promise<number> {
  return ReviewModel.countDocuments({ deleted_at: null });
}

export async function findByProductIdAdmin(
  productId: number,
  options: { limit?: number; offset?: number } = {}
): Promise<ReviewListRow[]> {
  const rows = await ReviewModel.find({ product_id: productId })
    .sort({ created_at: -1 })
    .skip(options.offset ?? 0)
    .limit(Math.min(options.limit ?? 50, 100))
    .lean();
  return rows.map(row);
}

export async function countByProductIdAdmin(productId: number): Promise<number> {
  return ReviewModel.countDocuments({ product_id: productId });
}

export async function update(
  id: number,
  data: { rating?: number; title?: string | null; body?: string | null; image_path?: string | null; reviewer_name?: string | null }
): Promise<boolean> {
  const patch: Record<string, unknown> = {};
  if (data.rating !== undefined) patch.rating = data.rating;
  if (data.title !== undefined) patch.title = data.title;
  if (data.body !== undefined) patch.body = data.body;
  if (data.image_path !== undefined) patch.image_path = data.image_path;
  if (data.reviewer_name !== undefined) patch.reviewer_name = data.reviewer_name;
  if (Object.keys(patch).length === 0) return true;
  const result = await ReviewModel.updateOne({ id }, { $set: patch });
  return result.modifiedCount > 0;
}

export async function setHidden(id: number, hidden: boolean): Promise<boolean> {
  const result = await ReviewModel.updateOne({ id }, { $set: { deleted_at: hidden ? new Date() : null } });
  return result.modifiedCount > 0;
}
