"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bkashExecuteValidator = exports.orderIdParamValidator = exports.proofIdParamValidator = exports.submitProofValidator = void 0;
const express_validator_1 = require("express-validator");
exports.submitProofValidator = [
    (0, express_validator_1.param)('orderId').isInt({ min: 1 }).withMessage('Valid order id is required').toInt(),
    (0, express_validator_1.body)('sender_number').optional().trim().isLength({ max: 64 }),
    (0, express_validator_1.body)('transaction_id').optional().trim().isLength({ max: 128 }),
    (0, express_validator_1.body)('paid_amount').optional().isFloat({ min: 0 }).withMessage('paid_amount must be a non-negative number').toFloat(),
];
exports.proofIdParamValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid proof id is required').toInt(),
];
exports.orderIdParamValidator = [
    (0, express_validator_1.param)('orderId').isInt({ min: 1 }).withMessage('Valid order id is required').toInt(),
];
exports.bkashExecuteValidator = [
    (0, express_validator_1.body)('payment_id').optional().trim().isLength({ min: 1, max: 80 }),
    (0, express_validator_1.body)('paymentID').optional().trim().isLength({ min: 1, max: 80 }),
    (0, express_validator_1.body)().custom((_, { req }) => {
        const a = String(req.body?.payment_id ?? '').trim();
        const b = String(req.body?.paymentID ?? '').trim();
        if (!a && !b)
            throw new Error('payment_id or paymentID is required');
        return true;
    }),
];
//# sourceMappingURL=manualPaymentValidators.js.map