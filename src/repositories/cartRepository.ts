import { CartItemModel, CartModel, ProductModel } from '../database/models';
import { nextId } from '../database/counter';
import type { CartRow, CartItemRow } from '../types/cart';

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function cartRow(doc: any): CartRow {
  return {
    id: Number(doc.id),
    user_id: doc.user_id ?? null,
    session_id: doc.session_id ?? null,
    created_at: date(doc.created_at),
    updated_at: date(doc.updated_at),
  };
}

function itemRow(doc: any): CartItemRow & { cart_id: number } {
  return {
    id: Number(doc.id),
    cart_id: Number(doc.cart_id),
    product_id: Number(doc.product_id),
    variation_id: doc.variation_id ?? null,
    quantity: Number(doc.quantity ?? 1),
    selections: doc.selections ?? null,
    created_at: date(doc.created_at),
    updated_at: date(doc.updated_at),
  };
}

export async function findCartByUserId(userId: number): Promise<CartRow | null> {
  const row = await CartModel.findOne({ user_id: userId }).lean();
  return row ? cartRow(row) : null;
}

export async function createCart(userId: number): Promise<number> {
  const id = await nextId('carts');
  await CartModel.create({ id, user_id: userId, session_id: null });
  return id;
}

export async function findCartItemById(itemId: number): Promise<(CartItemRow & { cart_id: number }) | null> {
  const row = await CartItemModel.findOne({ id: itemId }).lean();
  return row ? itemRow(row) : null;
}

export async function findCartItemByCartAndProduct(cartId: number, productId: number): Promise<CartItemRow | null> {
  const row = await CartItemModel.findOne({ cart_id: cartId, product_id: productId }).lean();
  return row ? itemRow(row) : null;
}

export async function findCartItemByCartProductVariationAndSelections(
  cartId: number,
  productId: number,
  variationId: number | null,
  selectionsJson: string
): Promise<CartItemRow | null> {
  const selections = JSON.parse(selectionsJson);
  const row = await CartItemModel.findOne({
    cart_id: cartId,
    product_id: productId,
    variation_id: variationId,
    selections,
  }).lean();
  return row ? itemRow(row) : null;
}

export async function findCartItemsByCartId(cartId: number): Promise<CartItemRow[]> {
  const rows = await CartItemModel.find({ cart_id: cartId }).sort({ id: 1 }).lean();
  return rows.map(itemRow);
}

export interface CartItemWithProduct {
  id: number;
  cart_id: number;
  product_id: number;
  variation_id: number | null;
  quantity: number;
  selections: Record<string, unknown> | null;
  product_name: string;
  product_slug: string;
  product_type: string;
  product_quantity: number | null;
  category_id: number | null;
  base_price: number;
}

export async function findCartItemsWithProducts(cartId: number): Promise<CartItemWithProduct[]> {
  const items = await CartItemModel.find({ cart_id: cartId }).sort({ id: 1 }).lean();
  const productIds = items.map((item: any) => Number(item.product_id));
  const products = await ProductModel.find({ id: { $in: productIds }, deleted_at: null }).lean();
  const productById = new Map(products.map((product: any) => [Number(product.id), product]));
  return items.flatMap((item: any) => {
    const product = productById.get(Number(item.product_id)) as any;
    if (!product) return [];
    return [{
      id: Number(item.id),
      cart_id: Number(item.cart_id),
      product_id: Number(item.product_id),
      variation_id: item.variation_id ?? null,
      quantity: Number(item.quantity ?? 1),
      selections: item.selections ?? null,
      product_name: String(product.name),
      product_slug: String(product.slug),
      product_type: String(product.product_type),
      product_quantity: product.quantity != null ? Number(product.quantity) : null,
      category_id: product.category_id ?? null,
      base_price: Number(product.price ?? 0),
    }];
  });
}

export async function createCartItem(
  cartId: number,
  productId: number,
  variationId: number | null,
  quantity: number,
  selections: Record<string, string>
): Promise<number> {
  const id = await nextId('cart_items');
  await CartItemModel.create({ id, cart_id: cartId, product_id: productId, variation_id: variationId, quantity, selections });
  return id;
}

export async function updateCartItemQuantity(cartId: number, itemId: number, quantity: number): Promise<boolean> {
  const result = await CartItemModel.updateOne({ id: itemId, cart_id: cartId }, { $set: { quantity } });
  return result.modifiedCount > 0;
}

export async function updateCartItem(
  cartId: number,
  itemId: number,
  updates: {
    quantity?: number;
    variation_id?: number | null;
    selections?: Record<string, string> | null;
  }
): Promise<boolean> {
  const setObj: Record<string, unknown> = {};
  if (updates.quantity !== undefined) setObj.quantity = updates.quantity;
  if (updates.variation_id !== undefined) setObj.variation_id = updates.variation_id;
  if (updates.selections !== undefined) setObj.selections = updates.selections;
  const result = await CartItemModel.updateOne({ id: itemId, cart_id: cartId }, { $set: setObj });
  return result.modifiedCount > 0;
}

export async function deleteCartItem(cartId: number, itemId: number): Promise<boolean> {
  const result = await CartItemModel.deleteOne({ id: itemId, cart_id: cartId });
  return result.deletedCount > 0;
}

export async function deleteCartItemsByCartId(cartId: number): Promise<void> {
  await CartItemModel.deleteMany({ cart_id: cartId });
}
