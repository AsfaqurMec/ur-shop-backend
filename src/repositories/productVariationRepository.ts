import { ProductModel, ProductVariationModel } from '../database/models';
import { nextId } from '../database/counter';
import { combinationSignature, parseCombination } from '../utils/combinationSignature';
import { AppError } from '../middlewares/errorHandler';

export interface ProductVariationRow {
  id: number;
  product_id: number;
  sku: string | null;
  quantity: number | null;
  price: number;
  compare_at_price: number | null;
  enabled: number;
  sort_order: number;
  combination: Record<string, string>;
  combination_signature: string;
}

export interface VariationReplaceInput {
  combination: Record<string, string>;
  sku: string | null;
  quantity: number | null;
  price: number;
  compare_at_price: number | null;
  enabled: boolean;
  sort_order: number;
}

function rowToVariation(r: any): ProductVariationRow {
  return {
    id: Number(r.id),
    product_id: Number(r.product_id),
    sku: r.sku ?? null,
    quantity: r.quantity != null ? Number(r.quantity) : null,
    price: Number(r.price),
    compare_at_price: r.compare_at_price != null ? Number(r.compare_at_price) : null,
    enabled: Number(r.enabled ?? 1),
    sort_order: Number(r.sort_order ?? 0),
    combination: parseCombination(r.combination),
    combination_signature: String(r.combination_signature),
  };
}

export async function findVariationsByProductId(productId: number): Promise<ProductVariationRow[]> {
  const rows = await ProductVariationModel.find({ product_id: productId })
    .sort({ sort_order: 1, id: 1 })
    .lean();
  return rows.map(rowToVariation);
}

export async function findVariationById(id: number): Promise<ProductVariationRow | null> {
  const row = await ProductVariationModel.findOne({ id }).lean();
  return row ? rowToVariation(row) : null;
}

export async function countEnabledVariations(productId: number): Promise<number> {
  return ProductVariationModel.countDocuments({ product_id: productId, enabled: 1 });
}

export async function setVariationQuantityAbsolute(variationId: number, quantity: number): Promise<void> {
  await ProductVariationModel.updateOne({ id: variationId }, { $set: { quantity } });
}

export async function adjustVariationQuantity(
  _conn: unknown,
  variationId: number,
  delta: number
): Promise<void> {
  if (delta === 0) return;
  const row = await ProductVariationModel.findOne({ id: variationId }).lean();
  if (!row) throw new AppError(400, 'Product option not found');
  if (row.quantity == null) return;
  const next = Number(row.quantity) + delta;
  if (next < 0) throw new AppError(400, 'Not enough stock for this product option');
  await ProductVariationModel.updateOne({ id: variationId }, { $set: { quantity: next } });
}

export async function deleteAllForProduct(_conn: unknown, productId: number): Promise<void> {
  await ProductModel.updateOne(
    { id: productId, default_variation_id: { $ne: null } },
    { $set: { default_variation_id: null } }
  );
  await ProductVariationModel.deleteMany({ product_id: productId });
}

export async function replaceVariationsForProduct(
  conn: unknown,
  productId: number,
  inputs: VariationReplaceInput[]
): Promise<void> {
  await deleteAllForProduct(conn, productId);
  for (const v of inputs) {
    const sig = combinationSignature(v.combination);
    await ProductVariationModel.create({
      id: await nextId('product_variations'),
      product_id: productId,
      sku: v.sku ?? null,
      quantity: v.quantity ?? null,
      price: v.price,
      compare_at_price: v.compare_at_price ?? null,
      enabled: v.enabled ? 1 : 0,
      sort_order: v.sort_order,
      combination: v.combination,
      combination_signature: sig,
    });
  }
}

export async function insertGeneratedCombinations(
  _conn: unknown,
  productId: number,
  combos: Record<string, string>[],
  defaultPrice: number
): Promise<number> {
  let added = 0;
  const last = await ProductVariationModel.findOne({ product_id: productId })
    .sort({ sort_order: -1 })
    .lean();
  let order = Number(last?.sort_order ?? -1) + 1;

  for (const combo of combos) {
    const sig = combinationSignature(combo);
    const exists = await ProductVariationModel.exists({ product_id: productId, combination_signature: sig });
    if (exists) continue;
    await ProductVariationModel.create({
      id: await nextId('product_variations'),
      product_id: productId,
      sku: null,
      quantity: null,
      price: defaultPrice,
      compare_at_price: null,
      enabled: 1,
      sort_order: order,
      combination: combo,
      combination_signature: sig,
    });
    order += 1;
    added += 1;
  }
  return added;
}
