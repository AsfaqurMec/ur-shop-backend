import { AppError } from '../middlewares/errorHandler';
import * as cartRepo from '../repositories/cartRepository';
import * as productRepo from '../repositories/productRepository';
import * as variationRepo from '../repositories/productVariationRepository';
import type { CartPublic, CartItemPublic } from '../types/cart';
import type { ProductType } from '../types/product';
import type { ProductRow } from '../types/product';
import * as purchaseSelectionService from './purchaseSelectionService';

async function getOrCreateCart(userId: number): Promise<{ cartId: number }> {
  let cart = await cartRepo.findCartByUserId(userId);
  if (!cart) {
    const cartId = await cartRepo.createCart(userId);
    return { cartId };
  }
  return { cartId: cart.id };
}

async function resolveMaxCartQuantity(
  productId: number,
  productType: ProductType,
  variationId: number | null,
  productQuantity?: number | null
): Promise<number> {
  if (productType === 'license_key') {
    const hasVar = (await variationRepo.countEnabledVariations(productId)) > 0;
    if (hasVar) {
      if (variationId == null || variationId < 1) return 0;
      const n = await productRepo.countAvailableLicensesForVariation(productId, variationId);
      return Math.max(0, n);
    }
    const n = await productRepo.countAvailableLicensesNoVariation(productId);
    return Math.max(0, n);
  }
  if (variationId != null && variationId >= 1) {
    const row = await variationRepo.findVariationById(variationId);
    if (row && row.product_id === productId) {
      if (row.quantity != null) return Math.max(0, Number(row.quantity));
    }
  }
  if (productQuantity != null && Number(productQuantity) > 0) {
    return Math.max(0, Number(productQuantity));
  }
  return 99;
}

async function validateProductForCart(
  product: ProductRow,
  quantity: number,
  opts?: { variationId?: number | null }
): Promise<{ price: number; product_type: ProductType }> {
  const qty = Math.max(1, Math.floor(quantity));
  const pt = product.product_type as ProductType;
  const max = await resolveMaxCartQuantity(product.id, pt, opts?.variationId ?? null, product.quantity);
  if (max === 0) {
    throw new AppError(400, 'This product option is out of stock');
  }
  if (qty > max) {
    throw new AppError(
      400,
      max === 1 ? 'Quantity must be 1 for this product type' : `Only ${max} available for this item`
    );
  }
  return { price: Number(product.price), product_type: pt };
}

/** Re-validate a cart line at checkout (stock may have changed). */
export async function assertLineQuantityAllowed(
  productId: number,
  quantity: number,
  variationId: number | null
): Promise<void> {
  const product = await productRepo.findProductById(productId);
  if (!product) throw new AppError(400, 'Product not found');
  if (!product.is_active) throw new AppError(400, 'Product is not available for purchase');
  await validateProductForCart(product, quantity, { variationId });
}

async function buildCartPublic(cartId: number, items: cartRepo.CartItemWithProduct[]): Promise<CartPublic> {
  const productImagePaths = await productRepo.findPrimaryImagePathsByProductIds([...new Set(items.map((item) => item.product_id))]);
  const lines = await Promise.all(
    items.map(async (i) => {
      const resolved = await purchaseSelectionService.resolveLinePricing(
        i.product_id,
        Number(i.base_price),
        i.selections,
        i.variation_id
      );
      const maxQ = await resolveMaxCartQuantity(
        i.product_id,
        i.product_type as ProductType,
        i.variation_id,
        i.product_quantity
      );
      return {
        id: i.id,
        product_id: i.product_id,
        product_variation_id: i.variation_id,
        product_name: i.product_name,
        product_slug: i.product_slug,
        product_type: i.product_type,
        category_id: i.category_id,
        product_thumbnail: productImagePaths.get(i.product_id) ?? null,
        quantity: i.quantity,
        max_quantity: maxQ,
        unit_price: resolved.unit_price,
        line_total: Math.round(resolved.unit_price * i.quantity * 100) / 100,
        selections: resolved.normalized_selections,
        selections_summary: resolved.summary,
      };
    })
  );

  const itemCount = lines.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = lines.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const cartItems: CartItemPublic[] = lines.map((i) => ({
    id: i.id,
    product_id: i.product_id,
    product_variation_id: i.product_variation_id,
    product_name: i.product_name,
    product_slug: i.product_slug,
    product_type: i.product_type,
    category_id: i.category_id,
    product_thumbnail: i.product_thumbnail,
    quantity: i.quantity,
    max_quantity: i.max_quantity,
    unit_price: i.unit_price,
    line_total: i.line_total,
    selections: i.selections,
    selections_summary: i.selections_summary,
  }));
  return {
    id: cartId,
    items: cartItems,
    item_count: itemCount,
    subtotal: Math.round(subtotal * 100) / 100,
  };
}

export async function getCart(userId: number): Promise<CartPublic> {
  const { cartId } = await getOrCreateCart(userId);
  const items = await cartRepo.findCartItemsWithProducts(cartId);
  return buildCartPublic(cartId, items);
}

