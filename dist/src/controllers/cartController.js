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
exports.getCart = getCart;
exports.addItem = addItem;
exports.updateItem = updateItem;
exports.removeItem = removeItem;
exports.clearCart = clearCart;
const apiResponse_1 = require("../utils/apiResponse");
const cartService = __importStar(require("../services/cartService"));
async function getCart(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const userId = req.user.id;
    const cart = await cartService.getCart(userId);
    return (0, apiResponse_1.sendSuccess)(res, { cart });
}
async function addItem(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const userId = req.user.id;
    const { product_id, quantity, selections, variation_id } = req.body;
    const vid = variation_id != null && variation_id !== '' ? Number(variation_id) : null;
    const cart = await cartService.addItem(userId, product_id, quantity, selections, vid);
    return (0, apiResponse_1.sendSuccess)(res, { cart }, 200, 'Item added to cart');
}
async function updateItem(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const userId = req.user.id;
    const itemId = Number(req.params.itemId);
    const { quantity, selections, variation_id } = req.body;
    const vid = variation_id !== undefined
        ? variation_id != null && variation_id !== ''
            ? Number(variation_id)
            : null
        : undefined;
    const cart = await cartService.updateItem(userId, itemId, quantity, selections, vid);
    return (0, apiResponse_1.sendSuccess)(res, { cart }, 200, 'Cart updated');
}
async function removeItem(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const userId = req.user.id;
    const itemId = Number(req.params.itemId);
    const cart = await cartService.removeItem(userId, itemId);
    return (0, apiResponse_1.sendSuccess)(res, { cart }, 200, 'Item removed from cart');
}
async function clearCart(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const userId = req.user.id;
    const cart = await cartService.clearCart(userId);
    return (0, apiResponse_1.sendSuccess)(res, { cart }, 200, 'Cart cleared');
}
//# sourceMappingURL=cartController.js.map