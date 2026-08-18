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
exports.setActive = setActive;
exports.remove = remove;
exports.list = list;
exports.getById = getById;
exports.validateCoupon = validateCoupon;
exports.applyCoupon = applyCoupon;
const errorHandler_1 = require("../middlewares/errorHandler");
const couponRepo = __importStar(require("../repositories/couponRepository"));
function toPublic(row) {
    return {
        id: row.id,
        code: row.code,
        type: row.type,
        value: Number(row.value),
        min_order_amount: row.min_order_amount != null ? Number(row.min_order_amount) : null,
        max_uses: row.max_uses != null ? row.max_uses : null,
        max_uses_per_user: row.max_uses_per_user != null ? row.max_uses_per_user : null,
        used_count: row.used_count,
        valid_from: row.valid_from ? row.valid_from.toISOString() : null,
        valid_until: row.valid_until ? row.valid_until.toISOString() : null,
        is_active: Boolean(row.is_active),
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
    };
}
async function create(data) {
    if (await couponRepo.codeExists(data.code)) {
        throw new errorHandler_1.AppError(409, 'Coupon code already exists');
    }
    if (data.type === 'percentage' && (data.value <= 0 || data.value > 100)) {
        throw new errorHandler_1.AppError(400, 'Percentage value must be between 1 and 100');
    }
    if (data.type === 'fixed_amount' && data.value <= 0) {
        throw new errorHandler_1.AppError(400, 'Fixed amount must be greater than 0');
    }
    const id = await couponRepo.create({
        code: data.code,
        type: data.type,
        value: data.value,
        min_order_amount: data.min_order_amount ?? null,
        max_uses: data.max_uses ?? null,
        max_uses_per_user: data.max_uses_per_user ?? null,
        valid_from: data.valid_from ?? null,
        valid_until: data.valid_until ?? null,
        is_active: data.is_active !== false ? 1 : 0,
    });
    if (data.product_ids?.length)
        await couponRepo.setCouponProducts(id, data.product_ids);
    if (data.category_ids?.length)
        await couponRepo.setCouponCategories(id, data.category_ids);
    const row = await couponRepo.findById(id);
    if (!row)
        throw new errorHandler_1.AppError(500, 'Failed to create coupon');
    return toPublic(row);
}
async function update(id, data) {
    const existing = await couponRepo.findById(id);
    if (!existing)
        throw new errorHandler_1.AppError(404, 'Coupon not found');
    if (data.code !== undefined && data.code !== existing.code && (await couponRepo.codeExists(data.code, id))) {
        throw new errorHandler_1.AppError(409, 'Coupon code already exists');
    }
    if (data.type === 'percentage' && data.value !== undefined && (data.value <= 0 || data.value > 100)) {
        throw new errorHandler_1.AppError(400, 'Percentage value must be between 1 and 100');
    }
    if (data.type === 'fixed_amount' && data.value !== undefined && data.value <= 0) {
        throw new errorHandler_1.AppError(400, 'Fixed amount must be greater than 0');
    }
    const updates = {};
    if (data.code !== undefined)
        updates.code = data.code;
    if (data.type !== undefined)
        updates.type = data.type;
    if (data.value !== undefined)
        updates.value = data.value;
    if (data.min_order_amount !== undefined)
        updates.min_order_amount = data.min_order_amount;
    if (data.max_uses !== undefined)
        updates.max_uses = data.max_uses;
    if (data.max_uses_per_user !== undefined)
        updates.max_uses_per_user = data.max_uses_per_user;
    if (data.valid_from !== undefined)
        updates.valid_from = data.valid_from;
    if (data.valid_until !== undefined)
        updates.valid_until = data.valid_until;
    if (data.is_active !== undefined)
        updates.is_active = data.is_active ? 1 : 0;
    if (Object.keys(updates).length > 0)
        await couponRepo.update(id, updates);
    if (data.product_ids !== undefined)
        await couponRepo.setCouponProducts(id, data.product_ids);
    if (data.category_ids !== undefined)
        await couponRepo.setCouponCategories(id, data.category_ids);
    const row = await couponRepo.findById(id);
    if (!row)
        throw new errorHandler_1.AppError(404, 'Coupon not found');
    return toPublic(row);
}
async function setActive(id, isActive) {
    return update(id, { is_active: isActive });
}
async function remove(id) {
    const existing = await couponRepo.findById(id);
    if (!existing)
        throw new errorHandler_1.AppError(404, 'Coupon not found');
    const ok = await couponRepo.softDelete(id);
    if (!ok)
        throw new errorHandler_1.AppError(404, 'Coupon not found');
}
async function list() {
    const rows = await couponRepo.findAll();
    return rows.map(toPublic);
}
async function getById(id) {
    const row = await couponRepo.findById(id);
    if (!row)
        throw new errorHandler_1.AppError(404, 'Coupon not found');
    const [product_ids, category_ids] = await Promise.all([
        couponRepo.getCouponProductIds(id),
        couponRepo.getCouponCategoryIds(id),
    ]);
    return { ...toPublic(row), product_ids, category_ids };
}
/**
 * Validate a coupon for cart/checkout. Reusable from cart preview or checkout.
 * @param code - Coupon code (case-insensitive)
 * @param userId - Current user id (for per-user usage limit)
 * @param subtotal - Cart/order subtotal
 * @param items - Optional cart/order lines for product/category restrictions
 */
