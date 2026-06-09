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
exports.cancelExpiredBkashPendingOrders = cancelExpiredBkashPendingOrders;
exports.startBkashStaleOrderCleanup = startBkashStaleOrderCleanup;
const config_1 = require("../config");
const orderRepo = __importStar(require("../repositories/orderRepository"));
const couponRepo = __importStar(require("../repositories/couponRepository"));
const paymentOptionService_1 = require("./paymentOptionService");
/** Cancel unpaid bKash (redirect) orders older than configured minutes. */
async function cancelExpiredBkashPendingOrders() {
    if (!(await (0, paymentOptionService_1.isBkashMerchantCleanupActive)()))
        return 0;
    const minutes = config_1.env.bkash.pendingExpiryMinutes;
    const olderThan = new Date(Date.now() - minutes * 60_000);
    const orderIds = await orderRepo.findExpiredPendingBkashOrderIds(olderThan);
    let n = 0;
    for (const orderId of orderIds) {
        await cancelBkashPendingOrder(orderId);
        n += 1;
    }
    return n;
}
async function cancelBkashPendingOrder(orderId) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order || order.status !== 'pending')
        return;
    const payment = await orderRepo.findPaymentByOrderId(orderId);
    if (!payment || payment.gateway !== 'bkash' || payment.status !== 'pending')
        return;
    await couponRepo.rollbackCouponsForOrder(orderId);
    await orderRepo.updatePaymentStatus(payment.id, 'failed');
    await orderRepo.updateOrderStatus(orderId, 'cancelled');
}
let interval = null;
function startBkashStaleOrderCleanup() {
    if (interval)
        return;
    const tick = () => {
        cancelExpiredBkashPendingOrders().catch((err) => {
            if (config_1.env.nodeEnv !== 'test')
                console.error('[bKash] Stale order cleanup failed:', err);
        });
    };
    tick();
    interval = setInterval(tick, 60_000);
}
//# sourceMappingURL=bkashStaleOrderService.js.map