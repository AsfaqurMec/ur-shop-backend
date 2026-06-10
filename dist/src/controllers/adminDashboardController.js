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
exports.getDashboardSummary = getDashboardSummary;
exports.getSalesSummary = getSalesSummary;
exports.getOrdersByStatus = getOrdersByStatus;
exports.getRecentOrders = getRecentOrders;
exports.updateOrderStatus = updateOrderStatus;
exports.getEmailLogs = getEmailLogs;
exports.getRecentPayments = getRecentPayments;
exports.getTopProducts = getTopProducts;
exports.getLowStockLicenseProducts = getLowStockLicenseProducts;
exports.getPendingFulfillmentCount = getPendingFulfillmentCount;
exports.getPendingTicketsCount = getPendingTicketsCount;
exports.getOrderDetails = getOrderDetails;
exports.getCustomersWithOrders = getCustomersWithOrders;
exports.updateCustomer = updateCustomer;
exports.deleteCustomer = deleteCustomer;
const apiResponse_1 = require("../utils/apiResponse");
const adminDashboardService = __importStar(require("../services/adminDashboardService"));
const dashboardService = __importStar(require("../services/dashboardService"));
async function getDashboardSummary(req, res) {
    const summary = await adminDashboardService.getDashboardSummary();
    return (0, apiResponse_1.sendSuccess)(res, { summary });
}
async function getSalesSummary(req, res) {
    const summary = await adminDashboardService.getSalesSummary();
    return (0, apiResponse_1.sendSuccess)(res, { summary });
}
async function getOrdersByStatus(req, res) {
    const data = await adminDashboardService.getOrdersByStatus();
    return (0, apiResponse_1.sendSuccess)(res, { by_status: data });
}
async function getRecentOrders(req, res) {
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const result = await adminDashboardService.getRecentOrders(limit, offset, status);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function updateOrderStatus(req, res) {
    const orderId = Number(req.params.orderId);
    const status = req.body.status;
    const order = await adminDashboardService.updateOrderStatus(orderId, status);
    return (0, apiResponse_1.sendSuccess)(res, { order }, 200, 'Order status updated');
}
async function getEmailLogs(req, res) {
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
    const template = typeof req.query.template === 'string' ? req.query.template : undefined;
    const result = await adminDashboardService.getEmailLogs(limit, offset, template);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getRecentPayments(req, res) {
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const result = await adminDashboardService.getRecentPayments(limit);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getTopProducts(req, res) {
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const result = await adminDashboardService.getTopProducts(limit);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getLowStockLicenseProducts(req, res) {
    const threshold = req.query.threshold != null ? Number(req.query.threshold) : undefined;
    const result = await adminDashboardService.getLowStockLicenseProducts(threshold);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getPendingFulfillmentCount(req, res) {
    const result = await adminDashboardService.getPendingFulfillmentCount();
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getPendingTicketsCount(req, res) {
    const result = await adminDashboardService.getPendingTicketsCount();
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getOrderDetails(req, res) {
    const orderId = Number(req.params.orderId);
    const order = await dashboardService.getOrderDetailsAdmin(orderId);
    return (0, apiResponse_1.sendSuccess)(res, order);
}
async function getCustomersWithOrders(req, res) {
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
    const result = await adminDashboardService.getCustomersWithOrders(limit, offset);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function updateCustomer(req, res) {
    const userId = Number(req.params.userId);
    const { email, name, mobile, address } = req.body;
    const customer = await adminDashboardService.updateCustomer(userId, { email, name, mobile, address });
    return (0, apiResponse_1.sendSuccess)(res, { customer });
}
async function deleteCustomer(req, res) {
    const userId = Number(req.params.userId);
    await adminDashboardService.deleteCustomer(userId);
    return (0, apiResponse_1.sendSuccess)(res, {}, 200, 'Customer removed');
}
//# sourceMappingURL=adminDashboardController.js.map