async function validateCoupon(code, userId, subtotal, items) {
    const coupon = await couponRepo.findByCode(code);
    if (!coupon) {
        return { valid: false, message: 'Invalid coupon code' };
    }
    if (!coupon.is_active) {
        return { valid: false, message: 'Coupon is not active' };
    }
    const now = new Date();
    if (coupon.valid_from && now < coupon.valid_from) {
        return { valid: false, message: 'Coupon is not yet valid' };
    }
    if (coupon.valid_until && now > coupon.valid_until) {
        return { valid: false, message: 'Coupon has expired' };
    }
    if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
        return { valid: false, message: 'Coupon has reached maximum uses' };
    }
    const userUsageCount = userId == null ? 0 : await couponRepo.countUsagesByUser(coupon.id, userId);
    if (userId != null && coupon.max_uses_per_user != null && userUsageCount >= coupon.max_uses_per_user) {
        return { valid: false, message: 'You have already used this coupon the maximum number of times' };
    }
    const minOrder = coupon.min_order_amount != null ? Number(coupon.min_order_amount) : null;
    let eligibleSubtotal = subtotal;
    const productIds = await couponRepo.getCouponProductIds(coupon.id);
    const categoryIds = await couponRepo.getCouponCategoryIds(coupon.id);
    const hasRestriction = productIds.length > 0 || categoryIds.length > 0;
    if (hasRestriction && items && items.length > 0) {
        eligibleSubtotal = items
            .filter((item) => productIds.includes(item.product_id) ||
            (item.category_id != null && categoryIds.includes(item.category_id)))
            .reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
        if (eligibleSubtotal <= 0) {
            return { valid: false, message: 'Coupon does not apply to any items in your cart' };
        }
    }
    if (minOrder != null && eligibleSubtotal < minOrder) {
        return {
            valid: false,
            message: `Minimum order amount for this coupon is ${minOrder}`,
        };
    }
    let discountAmount;
    if (coupon.type === 'percentage') {
        discountAmount = (eligibleSubtotal * Number(coupon.value)) / 100;
    }
    else {
        discountAmount = Math.min(Number(coupon.value), eligibleSubtotal);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;
    return {
        valid: true,
        coupon: toPublic(coupon),
        discount_amount: discountAmount,
        eligible_subtotal: Math.round(eligibleSubtotal * 100) / 100,
    };
}
/**
 * Record coupon usage after order is placed. Call from checkout/order service.
 */
async function applyCoupon(couponId, orderId, userId, discountAmount) {
    await couponRepo.recordUsage(couponId, orderId, userId, discountAmount);
    await couponRepo.incrementUsedCount(couponId);
}
//# sourceMappingURL=couponService.js.map