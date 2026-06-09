"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersListValidator = exports.orderIdParamValidator = void 0;
const express_validator_1 = require("express-validator");
exports.orderIdParamValidator = [
    (0, express_validator_1.param)('orderId').isInt({ min: 1 }).withMessage('Valid order id is required').toInt(),
];
exports.ordersListValidator = [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).toInt(),
];
//# sourceMappingURL=dashboardValidators.js.map