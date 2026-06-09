"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentOptionIdParamValidator = exports.updatePaymentOptionValidator = exports.createPaymentOptionValidator = void 0;
const express_validator_1 = require("express-validator");
const gatewayKey = (0, express_validator_1.body)('gateway_key')
    .trim()
    .isLength({ min: 2, max: 64 })
    .matches(/^[a-z][a-z0-9_]+$/)
    .withMessage('gateway_key: lowercase letter start, alphanumeric and underscores only');
exports.createPaymentOptionValidator = [
    (0, express_validator_1.body)('kind').isIn(['manual', 'merchant']).withMessage('kind must be manual or merchant'),
    gatewayKey,
    (0, express_validator_1.body)('name').trim().isLength({ min: 1, max: 255 }).withMessage('name is required'),
    (0, express_validator_1.body)('description').optional({ nullable: true }).isString(),
    (0, express_validator_1.body)('is_enabled').optional().isBoolean(),
    (0, express_validator_1.body)('sort_order').optional().isInt({ min: 0, max: 99999 }),
    (0, express_validator_1.body)('manual_flow')
        .optional({ nullable: true })
        .isIn(['mfs_reference', 'bank_proof'])
        .withMessage('manual_flow must be mfs_reference or bank_proof'),
    (0, express_validator_1.body)('bank_details').optional({ nullable: true }).isObject(),
    (0, express_validator_1.body)('merchant_credentials').optional({ nullable: true }).isObject(),
    (0, express_validator_1.body)('ui_brand')
        .optional({ nullable: true })
        .isIn(['generic', 'bkash', 'nagad', 'rocket'])
        .withMessage('ui_brand'),
];
exports.updatePaymentOptionValidator = [
    (0, express_validator_1.body)('name').optional().trim().isLength({ min: 1, max: 255 }),
    (0, express_validator_1.body)('description').optional({ nullable: true }).isString(),
    (0, express_validator_1.body)('is_enabled').optional().isBoolean(),
    (0, express_validator_1.body)('sort_order').optional().isInt({ min: 0, max: 99999 }),
    (0, express_validator_1.body)('manual_flow')
        .optional({ nullable: true })
        .isIn(['mfs_reference', 'bank_proof'])
        .withMessage('manual_flow'),
    (0, express_validator_1.body)('bank_details').optional({ nullable: true }).isObject(),
    (0, express_validator_1.body)('merchant_credentials').optional({ nullable: true }).isObject(),
    (0, express_validator_1.body)('ui_brand')
        .optional({ nullable: true })
        .isIn(['generic', 'bkash', 'nagad', 'rocket'])
        .withMessage('ui_brand'),
];
exports.paymentOptionIdParamValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Invalid id'),
];
//# sourceMappingURL=paymentOptionValidators.js.map