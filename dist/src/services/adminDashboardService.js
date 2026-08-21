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
exports.updateOrderPaymentStatus = updateOrderPaymentStatus;
exports.getPaidRevenueHistory = getPaidRevenueHistory;
exports.getEmailLogs = getEmailLogs;
exports.getRecentPayments = getRecentPayments;
exports.getTopProducts = getTopProducts;
exports.getLowStockLicenseProducts = getLowStockLicenseProducts;
exports.getPendingFulfillmentCount = getPendingFulfillmentCount;
exports.getPendingTicketsCount = getPendingTicketsCount;
exports.getCustomersWithOrders = getCustomersWithOrders;
exports.getCustomerDetails = getCustomerDetails;
exports.updateCustomer = updateCustomer;
exports.deleteCustomer = deleteCustomer;
exports.deleteOrder = deleteOrder;
const errorHandler_1 = require("../middlewares/errorHandler");
const adminDashboardRepo = __importStar(require("../repositories/adminDashboardRepository"));
const authRepo = __importStar(require("../repositories/authRepository"));
const emailLogRepo = __importStar(require("../repositories/emailLogRepository"));
const DEFAULT_RECENT_LIMIT = 10;
const DEFAULT_EMAIL_LOG_LIMIT = 10;
const DEFAULT_TOP_PRODUCTS_LIMIT = 10;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;
async function getDashboardSummary() {
    return adminDashboardRepo.getDashboardSummary();
}
async function getSalesSummary() {
    return adminDashboardRepo.getSalesSummary();
}
async function getOrdersByStatus() {
    return adminDashboardRepo.getOrdersByStatus();
}
async function getRecentOrders(limit, offset, status) {
    return adminDashboardRepo.getRecentOrders(limit ?? DEFAULT_RECENT_LIMIT, offset ?? 0, status);
}
async function updateOrderStatus(orderId, status) {
    const ok = await adminDashboardRepo.updateOrderStatus(orderId, status);
    if (!ok)
        throw new errorHandler_1.AppError(404, 'Order not found');
    const detail = await adminDashboardRepo.getOrderListItemById(orderId);
    if (detail)
        return detail;
    throw new errorHandler_1.AppError(404, 'Order not found');
}
async function updateOrderPaymentStatus(orderId, paymentStatus) {
    const ok = await adminDashboardRepo.updateOrderPaymentStatus(orderId, paymentStatus);
    if (!ok)
        throw new errorHandler_1.AppError(404, 'Order not found');
    const detail = await adminDashboardRepo.getOrderListItemById(orderId);
    if (!detail)
        throw new errorHandler_1.AppError(404, 'Order not found');
    return detail;
}
async function getPaidRevenueHistory() {
    return adminDashboardRepo.getPaidRevenueHistory();
}
async function getEmailLogs(limit, offset, template) {
    const lim = limit ?? DEFAULT_EMAIL_LOG_LIMIT;
    const off = offset ?? 0;
    const templateFilter = template && template.length > 0 ? template : undefined;
    const [logs, total, templates] = await Promise.all([
        emailLogRepo.listPaginated(lim, off, templateFilter),
        emailLogRepo.countLogs(templateFilter),
        emailLogRepo.listDistinctTemplates(),
    ]);
    return { logs, total, templates };
}
async function getRecentPayments(limit) {
    const payments = await adminDashboardRepo.getRecentPayments(limit ?? DEFAULT_RECENT_LIMIT);
    return { payments };
}
async function getTopProducts(limit) {
    const products = await adminDashboardRepo.getTopProducts(limit ?? DEFAULT_TOP_PRODUCTS_LIMIT);
    return { products };
}
async function getLowStockLicenseProducts(threshold) {
    const products = await adminDashboardRepo.getLowStockLicenseProducts(threshold ?? DEFAULT_LOW_STOCK_THRESHOLD);
    return { products };
}
async function getPendingFulfillmentCount() {
    const count = await adminDashboardRepo.getPendingFulfillmentCount();
    return { count };
}
async function getPendingTicketsCount() {
    const count = await adminDashboardRepo.getPendingTicketsCount();
    return { count };
}
async function getCustomersWithOrders(limit, offset) {
    return adminDashboardRepo.getCustomersWithOrders(limit ?? DEFAULT_RECENT_LIMIT, offset ?? 0);
}
async function getCustomerDetails(userId) {
    const data = await adminDashboardRepo.getCustomerDetailsAndOrders(userId);
    if (!data)
        throw new errorHandler_1.AppError(404, 'Customer not found');
    return data;
}
async function updateCustomer(userId, data) {
    const user = await authRepo.findUserById(userId);
    if (!user)
        throw new errorHandler_1.AppError(404, 'Customer not found');
    const hasOrders = await adminDashboardRepo.userHasOrders(userId);
    if (!hasOrders)
        throw new errorHandler_1.AppError(404, 'Customer not found');
    if (await authRepo.emailExistsExcludingUser(data.email, userId)) {
        throw new errorHandler_1.AppError(409, 'Email already in use');
    }
    await authRepo.updateUserProfile(userId, {
        email: data.email,
        name: data.name,
        mobile: data.mobile,
        address: data.address,
    });
    const row = await adminDashboardRepo.getCustomerAggregateById(userId);
    if (!row)
        throw new errorHandler_1.AppError(500, 'Failed to load customer');
    return row;
}
async function deleteCustomer(userId) {
    const user = await authRepo.findUserById(userId);
    if (!user)
        throw new errorHandler_1.AppError(404, 'Customer not found');
    const ok = await authRepo.softDeleteUser(userId);
    if (!ok)
        throw new errorHandler_1.AppError(404, 'Customer not found');
    await authRepo.deleteSessionsByUserId(userId);
}
async function deleteOrder(id) {
    const existed = await adminDashboardRepo.softDelete(id);
    if (!existed)
        throw new errorHandler_1.AppError(404, 'Order not found');
}
//# sourceMappingURL=adminDashboardService.js.map