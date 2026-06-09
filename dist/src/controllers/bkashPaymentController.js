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
exports.executeBkash = executeBkash;
const apiResponse_1 = require("../utils/apiResponse");
const orderRepo = __importStar(require("../repositories/orderRepository"));
const paymentOptionRepo = __importStar(require("../repositories/paymentOptionRepository"));
const bkashService = __importStar(require("../services/bkashService"));
const paymentOptionService_1 = require("../services/paymentOptionService");
const manualPaymentService = __importStar(require("../services/manualPaymentService"));
function mergeGatewayReference(existing, patch) {
    let o = {};
    if (existing?.trim()) {
        try {
            const p = JSON.parse(existing);
            if (p && typeof p === 'object' && !Array.isArray(p))
                o = p;
        }
        catch {
            o = { previous_gateway_reference: existing };
        }
    }
    return JSON.stringify({ ...o, ...patch });
}
/** Finalize bKash Tokenized Checkout after customer returns from bKash (requires auth; order must belong to user). */
async function executeBkash(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const raw = String(req.body.payment_id ?? req.body.paymentID ?? '').trim();
    if (!raw)
        return (0, apiResponse_1.sendError)(res, 'payment_id is required', 400);
    const payment = await orderRepo.findPaymentByBkashPaymentId(raw);
    if (!payment?.bkash_payment_id)
        return (0, apiResponse_1.sendError)(res, 'Payment session not found', 404);
    if (payment.gateway !== 'bkash') {
        return (0, apiResponse_1.sendError)(res, 'This payment session is not a bKash merchant checkout.', 400);
    }
    const order = await orderRepo.findOrderById(payment.order_id);
    if (!order || order.user_id !== req.user.id)
        return (0, apiResponse_1.sendError)(res, 'Forbidden', 403);
    if (order.status === 'cancelled') {
        return (0, apiResponse_1.sendError)(res, 'This order expired or was cancelled because payment was not completed in time.', 410);
    }
    if (order.status === 'paid') {
        const refreshed = await orderRepo.findOrderById(order.id);
        return (0, apiResponse_1.sendSuccess)(res, {
            order_id: order.id,
            order_number: refreshed?.order_number,
            status: refreshed?.status ?? order.status,
            already_completed: true,
        });
    }
    if (order.status !== 'pending') {
        return (0, apiResponse_1.sendError)(res, 'Order is not awaiting payment completion.', 400);
    }
    const successPayload = async () => {
        const refreshed = await orderRepo.findOrderById(order.id);
        return (0, apiResponse_1.sendSuccess)(res, {
            order_id: order.id,
            order_number: refreshed?.order_number,
            status: refreshed?.status ?? 'paid',
        });
    };
    // Local DB marked completed before order (rare crash mid-flight) — finish fulfillment only.
    if (payment.status === 'completed') {
        await manualPaymentService.fulfillOrderAfterSuccessfulPayment(order.id);
        return successPayload();
    }
    let bkashCfg = (0, paymentOptionService_1.mergeBkashCredentials)(null);
    if (payment.payment_option_id != null) {
        const opt = await paymentOptionRepo.findById(payment.payment_option_id);
        bkashCfg = (0, paymentOptionService_1.mergeBkashCredentials)(opt);
    }
    else {
        const opt = await paymentOptionRepo.findByGatewayKey('bkash');
        bkashCfg = (0, paymentOptionService_1.mergeBkashCredentials)(opt);
    }
    bkashService.assertBkashConfigured(bkashCfg);
    const { trxID, amountBdt } = await bkashService.executeCheckoutPayment(bkashCfg, raw);
    if (!bkashService.bkashAmountMatchesOrderTotal(Number(order.total), amountBdt)) {
        return (0, apiResponse_1.sendError)(res, 'Payment amount does not match your order total. Please contact support with your order number.', 400);
    }
    await orderRepo.updatePaymentGatewayReference(payment.id, mergeGatewayReference(payment.gateway_reference, {
        bkash_trx_id: trxID,
        bkash_executed_at: new Date().toISOString(),
    }));
    await manualPaymentService.fulfillOrderAfterSuccessfulPayment(order.id);
    return successPayload();
}
//# sourceMappingURL=bkashPaymentController.js.map