export async function addItem(
  userId: number,
  productId: number,
  quantity: number,
  rawSelections?: unknown,
  variationId?: number | null
): Promise<CartPublic> {
  const product = await productRepo.findProductById(productId);
  if (!product) throw new AppError(404, 'Product not found');
  if (!product.is_active) throw new AppError(400, 'Product is not available for purchase');

  const requestedVid =
    variationId != null && Number.isFinite(Number(variationId)) && Number(variationId) >= 1
      ? Math.trunc(Number(variationId))
      : null;
  const resolved = await purchaseSelectionService.resolveLinePricing(
    productId,
    Number(product.price),
    rawSelections,
    requestedVid
  );
  const storageVid =
    resolved.effective_variation_id != null ? resolved.effective_variation_id : requestedVid;
  const qty = Math.max(1, Math.floor(quantity));
  await validateProductForCart(product, qty, { variationId: storageVid });

  const max = await resolveMaxCartQuantity(
    productId,
    product.product_type as ProductType,
    storageVid,
    product.quantity
  );
  const { cartId } = await getOrCreateCart(userId);
  const selJson = JSON.stringify(resolved.normalized_selections);

  const existing = await cartRepo.findCartItemByCartProductVariationAndSelections(
    cartId,
    productId,
    storageVid,
    selJson
  );
  if (existing) {
    const candidateQty = existing.quantity + qty;
    const newQty = Math.min(candidateQty, max);
    await validateProductForCart(product, newQty, { variationId: storageVid });
    await cartRepo.updateCartItemQuantity(cartId, existing.id, newQty);
  } else {
    await cartRepo.createCartItem(cartId, productId, storageVid, qty, resolved.normalized_selections);
  }
  const items = await cartRepo.findCartItemsWithProducts(cartId);
  return buildCartPublic(cartId, items);
}

export async function updateItem(
  userId: number,
  itemId: number,
  quantity?: number,
  rawSelections?: unknown,
  variationId?: number | null
): Promise<CartPublic> {
  const item = await cartRepo.findCartItemById(itemId);
  if (!item) throw new AppError(404, 'Cart item not found');
  const cart = await cartRepo.findCartByUserId(userId);
  if (!cart || cart.id !== item.cart_id) throw new AppError(403, 'Cart item does not belong to your cart');
  const product = await productRepo.findProductById(item.product_id);
  if (!product) throw new AppError(404, 'Product not found');
  if (!product.is_active) throw new AppError(400, 'Product is not available for purchase');

  const requestedVid =
    variationId !== undefined
      ? variationId != null && Number.isFinite(Number(variationId)) && Number(variationId) >= 1
        ? Math.trunc(Number(variationId))
        : null
      : item.variation_id;

  const targetSelections = rawSelections !== undefined ? rawSelections : item.selections;

  const resolved = await purchaseSelectionService.resolveLinePricing(
    product.id,
    Number(product.price),
    targetSelections,
    requestedVid
  );

  const storageVid =
    resolved.effective_variation_id != null ? resolved.effective_variation_id : requestedVid;

  const targetQty = quantity !== undefined ? Math.max(1, Math.floor(quantity)) : item.quantity;
  await validateProductForCart(product, targetQty, { variationId: storageVid });

  const max = await resolveMaxCartQuantity(
    product.id,
    product.product_type as ProductType,
    storageVid,
    product.quantity
  );

  const finalQty = Math.min(targetQty, max);
  const selJson = JSON.stringify(resolved.normalized_selections);

  const existing = await cartRepo.findCartItemByCartProductVariationAndSelections(
    cart.id,
    product.id,
    storageVid,
    selJson
  );

  if (existing && existing.id !== itemId) {
    const candidateQty = existing.quantity + finalQty;
    const newQty = Math.min(candidateQty, max);
    await validateProductForCart(product, newQty, { variationId: storageVid });
    await cartRepo.updateCartItemQuantity(cart.id, existing.id, newQty);
    await cartRepo.deleteCartItem(cart.id, itemId);
  } else {
    await cartRepo.updateCartItem(cart.id, itemId, {
      quantity: finalQty,
      variation_id: storageVid,
      selections: resolved.normalized_selections,
    });
  }

  const items = await cartRepo.findCartItemsWithProducts(cart.id);
  return buildCartPublic(cart.id, items);
}

export async function removeItem(userId: number, itemId: number): Promise<CartPublic> {
  const item = await cartRepo.findCartItemById(itemId);
  if (!item) throw new AppError(404, 'Cart item not found');
  const cart = await cartRepo.findCartByUserId(userId);
  if (!cart || cart.id !== item.cart_id) throw new AppError(403, 'Cart item does not belong to your cart');
  await cartRepo.deleteCartItem(cart.id, itemId);
  const items = await cartRepo.findCartItemsWithProducts(cart.id);
  return buildCartPublic(cart.id, items);
}

export async function clearCart(userId: number): Promise<CartPublic> {
  const cart = await cartRepo.findCartByUserId(userId);
  if (!cart) {
    const { cartId } = await getOrCreateCart(userId);
    return buildCartPublic(cartId, []);
  }
  await cartRepo.deleteCartItemsByCartId(cart.id);
  return buildCartPublic(cart.id, []);
}
