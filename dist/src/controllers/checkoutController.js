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
exports.createOrder = createOrder;
const apiResponse_1 = require("../utils/apiResponse");
const checkoutService = __importStar(require("../services/checkoutService"));
async function createOrder(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const userId = req.user.id;
    const couponCode = req.body.coupon_code ?? null;
    const rawMethod = req.body.payment_method;
    const method = typeof rawMethod === 'string' && rawMethod.trim().length > 0 ? rawMethod.trim() : 'manual_bkash';
    const txPrimary = typeof req.body.transaction_id === 'string' ? req.body.transaction_id.trim() : '';
    const txLegacy = typeof req.body.bkash_transaction_id === 'string' ? req.body.bkash_transaction_id.trim() : '';
    const transactionIdRaw = txPrimary || txLegacy || null;
    const senderNumber = typeof req.body.sender_number === 'string' ? req.body.sender_number : null;
    const paymentType = typeof req.body.payment_type === 'string' ? req.body.payment_type : null;
    const order = await checkoutService.createOrder(userId, couponCode, {
        method,
        transactionId: transactionIdRaw,
        senderNumber,
        paymentType,
    });
    return (0, apiResponse_1.sendSuccess)(res, { order }, 201, 'Order created successfully');
}
//# sourceMappingURL=checkoutController.js.map