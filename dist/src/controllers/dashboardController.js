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
exports.getMyOrders = getMyOrders;
exports.getOrderDetails = getOrderDetails;
exports.downloadOrderInvoice = downloadOrderInvoice;
exports.getMyDownloads = getMyDownloads;
exports.getMyLicenses = getMyLicenses;
exports.getMySubscriptions = getMySubscriptions;
exports.getMyPendingSubscriptions = getMyPendingSubscriptions;
exports.getMyDeliveredItems = getMyDeliveredItems;
exports.getDashboardSummary = getDashboardSummary;
const apiResponse_1 = require("../utils/apiResponse");
const dashboardService = __importStar(require("../services/dashboardService"));
const invoiceService = __importStar(require("../services/invoiceService"));
async function getMyOrders(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
    const result = await dashboardService.getMyOrders(req.user.id, { limit, offset });
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getOrderDetails(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const orderId = Number(req.params.orderId);
    const order = await dashboardService.getOrderDetails(req.user.id, orderId);
    return (0, apiResponse_1.sendSuccess)(res, order);
}
async function downloadOrderInvoice(req, res) {
    if (!req.user) {
        (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
        return;
    }
    const orderId = Number(req.params.orderId);
    const invoice = await invoiceService.createInvoicePdf(req.user.id, orderId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(200).send(invoice.buffer);
}
async function getMyDownloads(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const result = await dashboardService.getMyDownloads(req.user.id);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getMyLicenses(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const result = await dashboardService.getMyLicenses(req.user.id);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getMySubscriptions(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const result = await dashboardService.getMySubscriptions(req.user.id);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getMyPendingSubscriptions(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const result = await dashboardService.getMyPendingSubscriptions(req.user.id);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getMyDeliveredItems(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const result = await dashboardService.getMyDeliveredItems(req.user.id);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getDashboardSummary(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const summary = await dashboardService.getDashboardSummary(req.user.id);
    return (0, apiResponse_1.sendSuccess)(res, { summary });
}
//# sourceMappingURL=dashboardController.js.map