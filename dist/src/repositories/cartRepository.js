"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCartByUserId = findCartByUserId;
exports.createCart = createCart;
exports.findCartItemById = findCartItemById;
exports.findCartItemByCartAndProduct = findCartItemByCartAndProduct;
exports.findCartItemByCartProductVariationAndSelections = findCartItemByCartProductVariationAndSelections;
exports.findCartItemsByCartId = findCartItemsByCartId;
exports.findCartItemsWithProducts = findCartItemsWithProducts;
exports.createCartItem = createCartItem;
exports.updateCartItemQuantity = updateCartItemQuantity;
exports.updateCartItem = updateCartItem;
exports.deleteCartItem = deleteCartItem;
exports.deleteCartItemsByCartId = deleteCartItemsByCartId;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function date(v) {
    return v ? new Date(v) : new Date();
}
function cartRow(doc) {
    return {
        id: Number(doc.id),
        user_id: doc.user_id ?? null,
        session_id: doc.session_id ?? null,
        created_at: date(doc.created_at),
        updated_at: date(doc.updated_at),
    };
}
function itemRow(doc) {
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
async function findCartByUserId(userId) {
    const row = await models_1.CartModel.findOne({ user_id: userId }).lean();
    return row ? cartRow(row) : null;
}
async function createCart(userId) {
    const id = await (0, counter_1.nextId)('carts');
    await models_1.CartModel.create({ id, user_id: userId, session_id: null });
    return id;
}
async function findCartItemById(itemId) {
    const row = await models_1.CartItemModel.findOne({ id: itemId }).lean();
    return row ? itemRow(row) : null;
}
async function findCartItemByCartAndProduct(cartId, productId) {
    const row = await models_1.CartItemModel.findOne({ cart_id: cartId, product_id: productId }).lean();
    return row ? itemRow(row) : null;
}
async function findCartItemByCartProductVariationAndSelections(cartId, productId, variationId, selectionsJson) {
    const selections = JSON.parse(selectionsJson);
    const row = await models_1.CartItemModel.findOne({
        cart_id: cartId,
        product_id: productId,
        variation_id: variationId,
        selections,
    }).lean();
    return row ? itemRow(row) : null;
}
async function findCartItemsByCartId(cartId) {
    const rows = await models_1.CartItemModel.find({ cart_id: cartId }).sort({ id: 1 }).lean();
    return rows.map(itemRow);
}
async function findCartItemsWithProducts(cartId) {
    const items = await models_1.CartItemModel.find({ cart_id: cartId }).sort({ id: 1 }).lean();
    const productIds = items.map((item) => Number(item.product_id));
    const products = await models_1.ProductModel.find({ id: { $in: productIds }, deleted_at: null }).lean();
    const productById = new Map(products.map((product) => [Number(product.id), product]));
    return items.flatMap((item) => {
        const product = productById.get(Number(item.product_id));
        if (!product)
            return [];
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
async function createCartItem(cartId, productId, variationId, quantity, selections) {
    const id = await (0, counter_1.nextId)('cart_items');
    await models_1.CartItemModel.create({ id, cart_id: cartId, product_id: productId, variation_id: variationId, quantity, selections });
    return id;
}
async function updateCartItemQuantity(cartId, itemId, quantity) {
    const result = await models_1.CartItemModel.updateOne({ id: itemId, cart_id: cartId }, { $set: { quantity } });
    return result.modifiedCount > 0;
}
async function updateCartItem(cartId, itemId, updates) {
    const setObj = {};
    if (updates.quantity !== undefined)
        setObj.quantity = updates.quantity;
    if (updates.variation_id !== undefined)
        setObj.variation_id = updates.variation_id;
    if (updates.selections !== undefined)
        setObj.selections = updates.selections;
    const result = await models_1.CartItemModel.updateOne({ id: itemId, cart_id: cartId }, { $set: setObj });
    return result.modifiedCount > 0;
}
async function deleteCartItem(cartId, itemId) {
    const result = await models_1.CartItemModel.deleteOne({ id: itemId, cart_id: cartId });
    return result.deletedCount > 0;
}
async function deleteCartItemsByCartId(cartId) {
    await models_1.CartItemModel.deleteMany({ cart_id: cartId });
}
//# sourceMappingURL=cartRepository.js.map