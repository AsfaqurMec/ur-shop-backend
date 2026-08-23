"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createOrderValidator = [
    (0, express_validator_1.body)('name').optional({ values: 'null' }).trim().isLength({ max: 255 }),
    (0, express_validator_1.body)('shipping_name').optional({ values: 'null' }).trim().isLength({ max: 255 }),
    (0, express_validator_1.body)('coupon_code').optional().trim().isLength({ max: 64 }).withMessage('coupon_code max 64 characters'),
    (0, express_validator_1.body)('payment_method').optional().trim().isLength({ min: 1, max: 64 }).withMessage('Invalid payment_method'),
    (0, express_validator_1.body)('transaction_id').optional().trim().isLength({ max: 128 }),
    (0, express_validator_1.body)('bkash_transaction_id').optional().trim().isLength({ max: 128 }),
    (0, express_validator_1.body)('sender_number').optional().trim().isLength({ max: 64 }),
    (0, express_validator_1.body)('payment_type').optional().trim().isLength({ max: 32 }),
    (0, express_validator_1.body)('mobile').trim().notEmpty().withMessage('Mobile number is required').isLength({ max: 32 }),
    (0, express_validator_1.body)('address').trim().notEmpty().withMessage('Address is required').isLength({ max: 1000 }),
    (0, express_validator_1.body)('postal_code').optional({ values: 'null' }).trim().isLength({ max: 32 }),
    (0, express_validator_1.body)('address_line2').optional({ values: 'null' }).trim().isLength({ max: 255 }),
    (0, express_validator_1.body)('shipping_method_id').optional({ values: 'null' }).trim().isLength({ max: 64 }),
];
//# sourceMappingURL=checkoutValidators.js.map