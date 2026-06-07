import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../database/pool';
import type { CartRow, CartItemRow } from '../types/cart';

export async function findCartByUserId(userId: number): Promise<CartRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, user_id, session_id, created_at, updated_at FROM carts WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return (rows[0] as CartRow) ?? null;
}

export async function createCart(userId: number): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO carts (user_id) VALUES (?)',
    [userId]
  );
  return result.insertId;
}

export async function findCartItemById(itemId: number): Promise<(CartItemRow & { cart_id: number }) | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, cart_id, product_id, variation_id, quantity, selections, created_at, updated_at FROM cart_items WHERE id = ? LIMIT 1',
    [itemId]
  );
  return (rows[0] as CartItemRow & { cart_id: number }) ?? null;
}

export async function findCartItemByCartAndProduct(cartId: number, productId: number): Promise<CartItemRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, cart_id, product_id, variation_id, quantity, selections, created_at, updated_at FROM cart_items WHERE cart_id = ? AND product_id = ? LIMIT 1',
    [cartId, productId]
  );
  return (rows[0] as CartItemRow) ?? null;
}

/** Match a cart line including variation and the same extra selections (canonical JSON). */
export async function findCartItemByCartProductVariationAndSelections(
  cartId: number,
  productId: number,
  variationId: number | null,
  selectionsJson: string
): Promise<CartItemRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, cart_id, product_id, variation_id, quantity, selections, created_at, updated_at
     FROM cart_items
     WHERE cart_id = ? AND product_id = ? AND variation_id <=> ? AND CAST(selections AS CHAR) = ?
     LIMIT 1`,
    [cartId, productId, variationId, selectionsJson]
  );
  return (rows[0] as CartItemRow) ?? null;
}

export async function findCartItemsByCartId(cartId: number): Promise<CartItemRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, cart_id, product_id, variation_id, quantity, selections, created_at, updated_at FROM cart_items WHERE cart_id = ? ORDER BY id ASC',
    [cartId]
  );
  return rows as CartItemRow[];
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
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT ci.id, ci.cart_id, ci.product_id, ci.variation_id, ci.quantity, ci.selections,
            p.name AS product_name, p.slug AS product_slug, p.product_type, p.quantity AS product_quantity, p.category_id, p.price AS base_price
     FROM cart_items ci
     INNER JOIN products p ON p.id = ci.product_id AND p.deleted_at IS NULL
     WHERE ci.cart_id = ?
     ORDER BY ci.id ASC`,
    [cartId]
  );
  return rows as CartItemWithProduct[];
}

export async function createCartItem(
  cartId: number,
  productId: number,
  variationId: number | null,
  quantity: number,
  selections: Record<string, string>
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO cart_items (cart_id, product_id, variation_id, quantity, selections) VALUES (?, ?, ?, ?, ?)',
    [cartId, productId, variationId, quantity, JSON.stringify(selections)]
  );
  return result.insertId;
}

export async function updateCartItemQuantity(cartId: number, itemId: number, quantity: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?',
    [quantity, itemId, cartId]
  );
  return result.affectedRows > 0;
}

export async function deleteCartItem(cartId: number, itemId: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
    [itemId, cartId]
  );
  return result.affectedRows > 0;
}

export async function deleteCartItemsByCartId(cartId: number): Promise<void> {
  await pool.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
}
