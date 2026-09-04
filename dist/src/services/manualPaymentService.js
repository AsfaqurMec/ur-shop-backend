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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitProof = submitProof;
exports.fulfillOrderAfterSuccessfulPayment = fulfillOrderAfterSuccessfulPayment;
exports.approveProof = approveProof;
exports.rejectProof = rejectProof;
exports.getProofById = getProofById;
exports.listPendingProofs = listPendingProofs;
exports.listRecentProofsForAdmin = listRecentProofsForAdmin;
exports.getProofsByOrderId = getProofsByOrderId;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const errorHandler_1 = require("../middlewares/errorHandler");
const upload_1 = require("../middlewares/upload");
const paymentProofRepo = __importStar(require("../repositories/paymentProofRepository"));
const orderRepo = __importStar(require("../repositories/orderRepository"));
const deliveryRepo = __importStar(require("../repositories/deliveryRepository"));
const auditLogRepo = __importStar(require("../repositories/auditLogRepository"));
const authRepo = __importStar(require("../repositories/authRepository"));
const productRepo = __importStar(require("../repositories/productRepository"));
const fulfillmentQueueRepo = __importStar(require("../repositories/fulfillmentQueueRepository"));
const deliveryService = __importStar(require("./deliveryService"));
const emailService = __importStar(require("./emailService"));
const orderItemDisplay_1 = require("../utils/orderItemDisplay");
const paymentOptionService = __importStar(require("./paymentOptionService"));
function toProofPublic(row) {
    return {
        id: row.id,
        order_id: row.order_id,
        sender_number: row.sender_number,
        transaction_id: row.transaction_id,
        paid_amount: row.paid_amount != null ? Number(row.paid_amount) : null,
        file_path: row.file_path,
        status: row.status,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
    };
}
function toProofAdmin(row) {
    const base = toProofPublic(row);
    const orderTotal = Number(row.order_total);
    return {
        ...base,
        user_id: row.user_id,
        user_email: row.user_email,
        order_number: row.order_number,
        order_total: Number.isFinite(orderTotal) ? orderTotal : 0,
        order_currency: row.order_currency || 'USD',
    };
}
async function submitProof(userId, orderId, data, filePath) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order)
        throw new errorHandler_1.AppError(404, 'Order not found');
    if (order.user_id !== userId)
        throw new errorHandler_1.AppError(403, 'Order does not belong to you');
    if (order.status !== 'pending') {
        throw new errorHandler_1.AppError(400, 'Order is not pending payment');
    }
    const payment = await orderRepo.findPaymentByOrderId(orderId);
    if (!payment)
        throw new errorHandler_1.AppError(400, 'No payment record found for this order');
    const isBankProof = await paymentOptionService.isBankProofGateway(payment.gateway);
    if (!isBankProof)
        throw new errorHandler_1.AppError(400, 'This order does not use bank transfer payment with proof upload');
    const id = await paymentProofRepo.create({
        order_id: orderId,
        user_id: userId,
        sender_number: data.sender_number?.trim() || null,
        transaction_id: data.transaction_id?.trim() || null,
        paid_amount: data.paid_amount != null ? data.paid_amount : null,
        file_path: filePath,
    });
    const proof = await paymentProofRepo.findById(id);
    if (!proof)
        throw new errorHandler_1.AppError(500, 'Failed to create payment proof');
    return toProofPublic(proof);
}
/** Mark order paid and run digital fulfillment (after bKash execute or admin proof approval). */
async function fulfillOrderAfterSuccessfulPayment(orderId) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order)
        throw new errorHandler_1.AppError(404, 'Order not found');
    if (order.status === 'paid')
        return;
    if (order.status !== 'pending')
        return;
    const payment = await orderRepo.findPaymentByOrderId(orderId);
    if (!payment)
        throw new errorHandler_1.AppError(404, 'Payment not found');
    await orderRepo.updatePaymentStatus(payment.id, 'completed');
    const transitioned = await orderRepo.tryTransitionOrderToPaid(orderId);
    if (!transitioned) {
        const again = await orderRepo.findOrderById(orderId);
        if (again?.status === 'paid')
            return;
        throw new errorHandler_1.AppError(409, 'Could not finalize order payment. Please contact support with your order number.');
    }
    await deliveryRepo.createOrUpdateToProcessing(orderId);
    await deliveryService.processOrderDelivery(orderId);
    void sendOrderConfirmationEmail(orderId).catch((err) => {
        if (config_1.env.nodeEnv !== 'test')
            console.error('[Mail] Order confirmation failed:', err);
    });
}
async function approveProof(adminId, proofId, ip) {
    const proof = await paymentProofRepo.findById(proofId);
    if (!proof)
        throw new errorHandler_1.AppError(404, 'Payment proof not found');
    if (proof.status !== 'pending')
        throw new errorHandler_1.AppError(400, 'Proof is not pending review');
    const order = await orderRepo.findOrderById(proof.order_id);
    if (!order)
        throw new errorHandler_1.AppError(404, 'Order not found');
    const payment = await orderRepo.findPaymentByOrderId(proof.order_id);
    if (!payment)
        throw new errorHandler_1.AppError(404, 'Payment not found');
    const needsManual = await paymentOptionService.isManualVerificationGateway(payment.gateway);
    if (!needsManual) {
        throw new errorHandler_1.AppError(400, 'This payment is not awaiting manual verification');
    }
    const oldProofStatus = proof.status;
    await paymentProofRepo.updateStatus(proofId, 'verified');
    await fulfillOrderAfterSuccessfulPayment(proof.order_id);
    await auditLogRepo.create({
        admin_id: adminId,
        user_id: null,
        action: 'payment_proof.approved',
        entity_type: 'payment_proof',
        entity_id: String(proofId),
        old_values: { status: oldProofStatus },
        new_values: { status: 'verified', order_id: proof.order_id, order_status: 'paid' },
        ip,
    });
    const updated = await paymentProofRepo.findById(proofId);
    return {
        proof: toProofPublic(updated),
        order_updated: true,
    };
}
/** After payment approval: confirmation email to customer, with downloadable files attached when present. */
async function sendOrderConfirmationEmail(orderId) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order || order.user_id == null)
        return;
    const user = await authRepo.findUserById(order.user_id);
    if (!user)
        return;
    const items = await orderRepo.findOrderItems(orderId);
    const licenseRows = await productRepo.findLicensesByOrderId(orderId);
    const keysByItem = new Map();
    for (const row of licenseRows) {
        const list = keysByItem.get(row.order_item_id) ?? [];
        list.push(row.license_key);
        keysByItem.set(row.order_item_id, list);
    }
    const licenseGroups = items
        .filter((i) => i.product_type === 'license_key')
        .map((i) => {
        const p = (0, orderItemDisplay_1.orderItemEmailParts)(i.product_name, i.purchase_selections_summary);
        return {
            product_name: p.product_name,
            ...(p.detail_lines.length > 0 ? { detail_lines: p.detail_lines } : {}),
            keys: keysByItem.get(i.id) ?? [],
        };
    })
        .filter((g) => g.keys.length > 0);
    const attachments = [];
    const usedNames = new Set();
    const attachedPaths = new Set();
    for (const item of items) {
        if (item.product_type !== 'downloadable')
            continue;
        const files = await productRepo.findProductFilesByProductId(item.product_id);
        for (const f of files) {
            const abs = path_1.default.resolve((0, upload_1.getProductFileAbsolutePath)(f.file_path));
            if (attachedPaths.has(abs))
                continue;
            if (!fs_1.default.existsSync(abs)) {
                if (config_1.env.nodeEnv !== 'test') {
                    console.warn('[Mail] Skipping missing product file for attachment:', abs);
                }
                continue;
            }
            attachedPaths.add(abs);
            let fname = (f.file_name || path_1.default.basename(f.file_path)).replace(/[^\w.\- ()\[\]]+/g, '_');
            let unique = fname;
            let n = 0;
            while (usedNames.has(unique.toLowerCase())) {
                n += 1;
                unique = `${path_1.default.parse(fname).name}-${n}${path_1.default.extname(fname)}`;
            }
            usedNames.add(unique.toLowerCase());
            attachments.push({ filename: unique, path: abs });
        }
    }
    const pendingManual = await fulfillmentQueueRepo.countPendingByOrderId(orderId);
    let fulfillmentNote;
    if (pendingManual > 0) {
        fulfillmentNote =
            'Some items are pending manual activation. You can track pending activation status in your dashboard subscriptions area.';
    }
    const fmt = (n) => Number(n).toFixed(2);
    const dashboardUrl = config_1.env.frontendUrl ? `${config_1.env.frontendUrl}/dashboard/orders/${orderId}` : undefined;
    await emailService.sendPaymentApprovedEmail(user.email, {
        orderNumber: order.order_number,
        customerName: user.name?.trim() || undefined,
        total: fmt(order.total),
        currency: order.currency,
        lines: items.map((i) => {
            const p = (0, orderItemDisplay_1.orderItemEmailParts)(i.product_name, i.purchase_selections_summary);
            return {
                product_name: p.product_name,
                ...(p.detail_lines.length > 0 ? { detail_lines: p.detail_lines } : {}),
                quantity: i.quantity,
                product_type: String(i.product_type),
            };
        }),
        licenseGroups: licenseGroups.length > 0 ? licenseGroups : undefined,
        filesAttached: attachments.length > 0,
        fulfillmentNote,
        dashboardUrl,
    }, attachments.length > 0 ? { attachments } : undefined);
}
async function rejectProof(adminId, proofId, ip) {
    const proof = await paymentProofRepo.findById(proofId);
    if (!proof)
        throw new errorHandler_1.AppError(404, 'Payment proof not found');
    if (proof.status !== 'pending')
        throw new errorHandler_1.AppError(400, 'Proof is not pending review');
    const oldStatus = proof.status;
    await paymentProofRepo.updateStatus(proofId, 'rejected');
    await auditLogRepo.create({
        admin_id: adminId,
        user_id: null,
        action: 'payment_proof.rejected',
        entity_type: 'payment_proof',
        entity_id: String(proofId),
        old_values: { status: oldStatus },
        new_values: { status: 'rejected', order_id: proof.order_id },
        ip,
    });
    const updated = await paymentProofRepo.findById(proofId);
    return toProofPublic(updated);
}
async function getProofById(proofId) {
    const proof = await paymentProofRepo.findById(proofId);
    return proof ? toProofPublic(proof) : null;
}
async function listPendingProofs() {
    const rows = await paymentProofRepo.findAllPending();
    return rows.map(toProofAdmin);
}
async function listRecentProofsForAdmin(limit, offset, status, excludePending) {
    const safeLimit = Math.min(100, Math.max(1, limit));
    const safeOffset = Math.max(0, offset);
    const [total, rows] = await Promise.all([
        paymentProofRepo.countRecentForAdmin({ status, excludePending }),
        paymentProofRepo.findRecentForAdmin({
            limit: safeLimit,
            offset: safeOffset,
            status,
            excludePending,
        }),
    ]);
    return { proofs: rows.map(toProofAdmin), total };
}
async function getProofsByOrderId(orderId, userId) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order)
        return [];
    if (userId != null && order.user_id !== userId)
        return [];
    const rows = await paymentProofRepo.findByOrderId(orderId);
    return rows.map(toProofPublic);
}
//# sourceMappingURL=manualPaymentService.js.map