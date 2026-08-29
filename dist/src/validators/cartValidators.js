"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeItemValidator = exports.updateItemValidator = exports.addItemValidator = void 0;
const express_validator_1 = require("express-validator");
exports.addItemValidator = [
    (0, express_validator_1.body)('product_id').isInt({ min: 1 }).withMessage('product_id must be a positive integer').toInt(),
    (0, express_validator_1.body)('quantity').isInt({ min: 1 }).withMessage('quantity must be at least 1').toInt(),
    (0, express_validator_1.body)('variation_id')
        .optional({ values: 'null' })
        .custom((value) => {
        if (value === undefined || value === null || value === '')
            return true;
        const n = Number(value);
        return Number.isFinite(n) && n >= 1 && Math.floor(n) === n;
    })
        .withMessage('variation_id must be a positive integer')
        .customSanitizer((value) => {
        if (value === undefined || value === null || value === '')
            return undefined;
        return Math.trunc(Number(value));
    }),
    (0, express_validator_1.body)('selections')
        .optional({ values: 'null' })
        .custom((value) => value == null || (typeof value === 'object' && !Array.isArray(value)))
        .withMessage('selections must be an object'),
];
exports.updateItemValidator = [
    (0, express_validator_1.param)('itemId').isInt({ min: 1 }).withMessage('Valid item id is required').toInt(),
    (0, express_validator_1.body)('quantity')
        .optional({ values: 'null' })
        .isInt({ min: 1 })
        .withMessage('quantity must be at least 1')
        .toInt(),
    (0, express_validator_1.body)('variation_id')
        .optional({ values: 'null' })
        .custom((value) => {
        if (value === undefined || value === null || value === '')
            return true;
        const n = Number(value);
        return Number.isFinite(n) && n >= 1 && Math.floor(n) === n;
    })
        .withMessage('variation_id must be a positive integer')
        .customSanitizer((value) => {
        if (value === undefined || value === null || value === '')
            return undefined;
        return Math.trunc(Number(value));
    }),
    (0, express_validator_1.body)('selections')
        .optional({ values: 'null' })
        .custom((value) => value == null || (typeof value === 'object' && !Array.isArray(value)))
        .withMessage('selections must be an object'),
];
exports.removeItemValidator = [
    (0, express_validator_1.param)('itemId').isInt({ min: 1 }).withMessage('Valid item id is required').toInt(),
];
//# sourceMappingURL=cartValidators.js.map