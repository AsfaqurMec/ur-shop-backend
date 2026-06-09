"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markFulfillmentValidator = exports.fulfillmentIdParamValidator = exports.orderIdParamValidator = void 0;
const express_validator_1 = require("express-validator");
exports.orderIdParamValidator = [
    (0, express_validator_1.param)('orderId').isInt({ min: 1 }).withMessage('Valid order id is required').toInt(),
];
exports.fulfillmentIdParamValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid fulfillment id is required').toInt(),
];
exports.markFulfillmentValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('notes').optional().trim(),
];
//# sourceMappingURL=deliveryValidators.js.map