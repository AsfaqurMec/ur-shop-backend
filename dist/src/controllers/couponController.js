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
exports.list = list;
exports.getById = getById;
exports.create = create;
exports.update = update;
exports.setActive = setActive;
exports.remove = remove;
exports.validate = validate;
const apiResponse_1 = require("../utils/apiResponse");
const couponService = __importStar(require("../services/couponService"));
async function list(req, res) {
    const coupons = await couponService.list();
    return (0, apiResponse_1.sendSuccess)(res, { coupons });
}
async function getById(req, res) {
    const id = Number(req.params.id);
    const coupon = await couponService.getById(id);
    return (0, apiResponse_1.sendSuccess)(res, { coupon });
}
async function create(req, res) {
    const body = req.body;
    const coupon = await couponService.create({
        code: body.code,
        type: body.type,
        value: body.value,
        min_order_amount: body.min_order_amount,
        max_uses: body.max_uses,
        max_uses_per_user: body.max_uses_per_user,
        valid_from: body.valid_from,
        valid_until: body.valid_until,
        is_active: body.is_active,
        product_ids: body.product_ids,
        category_ids: body.category_ids,
    });
    return (0, apiResponse_1.sendSuccess)(res, { coupon }, 201);
}
async function update(req, res) {
    const id = Number(req.params.id);
    const body = req.body;
    const coupon = await couponService.update(id, {
        code: body.code,
        type: body.type,
        value: body.value,
        min_order_amount: body.min_order_amount,
        max_uses: body.max_uses,
        max_uses_per_user: body.max_uses_per_user,
        valid_from: body.valid_from,
        valid_until: body.valid_until,
        is_active: body.is_active,
        product_ids: body.product_ids,
        category_ids: body.category_ids,
    });
    return (0, apiResponse_1.sendSuccess)(res, { coupon });
}
async function setActive(req, res) {
    const id = Number(req.params.id);
    const isActive = req.body.is_active === true;
    const coupon = await couponService.setActive(id, isActive);
    return (0, apiResponse_1.sendSuccess)(res, { coupon }, 200, isActive ? 'Coupon enabled' : 'Coupon disabled');
}
async function remove(req, res) {
    const id = Number(req.params.id);
    await couponService.remove(id);
    return (0, apiResponse_1.sendSuccess)(res, {}, 200, 'Coupon deleted');
}
async function validate(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const userId = req.user.id;
    const { code, subtotal, items } = req.body;
    const result = await couponService.validateCoupon(code, userId, subtotal, items);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
//# sourceMappingURL=couponController.js.map