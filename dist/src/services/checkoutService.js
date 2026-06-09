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
const config_1 = require("../config");
const errorHandler_1 = require("../middlewares/errorHandler");
const cartRepo = __importStar(require("../repositories/cartRepository"));
const productRepo = __importStar(require("../repositories/productRepository"));
const orderRepo = __importStar(require("../repositories/orderRepository"));
const couponRepo = __importStar(require("../repositories/couponRepository"));
const authRepo = __importStar(require("../repositories/authRepository"));
const cartService = __importStar(require("./cartService"));
const variationRepo = __importStar(require("../repositories/productVariationRepository"));
const couponService = __importStar(require("./couponService"));
const emailService = __importStar(require("./emailService"));
const purchaseSelectionService = __importStar(require("./purchaseSelectionService"));
const bkashService = __importStar(require("./bkashService"));
const paymentProofRepo = __importStar(require("../repositories/paymentProofRepository"));
const paymentOptionService = __importStar(require("./paymentOptionService"));
const orderItemDisplay_1 = require("../utils/orderItemDisplay");
const CURRENCY = 'BDT';
async function validateCartItemsForCheckout(userId) {
    let cart = await cartRepo.findCartByUserId(userId);
    if (!cart) {
        await cartService.getCart(userId);
        cart = await cartRepo.findCartByUserId(userId);
        if (!cart)
            throw new errorHandler_1.AppError(400, 'Cart is empty');
    }
    const c = cart;
    const items = await cartRepo.findCartItemsWithProducts(c.id);
    if (items.length === 0)
        throw new errorHandler_1.AppError(400, 'Cart is empty');
    for (const item of items) {
        const product = await productRepo.findProductById(item.product_id);
        if (!product)
            throw new errorHandler_1.AppError(400, `Product "${item.product_name}" is no longer available`);
        if (!product.is_active)
            throw new errorHandler_1.AppError(400, `Product "${item.product_name}" is not available for purchase`);
        await cartService.assertLineQuantityAllowed(item.product_id, item.quantity, item.variation_id);
    }
    return { items, cartId: c.id };
}
async function buildOrderItemsFromCart(items) {
    const out = [];
    for (const item of items) {
        const resolved = await purchaseSelectionService.resolveLinePricing(item.product_id, Number(item.base_price), item.selections, item.variation_id);
        const unitPrice = resolved.unit_price;
        const totalPrice = Math.round(unitPrice * item.quantity * 100) / 100;
        out.push({
            product_id: item.product_id,
            product_variation_id: resolved.effective_variation_id ?? item.variation_id,
            product_name: item.product_name,
            product_type: item.product_type,
            quantity: item.quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            purchase_selections: Object.keys(resolved.normalized_selections).length > 0 ? resolved.normalized_selections : null,
            purchase_selections_summary: resolved.summary.length > 0 ? resolved.summary : null,
        });
    }
    return out;
}
function toOrderPublic(order, orderItems, payment) {
    return {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        tax: Number(order.tax),
        total: Number(order.total),
        currency: order.currency,
        items: orderItems,
        ...(payment && { payment }),
        created_at: order.created_at.toISOString(),
    };
}
/** Undo reserved variation quantity when a pending order is deleted (e.g. bKash session failed). */
async function restoreVariationQuantityForOrder(orderId) {
    const items = await orderRepo.findOrderItems(orderId);
    if (items.length === 0)
        return;
    for (const i of items) {
        if (i.product_variation_id && i.product_type !== 'license_key') {
            await variationRepo.adjustVariationQuantity(null, i.product_variation_id, i.quantity);
        }
    }
}
async function createOrder(userId, couponCode, paymentInput = { method: 'manual_bkash' }) {
    const methodRaw = (paymentInput.method ?? 'manual_bkash').trim();
    const senderNumber = paymentInput.senderNumber?.trim() ?? '';
    const transactionId = paymentInput.transactionId?.trim() ?? '';
    const paymentTypeClient = paymentInput.paymentType?.trim() || null;
    const isCashOnDelivery = methodRaw === 'cash_on_delivery';
    const optionRow = isCashOnDelivery ? null : await paymentOptionService.assertCheckoutGatewayAllowed(methodRaw);
    if (optionRow && paymentOptionService.isMfsReferenceRow(optionRow)) {
        if (!transactionId) {
            throw new errorHandler_1.AppError(400, 'Transaction ID is required for this payment method');
        }
        if (!senderNumber) {
            throw new errorHandler_1.AppError(400, 'Your wallet / sender number is required');
        }
    }
    if (optionRow?.kind === 'merchant' && optionRow.gateway_key === 'bkash') {
        const cfg = paymentOptionService.mergeBkashCredentials(optionRow);
        if (!cfg) {
            throw new errorHandler_1.AppError(503, 'bKash checkout is not enabled or credentials are incomplete.');
        }
        if (!cfg.callbackBaseUrl.trim()) {
            throw new errorHandler_1.AppError(503, 'bKash requires FRONTEND_URL or callback_base_url in payment options / BKASH_CALLBACK_BASE_URL so customers can return after payment.');
        }
    }
    const { items: cartItems } = await validateCartItemsForCheckout(userId);
    const orderItemsInput = await buildOrderItemsFromCart(cartItems);
    const subtotal = orderItemsInput.reduce((sum, i) => sum + i.total_price, 0);
    const subtotalRounded = Math.round(subtotal * 100) / 100;
    let discountAmount = 0;
    let couponId = null;
    if (couponCode?.trim()) {
        const eligibleItems = orderItemsInput.map((i, idx) => ({
            product_id: i.product_id,
            category_id: cartItems[idx]?.category_id ?? null,
            quantity: i.quantity,
            unit_price: i.unit_price,
        }));
        const result = await couponService.validateCoupon(couponCode.trim(), userId, subtotalRounded, eligibleItems);
        if (!result.valid)
            throw new errorHandler_1.AppError(400, result.message || 'Invalid coupon');
        discountAmount = result.discount_amount ?? 0;
        couponId = result.coupon?.id ?? null;
    }
    const discount = Math.round(discountAmount * 100) / 100;
    const tax = 0;
    const total = Math.round((subtotalRounded - discount + tax) * 100) / 100;
    const gateway = isCashOnDelivery ? 'cash_on_delivery' : optionRow.gateway_key;
    let orderId;
    let paymentId;
    orderId = await orderRepo.createOrder(null, {
        user_id: userId,
        status: 'pending',
        subtotal: subtotalRounded,
        discount,
        tax,
        total,
        currency: CURRENCY,
    });
    try {
        await orderRepo.createOrderItems(null, orderId, orderItemsInput);
        for (const line of orderItemsInput) {
            if (line.product_variation_id != null && line.product_type !== 'license_key') {
                await variationRepo.adjustVariationQuantity(null, line.product_variation_id, -line.quantity);
            }
        }
        paymentId = await orderRepo.createPayment(null, {
            order_id: orderId,
            amount: total,
            currency: CURRENCY,
            status: 'pending',
            gateway,
            payment_option_id: optionRow?.id ?? null,
        });
        if (couponId != null) {
            await couponRepo.recordUsageWithConnection(null, couponId, orderId, userId, discountAmount);
            await couponRepo.incrementUsedCountWithConnection(null, couponId);
        }
    }
    catch (err) {
        await couponRepo.rollbackCouponsForOrder(orderId);
        await restoreVariationQuantityForOrder(orderId);
        await orderRepo.deleteOrderById(orderId);
        throw err;
    }
    let bkashCheckoutUrl = null;
    if (optionRow?.kind === 'merchant' && optionRow.gateway_key === 'bkash') {
        const cfg = paymentOptionService.mergeBkashCredentials(optionRow);
        if (!cfg) {
            await couponRepo.rollbackCouponsForOrder(orderId);
            await restoreVariationQuantityForOrder(orderId);
            await orderRepo.deleteOrderById(orderId);
            throw new errorHandler_1.AppError(503, 'bKash is not configured.');
        }
        const orderRow = await orderRepo.findOrderById(orderId);
        if (!orderRow) {
            await couponRepo.rollbackCouponsForOrder(orderId);
            await restoreVariationQuantityForOrder(orderId);
            await orderRepo.deleteOrderById(orderId);
            throw new errorHandler_1.AppError(500, 'Order could not be retrieved');
        }
        const amountBdt = bkashService.formatBdtAmountForCheckout(Number(orderRow.total));
        try {
            const { paymentID, bkashURL } = await bkashService.createCheckoutPayment(cfg, {
                merchantInvoiceNumber: `O${orderId}-${Date.now()}`,
                payerReference: orderRow.order_number.replace(/[<&>]/g, ''),
                amountBdt,
            });
            await orderRepo.updatePaymentBkashSession(paymentId, {
                bkash_payment_id: paymentID,
                gateway_reference: JSON.stringify({
                    bdt_amount: amountBdt,
                    usd_total: Number(orderRow.total),
                    created_via: 'checkout',
                }),
            });
            bkashCheckoutUrl = bkashURL;
        }
        catch (err) {
            await couponRepo.rollbackCouponsForOrder(orderId);
            await restoreVariationQuantityForOrder(orderId);
            await orderRepo.deleteOrderById(orderId);
            throw err;
        }
    }
    if (optionRow && paymentOptionService.isMfsReferenceRow(optionRow)) {
        const gatewayRef = JSON.stringify({
            payment_type: paymentTypeClient || 'manual',
            payment_method: gateway,
            sender_number: senderNumber,
        });
        await orderRepo.updatePaymentGatewayReference(paymentId, gatewayRef);
        await paymentProofRepo.create({
            order_id: orderId,
            user_id: userId,
            sender_number: senderNumber,
            transaction_id: transactionId,
            paid_amount: null,
            file_path: null,
        });
    }
    await cartService.clearCart(userId);
    const order = await orderRepo.findOrderById(orderId);
    if (!order)
        throw new errorHandler_1.AppError(500, 'Order could not be retrieved');
    const [items, payment] = await Promise.all([
        orderRepo.findOrderItems(order.id),
        orderRepo.findPaymentByOrderId(order.id),
    ]);
    const itemsPublic = items.map((i) => ({
        id: i.id,
        product_id: i.product_id,
        product_name: i.product_name,
        product_type: i.product_type,
        quantity: i.quantity,
        unit_price: Number(i.unit_price),
        total_price: Number(i.total_price),
        purchase_selections: i.purchase_selections,
        purchase_selections_summary: i.purchase_selections_summary,
    }));
    const paymentPublic = payment
        ? { id: payment.id, gateway: payment.gateway, status: payment.status, amount: Number(payment.amount) }
        : null;
    const orderPublic = {
        ...toOrderPublic(order, itemsPublic, paymentPublic),
        ...(bkashCheckoutUrl ? { bkash_checkout_url: bkashCheckoutUrl } : {}),
    };
    notifyAfterOrderPlaced(userId, orderPublic).catch((err) => {
        if (config_1.env.nodeEnv !== 'test')
            console.error('[Mail] Order placed notifications failed:', err);
    });
    return orderPublic;
}
async function notifyAfterOrderPlaced(userId, order) {
    const user = await authRepo.findUserById(userId);
    if (!user) {
        if (config_1.env.nodeEnv !== 'test')
            console.warn('[Mail] Order placed: user not found, skipping emails userId=', userId);
        return;
    }
    const gw = order.payment?.gateway ?? '';
    const isBank = await paymentOptionService.isBankProofGateway(gw);
    const isMfs = await paymentOptionService.isMfsReferenceGateway(gw);
    const isBkashMerchant = gw === 'bkash';
    const fmt = (n) => n.toFixed(2);
    const lineRows = order.items.map((i) => {
        const p = (0, orderItemDisplay_1.orderItemEmailParts)(i.product_name, i.purchase_selections_summary);
        return {
            product_name: p.product_name,
            ...(p.detail_lines.length > 0 ? { detail_lines: p.detail_lines } : {}),
            quantity: i.quantity,
            product_type: i.product_type,
            line_total: fmt(i.total_price),
        };
    });
    const userLines = order.items.map((i) => {
        const p = (0, orderItemDisplay_1.orderItemEmailParts)(i.product_name, i.purchase_selections_summary);
        return {
            product_name: p.product_name,
            ...(p.detail_lines.length > 0 ? { detail_lines: p.detail_lines } : {}),
            quantity: i.quantity,
            line_total: fmt(i.total_price),
        };
    });
    const dashboardUrl = config_1.env.frontendUrl ? `${config_1.env.frontendUrl}/dashboard/orders/${order.id}` : undefined;
    const paymentInstructions = isBank
        ? 'Complete payment using the method shown on your order page, then upload your payment proof from your dashboard so we can verify and fulfill your order.'
        : isMfs
            ? 'You submitted a mobile banking payment reference. We will verify it and complete your order — watch your email and dashboard for updates.'
            : isBkashMerchant
                ? 'Complete payment on bKash when redirected. If you do not pay within the time limit, the order will be cancelled automatically.'
                : undefined;
    const customerResult = await emailService.sendOrderPlacedEmail(user.email, {
        orderNumber: order.order_number,
        customerName: user.name?.trim() || undefined,
        total: fmt(order.total),
        currency: order.currency,
        subtotal: fmt(order.subtotal),
        discount: fmt(order.discount),
        lines: userLines,
        paymentInstructions,
        dashboardUrl,
    });
    if (!customerResult.sent && config_1.env.nodeEnv !== 'test') {
        console.error('[Mail] Order placed email to customer failed:', user.email, customerResult.error ?? 'unknown');
    }
    const adminRecipients = config_1.env.mail.adminNotificationEmails;
    if (adminRecipients.length === 0) {
        if (config_1.env.nodeEnv === 'development') {
            console.warn('[Mail] No admin order alerts: set ADMIN_NOTIFICATION_EMAIL (or ADMIN_EMAIL) in backend .env');
        }
        return;
    }
    const adminOrdersUrl = config_1.env.frontendUrl ? `${config_1.env.frontendUrl}/admin/orders/${order.id}` : undefined;
    const adminPayload = {
        orderNumber: order.order_number,
        customerEmail: user.email,
        customerName: user.name?.trim() || user.email,
        total: fmt(order.total),
        currency: order.currency,
        subtotal: fmt(order.subtotal),
        discount: fmt(order.discount),
        lines: lineRows,
        adminOrdersUrl,
    };
    const adminResults = await Promise.all(adminRecipients.map((to) => emailService.sendAdminNewOrderEmail(to, adminPayload)));
    adminResults.forEach((r, i) => {
        if (!r.sent && config_1.env.nodeEnv !== 'test') {
            console.error('[Mail] Admin new-order email failed:', adminRecipients[i], r.error ?? 'unknown');
        }
    });
}
//# sourceMappingURL=checkoutService.js.map