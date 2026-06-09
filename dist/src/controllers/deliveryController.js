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
exports.processDelivery = processDelivery;
exports.getDeliveryLogs = getDeliveryLogs;
exports.listFulfillmentQueue = listFulfillmentQueue;
exports.markFulfillmentFulfilled = markFulfillmentFulfilled;
exports.markFulfillmentFailed = markFulfillmentFailed;
const apiResponse_1 = require("../utils/apiResponse");
const deliveryService = __importStar(require("../services/deliveryService"));
const orderRepo = __importStar(require("../repositories/orderRepository"));
async function processDelivery(req, res) {
    const orderId = Number(req.params.orderId);
    const result = await deliveryService.processOrderDelivery(orderId);
    return (0, apiResponse_1.sendSuccess)(res, result, 200, 'Delivery processed');
}
/** GET delivery logs for an order. Allowed for admin or order owner. */
async function getDeliveryLogs(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const orderId = Number(req.params.orderId);
    const order = await orderRepo.findOrderById(orderId);
    if (!order)
        return (0, apiResponse_1.sendError)(res, 'Order not found', 404);
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && order.user_id !== req.user.id) {
        return (0, apiResponse_1.sendError)(res, 'Forbidden', 403);
    }
    const logs = await deliveryService.getDeliveryLogs(orderId);
    return (0, apiResponse_1.sendSuccess)(res, { logs });
}
async function listFulfillmentQueue(req, res) {
    const items = await deliveryService.listFulfillmentQueue();
    return (0, apiResponse_1.sendSuccess)(res, { items });
}
async function markFulfillmentFulfilled(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const id = Number(req.params.id);
    const notes = req.body.notes ?? null;
    const item = await deliveryService.markFulfillmentFulfilled(id, req.user.id, notes);
    return (0, apiResponse_1.sendSuccess)(res, { item }, 200, 'Marked as fulfilled');
}
async function markFulfillmentFailed(req, res) {
    const id = Number(req.params.id);
    const notes = req.body.notes ?? null;
    const item = await deliveryService.markFulfillmentFailed(id, notes);
    return (0, apiResponse_1.sendSuccess)(res, { item }, 200, 'Marked as failed');
}
//# sourceMappingURL=deliveryController.js.map