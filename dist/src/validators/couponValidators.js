"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCouponValidator = exports.setActiveValidator = exports.couponIdParamValidator = exports.updateCouponValidator = exports.createCouponValidator = void 0;
const express_validator_1 = require("express-validator");
const CODE_MAX = 64;
exports.createCouponValidator = [
    (0, express_validator_1.body)('code').trim().notEmpty().withMessage('Code is required').isLength({ max: CODE_MAX }).withMessage(`Code max ${CODE_MAX} characters`),
    (0, express_validator_1.body)('type').isIn(['percentage', 'fixed_amount']).withMessage('type must be percentage or fixed_amount'),
    (0, express_validator_1.body)('value').isFloat({ min: 0.01 }).withMessage('value must be greater than 0').toFloat(),
    (0, express_validator_1.body)('min_order_amount').optional().isFloat({ min: 0 }).toFloat(),
    (0, express_validator_1.body)('max_uses').optional().isInt({ min: 0 }).toInt(),
    (0, express_validator_1.body)('max_uses_per_user').optional().isInt({ min: 0 }).toInt(),
    (0, express_validator_1.body)('valid_from').optional().isISO8601().withMessage('valid_from must be ISO 8601 date').toDate(),
    (0, express_validator_1.body)('valid_until').optional().isISO8601().withMessage('valid_until must be ISO 8601 date').toDate(),
    (0, express_validator_1.body)('is_active').optional().isBoolean().toBoolean(),
    (0, express_validator_1.body)('product_ids').optional().isArray().withMessage('product_ids must be an array'),
    (0, express_validator_1.body)('product_ids.*').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('category_ids').optional().isArray().withMessage('category_ids must be an array'),
    (0, express_validator_1.body)('category_ids.*').optional().isInt({ min: 1 }).toInt(),
];
exports.updateCouponValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid coupon id is required').toInt(),
    (0, express_validator_1.body)('code').optional().trim().notEmpty().withMessage('Code cannot be empty').isLength({ max: CODE_MAX }),
    (0, express_validator_1.body)('type').optional().isIn(['percentage', 'fixed_amount']),
    (0, express_validator_1.body)('value').optional().isFloat({ min: 0.01 }).toFloat(),
    (0, express_validator_1.body)('min_order_amount').optional().isFloat({ min: 0 }).toFloat(),
    (0, express_validator_1.body)('max_uses').optional().isInt({ min: 0 }).toInt(),
    (0, express_validator_1.body)('max_uses_per_user').optional().isInt({ min: 0 }).toInt(),
    (0, express_validator_1.body)('valid_from').optional({ nullable: true }).isISO8601().toDate(),
    (0, express_validator_1.body)('valid_until').optional({ nullable: true }).isISO8601().toDate(),
    (0, express_validator_1.body)('is_active').optional().isBoolean().toBoolean(),
    (0, express_validator_1.body)('product_ids').optional().isArray(),
    (0, express_validator_1.body)('product_ids.*').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('category_ids').optional().isArray(),
    (0, express_validator_1.body)('category_ids.*').optional().isInt({ min: 1 }).toInt(),
];
exports.couponIdParamValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid coupon id is required').toInt(),
];
exports.setActiveValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('is_active').isBoolean().withMessage('is_active must be true or false').toBoolean(),
];
exports.validateCouponValidator = [
    (0, express_validator_1.body)('code').trim().notEmpty().withMessage('Code is required'),
    (0, express_validator_1.body)('subtotal').isFloat({ min: 0 }).withMessage('subtotal must be a non-negative number').toFloat(),
    (0, express_validator_1.body)('items').optional().isArray().withMessage('items must be an array'),
    (0, express_validator_1.body)('items.*.product_id').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('items.*.category_id').optional().custom((v) => v === null || v === undefined || (Number.isInteger(Number(v)) && Number(v) >= 1)),
    (0, express_validator_1.body)('items.*.quantity').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('items.*.unit_price').optional().isFloat({ min: 0 }).toFloat(),
];
//# sourceMappingURL=couponValidators.js.map