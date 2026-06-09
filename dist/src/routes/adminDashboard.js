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
const express_1 = require("express");
const adminDashboardController = __importStar(require("../controllers/adminDashboardController"));
const validate_1 = require("../middlewares/validate");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const asyncHandler_1 = require("../utils/asyncHandler");
const adminDashboardValidators_1 = require("../validators/adminDashboardValidators");
const dashboardValidators_1 = require("../validators/dashboardValidators");
const router = (0, express_1.Router)();
router.use(auth_1.auth);
router.use(admin_1.admin);
/** Dashboard summary counts (orders, revenue, customers, pending fulfillment, pending tickets). */
router.get('/summary', (0, asyncHandler_1.asyncHandler)(adminDashboardController.getDashboardSummary));
/** Sales summary (total revenue, paid order count). */
router.get('/sales', (0, asyncHandler_1.asyncHandler)(adminDashboardController.getSalesSummary));
/** Orders grouped by status. */
router.get('/orders-by-status', (0, asyncHandler_1.asyncHandler)(adminDashboardController.getOrdersByStatus));
/** Recent orders (query: limit, offset; default limit 10). */
router.get('/recent-orders', (0, validate_1.validate)(adminDashboardValidators_1.recentOrdersQueryValidator), (0, asyncHandler_1.asyncHandler)(adminDashboardController.getRecentOrders));
/** Outbound email audit log (query: limit, offset, template). */
router.get('/email-logs', (0, validate_1.validate)(adminDashboardValidators_1.emailLogsQueryValidator), (0, asyncHandler_1.asyncHandler)(adminDashboardController.getEmailLogs));
/** Customers who have placed orders (email, name, order count; query: limit, offset). */
router.get('/customers', (0, validate_1.validate)(adminDashboardValidators_1.customersListQueryValidator), (0, asyncHandler_1.asyncHandler)(adminDashboardController.getCustomersWithOrders));
router.patch('/customers/:userId', (0, validate_1.validate)(adminDashboardValidators_1.updateCustomerValidator), (0, asyncHandler_1.asyncHandler)(adminDashboardController.updateCustomer));
router.delete('/customers/:userId', (0, validate_1.validate)(adminDashboardValidators_1.customerUserIdParamValidator), (0, asyncHandler_1.asyncHandler)(adminDashboardController.deleteCustomer));
/** Recent payments (query: limit, default 10, max 200). */
router.get('/recent-payments', (0, validate_1.validate)(adminDashboardValidators_1.recentListValidator), (0, asyncHandler_1.asyncHandler)(adminDashboardController.getRecentPayments));
/** Top products by quantity sold (query: limit, default 10, max 20). */
router.get('/top-products', (0, validate_1.validate)(adminDashboardValidators_1.topProductsValidator), (0, asyncHandler_1.asyncHandler)(adminDashboardController.getTopProducts));
/** Low stock license key products (query: threshold, default 5). */
router.get('/low-stock-licenses', (0, validate_1.validate)(adminDashboardValidators_1.lowStockValidator), (0, asyncHandler_1.asyncHandler)(adminDashboardController.getLowStockLicenseProducts));
/** Pending fulfillment queue count. */
router.get('/pending-fulfillment-count', (0, asyncHandler_1.asyncHandler)(adminDashboardController.getPendingFulfillmentCount));
/** Pending (non-closed) tickets count. */
router.get('/pending-tickets-count', (0, asyncHandler_1.asyncHandler)(adminDashboardController.getPendingTicketsCount));
/** Order details by id (admin). */
router.get('/orders/:orderId', (0, validate_1.validate)(dashboardValidators_1.orderIdParamValidator), (0, asyncHandler_1.asyncHandler)(adminDashboardController.getOrderDetails));
router.patch('/orders/:orderId/status', (0, validate_1.validate)(adminDashboardValidators_1.updateOrderStatusValidator), (0, asyncHandler_1.asyncHandler)(adminDashboardController.updateOrderStatus));
exports.default = router;
//# sourceMappingURL=adminDashboard.js.map