"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomerValidator = exports.customerUserIdParamValidator = exports.customersListQueryValidator = exports.lowStockValidator = exports.topProductsValidator = exports.emailLogsQueryValidator = exports.updateOrderStatusValidator = exports.recentOrdersQueryValidator = exports.recentListValidator = void 0;
const express_validator_1 = require("express-validator");
const ADMIN_ORDER_STATUSES = ['pending', 'paid', 'unpaid', 'processing', 'completed', 'refunded', 'cancelled'];
exports.recentListValidator = [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
];
/** Recent orders list: optional offset for pagination. */
exports.recentOrdersQueryValidator = [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0, max: 500_000 }).toInt(),
    (0, express_validator_1.query)('status').optional({ values: 'falsy' }).isIn(ADMIN_ORDER_STATUSES).withMessage('Invalid order status'),
];
exports.updateOrderStatusValidator = [
    (0, express_validator_1.param)('orderId').isInt({ min: 1 }).withMessage('Valid order id is required').toInt(),
    (0, express_validator_1.body)('status').isIn(['pending', 'paid', 'unpaid']).withMessage('Status must be pending, paid, or unpaid'),
];
/** Email logs: pagination + optional template filter (slug-style name). */
exports.emailLogsQueryValidator = [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0, max: 500_000 }).toInt(),
    (0, express_validator_1.query)('template')
        .optional({ values: 'falsy' })
        .trim()
        .isLength({ min: 1, max: 128 })
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Invalid template'),
];
exports.topProductsValidator = [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
];
exports.lowStockValidator = [
    (0, express_validator_1.query)('threshold').optional().isInt({ min: 0 }).toInt(),
];
/** Customers with orders: paginated list. */
exports.customersListQueryValidator = [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0, max: 500_000 }).toInt(),
];
exports.customerUserIdParamValidator = [
    (0, express_validator_1.param)('userId').isInt({ min: 1 }).withMessage('Valid user id is required').toInt(),
];
exports.updateCustomerValidator = [
    ...exports.customerUserIdParamValidator,
    (0, express_validator_1.body)('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('name').trim().isLength({ max: 255 }).withMessage('Name max 255 characters'),
];
//# sourceMappingURL=adminDashboardValidators.js.map