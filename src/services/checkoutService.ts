import crypto from 'crypto';
import { env } from '../config';
import { AppError } from '../middlewares/errorHandler';
import * as cartRepo from '../repositories/cartRepository';
import * as productRepo from '../repositories/productRepository';
import * as orderRepo from '../repositories/orderRepository';
import * as couponRepo from '../repositories/couponRepository';
import * as authRepo from '../repositories/authRepository';
import * as cartService from './cartService';
import * as variationRepo from '../repositories/productVariationRepository';
import * as couponService from './couponService';
import * as emailService from './emailService';
import * as purchaseSelectionService from './purchaseSelectionService';
import * as bkashService from './bkashService';
import * as paymentProofRepo from '../repositories/paymentProofRepository';
import * as paymentOptionService from './paymentOptionService';
import * as storeSettingsService from './storeSettingsService';
import type { OrderPublic, OrderItemPublic, OrderItemProductType } from '../types/order';
import type { CartItemWithProduct } from '../repositories/cartRepository';
import { orderItemEmailParts } from '../utils/orderItemDisplay';
import { normalizeBdMobile } from '../utils/bengali';

const CURRENCY = 'BDT';

export interface CreateOrderPaymentDetails {
  /** Must match an enabled payment_options.gateway_key */
  method: string;
  /** Customer wallet / sender number (required for manual MFS). */
  senderNumber?: string | null;
  /** Transaction ID from SMS or app (required for manual MFS). */
  transactionId?: string | null;
  /** Client hint: e.g. `manual` vs `merchant` (stored on payment for admin reference). */
  paymentType?: string | null;
  /** Customer contact for delivery. */
  name?: string | null;
  shippingName?: string | null;
  mobile?: string;
  address?: string;
  postalCode?: string | null;
  addressLine2?: string | null;
  shippingMethodId?: string | null;
  /** Guest cart lines passed directly when checking out without an account. */
  items?: Array<{
    product_id: number;
    product_variation_id?: number | null;
    quantity: number;
    selections?: Record<string, string>;
  }>;
}

async function validateCartItemsForCheckout(
  userId: number
): Promise<{ items: CartItemWithProduct[]; cartId: number }> {
  let cart = await cartRepo.findCartByUserId(userId);
  if (!cart) {
    await cartService.getCart(userId);
    cart = await cartRepo.findCartByUserId(userId);
    if (!cart) throw new AppError(400, 'Cart is empty');
  }
  const c = cart;
  const items = await cartRepo.findCartItemsWithProducts(c.id);
  if (items.length === 0) throw new AppError(400, 'Cart is empty');
  for (const item of items) {
    const product = await productRepo.findProductById(item.product_id);
    if (!product) throw new AppError(400, `Product "${item.product_name}" is no longer available`);
    if (!product.is_active) throw new AppError(400, `Product "${item.product_name}" is not available for purchase`);
    await cartService.assertLineQuantityAllowed(item.product_id, item.quantity, item.variation_id);
  }
  return { items, cartId: c.id };
}

async function buildOrderItemsFromCart(items: CartItemWithProduct[]): Promise<orderRepo.OrderItemInput[]> {
  const out: orderRepo.OrderItemInput[] = [];
  for (const item of items) {
    const resolved = await purchaseSelectionService.resolveLinePricing(
      item.product_id,
      Number(item.base_price),
      item.selections,
      item.variation_id
    );
    const unitPrice = resolved.unit_price;
    const totalPrice = Math.round(unitPrice * item.quantity * 100) / 100;

    let itemSku: string | null = null;
    const effectiveVarId = resolved.effective_variation_id ?? item.variation_id;
    if (effectiveVarId != null) {
      const v = await variationRepo.findVariationById(effectiveVarId);
      if (v?.sku) itemSku = v.sku;
    }
    if (!itemSku) {
      const p = await productRepo.findProductById(item.product_id);
      if (p?.sku) itemSku = p.sku;
    }

    out.push({
      product_id: item.product_id,
      product_variation_id: effectiveVarId,
      sku: itemSku,
      product_name: item.product_name,
      product_type: item.product_type as OrderItemProductType,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      purchase_selections:
        Object.keys(resolved.normalized_selections).length > 0 ? resolved.normalized_selections : null,
      purchase_selections_summary: resolved.summary.length > 0 ? resolved.summary : null,
    });
  }
  return out;
}

async function buildOrderItemsFromGuestInput(
  items: Array<{
    product_id: number;
    product_variation_id?: number | null;
    quantity: number;
    selections?: Record<string, string>;
  }>
): Promise<{ orderItems: orderRepo.OrderItemInput[]; cartItemsSummary: Array<{ category_id: number | null }> }> {
  if (!items || items.length === 0) {
    throw new AppError(400, 'Cart is empty');
  }
  const out: orderRepo.OrderItemInput[] = [];
  const summary: Array<{ category_id: number | null }> = [];
  for (const item of items) {
    if (!item.quantity || item.quantity < 1) {
      throw new AppError(400, 'Invalid item quantity');
    }
    const product = await productRepo.findProductById(item.product_id);
    if (!product || !product.is_active) {
      throw new AppError(400, `Product "${product?.name || item.product_id}" is no longer available`);
    }
    await cartService.assertLineQuantityAllowed(item.product_id, item.quantity, item.product_variation_id ?? null);

    let basePrice = Number(product.price);
    if (item.product_variation_id != null) {
      const v = await variationRepo.findVariationById(item.product_variation_id);
      if (v?.price != null) basePrice = Number(v.price);
    }
    const resolved = await purchaseSelectionService.resolveLinePricing(
      item.product_id,
      basePrice,
      item.selections,
      item.product_variation_id ?? null
    );
    const unitPrice = resolved.unit_price;
    const totalPrice = Math.round(unitPrice * item.quantity * 100) / 100;
    let itemSku: string | null = null;
    const effectiveVarId = resolved.effective_variation_id ?? item.product_variation_id;
    if (effectiveVarId != null) {
      const v = await variationRepo.findVariationById(effectiveVarId);
      if (v?.sku) itemSku = v.sku;
    }
    if (!itemSku && product.sku) itemSku = product.sku;

    out.push({
      product_id: item.product_id,
      product_variation_id: effectiveVarId ?? null,
      sku: itemSku,
      product_name: product.name,
      product_type: product.product_type as OrderItemProductType,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      purchase_selections:
        resolved.normalized_selections && Object.keys(resolved.normalized_selections).length > 0
          ? resolved.normalized_selections
          : null,
      purchase_selections_summary: resolved.summary && resolved.summary.length > 0 ? resolved.summary : null,
    });
    summary.push({ category_id: product.category_id ?? null });
  }
  return { orderItems: out, cartItemsSummary: summary };
}

function toOrderPublic(
  order: { id: number; order_number: string; status: string; subtotal: number; discount: number; coupon_code?: string | null; coupon_name?: string | null; tax: number; total: number; currency: string; shipping_name?: string | null; guest_token?: string | null; created_at: Date },
  orderItems: OrderItemPublic[],
  payment: { id: number; gateway: string; status: string; amount: number } | null
): OrderPublic {
  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status as OrderPublic['status'],
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    coupon_code: order.coupon_code || order.coupon_name || null,
    coupon_name: order.coupon_name || order.coupon_code || null,
    tax: Number(order.tax),
    total: Number(order.total),
    currency: order.currency,
    shipping_name: order.shipping_name || null,
    items: orderItems,
    ...(payment && { payment }),
    created_at: order.created_at.toISOString(),
    ...(order.guest_token ? { guest_token: order.guest_token } : {}),
  };
}

/** Undo reserved variation / product quantity when a pending order is deleted (e.g. bKash session failed). */
async function restoreVariationQuantityForOrder(orderId: number): Promise<void> {
  const items = await orderRepo.findOrderItems(orderId);
  if (items.length === 0) return;
  for (const i of items) {
    if (i.product_variation_id && i.product_type !== 'license_key') {
      await variationRepo.adjustVariationQuantity(null, i.product_variation_id, i.quantity);
    } else if (!i.product_variation_id && i.product_type !== 'license_key') {
      await productRepo.adjustProductQuantity(i.product_id, i.quantity);
    }
  }
}

export async function createOrder(
  userId: number | null,
  couponCode?: string | null,
  paymentInput: CreateOrderPaymentDetails = { method: 'manual_bkash' }
): Promise<OrderPublic> {
  const methodRaw = (paymentInput.method ?? 'manual_bkash').trim();
  const senderNumber = paymentInput.senderNumber?.trim() ?? '';
  const transactionId = paymentInput.transactionId?.trim() ?? '';
  const paymentTypeClient = paymentInput.paymentType?.trim() || null;
  const rawMobile = paymentInput.mobile?.trim() ?? '';
  const shippingMobile = normalizeBdMobile(rawMobile) || rawMobile;
  const shippingAddress = paymentInput.address?.trim() ?? '';
  const shippingPostalCode = paymentInput.postalCode?.trim() || null;
  const shippingAddressLine2 = paymentInput.addressLine2?.trim() || null;
  const shippingMethodIdRaw = paymentInput.shippingMethodId?.trim() ?? '';
  const isCashOnDelivery = methodRaw === 'cash_on_delivery';

  if (!shippingMobile) throw new AppError(400, 'Mobile number is required');
  if (!shippingAddress) throw new AppError(400, 'Address is required');

  const user = userId != null ? await authRepo.findUserById(userId) : null;
  const rawName = paymentInput.name?.trim() || paymentInput.shippingName?.trim() || '';
  const shippingName = rawName || user?.name?.trim() || null;

  const storeSettings = await storeSettingsService.getStoreSettings();
  const configuredShippingMethods = storeSettings.shippingMethods;
  let shippingFee = 0;
  let shippingMethodId: string | null = null;
  let shippingMethodTitle: string | null = null;

  if (configuredShippingMethods.length > 0) {
    if (!shippingMethodIdRaw) throw new AppError(400, 'Shipping method is required');
    const selectedMethod = storeSettingsService.findShippingMethodById(
      configuredShippingMethods,
      shippingMethodIdRaw
    );
    if (!selectedMethod) throw new AppError(400, 'Invalid shipping method');
    shippingFee = selectedMethod.extraPrice;
    shippingMethodId = selectedMethod.id;
    shippingMethodTitle = selectedMethod.title;
  }

  const optionRow = isCashOnDelivery ? null : await paymentOptionService.assertCheckoutGatewayAllowed(methodRaw);

  if (optionRow && paymentOptionService.isMfsReferenceRow(optionRow)) {
    if (!transactionId) {
      throw new AppError(400, 'Transaction ID is required for this payment method');
    }
    if (!senderNumber) {
      throw new AppError(400, 'Your wallet / sender number is required');
    }
  }

  if (optionRow?.kind === 'merchant' && optionRow.gateway_key === 'bkash') {
    const cfg = paymentOptionService.mergeBkashCredentials(optionRow);
    if (!cfg) {
      throw new AppError(503, 'bKash checkout is not enabled or credentials are incomplete.');
    }
    if (!cfg.callbackBaseUrl.trim()) {
      throw new AppError(
        503,
        'bKash requires FRONTEND_URL or callback_base_url in payment options / BKASH_CALLBACK_BASE_URL so customers can return after payment.'
      );
    }
  }

  let orderItemsInput: orderRepo.OrderItemInput[];
  let cartCategories: Array<{ category_id: number | null }>;

  if (userId != null) {
    const { items: cartItems } = await validateCartItemsForCheckout(userId);
    orderItemsInput = await buildOrderItemsFromCart(cartItems);
    cartCategories = cartItems.map((c) => ({ category_id: c.category_id ?? null }));
  } else {
    const guestResult = await buildOrderItemsFromGuestInput(paymentInput.items || []);
    orderItemsInput = guestResult.orderItems;
    cartCategories = guestResult.cartItemsSummary;
  }

  const subtotal = orderItemsInput.reduce((sum, i) => sum + i.total_price, 0);
  const subtotalRounded = Math.round(subtotal * 100) / 100;

  let discountAmount = 0;
  let couponId: number | null = null;
  let couponCodeName: string | null = null;
  if (couponCode?.trim()) {
    const eligibleItems = orderItemsInput.map((i, idx) => ({
      product_id: i.product_id,
      category_id: cartCategories[idx]?.category_id ?? null,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));
    const result = await couponService.validateCoupon(
      couponCode.trim(),
      userId,
      subtotalRounded,
      eligibleItems
    );
    if (!result.valid) throw new AppError(400, result.message || 'Invalid coupon');
    discountAmount = result.discount_amount ?? 0;
    couponId = result.coupon?.id ?? null;
    couponCodeName = result.coupon?.code || couponCode.trim();
  }

  const discount = Math.round(discountAmount * 100) / 100;
  const tax = 0;
  const shippingFeeRounded = Math.round(shippingFee * 100) / 100;
  const total = Math.round((subtotalRounded - discount + tax + shippingFeeRounded) * 100) / 100;

  const gateway = isCashOnDelivery ? 'cash_on_delivery' : optionRow!.gateway_key;

  const guestToken = userId == null ? crypto.randomBytes(32).toString('hex') : null;

  let orderId: number;
  let paymentId: number;
  orderId = await orderRepo.createOrder(null, {
    user_id: userId,
    guest_token: guestToken,
    status: 'pending',
    payment_status: 'unpaid',
    subtotal: subtotalRounded,
    discount,
    coupon_code: couponCodeName,
    coupon_name: couponCodeName,
    tax,
    total,
    currency: CURRENCY,
    shipping_name: shippingName,
    shipping_mobile: shippingMobile,
    shipping_address: shippingAddress,
    shipping_postal_code: shippingPostalCode,
    shipping_address_line2: shippingAddressLine2,
    shipping_method_id: shippingMethodId,
    shipping_method_title: shippingMethodTitle,
    shipping_fee: shippingFeeRounded,
  });
  try {
    await orderRepo.createOrderItems(null, orderId, orderItemsInput);
    for (const line of orderItemsInput) {
      if (line.product_variation_id != null && line.product_type !== 'license_key') {
        await variationRepo.adjustVariationQuantity(null, line.product_variation_id, -line.quantity);
      } else if (line.product_variation_id == null && line.product_type !== 'license_key') {
        await productRepo.adjustProductQuantity(line.product_id, -line.quantity);
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
  } catch (err) {
    await couponRepo.rollbackCouponsForOrder(orderId);
    await restoreVariationQuantityForOrder(orderId);
    await orderRepo.deleteOrderById(orderId);
    throw err;
  }

  let bkashCheckoutUrl: string | null = null;

  if (optionRow?.kind === 'merchant' && optionRow.gateway_key === 'bkash') {
    const cfg = paymentOptionService.mergeBkashCredentials(optionRow);
    if (!cfg) {
      await couponRepo.rollbackCouponsForOrder(orderId);
      await restoreVariationQuantityForOrder(orderId);
      await orderRepo.deleteOrderById(orderId);
      throw new AppError(503, 'bKash is not configured.');
    }
    const orderRow = await orderRepo.findOrderById(orderId);
    if (!orderRow) {
      await couponRepo.rollbackCouponsForOrder(orderId);
      await restoreVariationQuantityForOrder(orderId);
      await orderRepo.deleteOrderById(orderId);
      throw new AppError(500, 'Order could not be retrieved');
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
    } catch (err) {
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

  if (userId != null) {
    await cartService.clearCart(userId);
  }

  const order = await orderRepo.findOrderById(orderId);
  if (!order) throw new AppError(500, 'Order could not be retrieved');
  const [items, payment] = await Promise.all([
    orderRepo.findOrderItems(order.id),
    orderRepo.findPaymentByOrderId(order.id),
  ]);
  const itemsPublic: OrderItemPublic[] = items.map((i) => ({
    id: i.id,
    product_id: i.product_id,
    product_name: i.product_name,
    product_type: i.product_type as OrderItemProductType,
    quantity: i.quantity,
    unit_price: Number(i.unit_price),
    total_price: Number(i.total_price),
    purchase_selections: i.purchase_selections,
    purchase_selections_summary: i.purchase_selections_summary,
  }));
  const paymentPublic = payment
    ? { id: payment.id, gateway: payment.gateway, status: payment.status, amount: Number(payment.amount) }
    : null;
  const orderPublic: OrderPublic = {
    ...toOrderPublic(order, itemsPublic, paymentPublic),
    ...(bkashCheckoutUrl ? { bkash_checkout_url: bkashCheckoutUrl } : {}),
  };

  notifyAfterOrderPlaced(userId, orderPublic).catch((err) => {
    if (env.nodeEnv !== 'test') console.error('[Mail] Order placed notifications failed:', err);
  });

  return orderPublic;
}

async function notifyAfterOrderPlaced(userId: number | null, order: OrderPublic): Promise<void> {
  const user = userId != null ? await authRepo.findUserById(userId) : null;

  const gw = order.payment?.gateway ?? '';
  const isBank = await paymentOptionService.isBankProofGateway(gw);
  const isMfs = await paymentOptionService.isMfsReferenceGateway(gw);
  const isBkashMerchant = gw === 'bkash';

  const fmt = (n: number) => n.toFixed(2);
  const lineRows = order.items.map((i) => {
    const p = orderItemEmailParts(i.product_name, i.purchase_selections_summary);
    return {
      product_name: p.product_name,
      ...(p.detail_lines.length > 0 ? { detail_lines: p.detail_lines } : {}),
      quantity: i.quantity,
      product_type: i.product_type,
      line_total: fmt(i.total_price),
    };
  });
  const userLines = order.items.map((i) => {
    const p = orderItemEmailParts(i.product_name, i.purchase_selections_summary);
    return {
      product_name: p.product_name,
      ...(p.detail_lines.length > 0 ? { detail_lines: p.detail_lines } : {}),
      quantity: i.quantity,
      line_total: fmt(i.total_price),
    };
  });

  const dashboardUrl = env.frontendUrl ? `${env.frontendUrl}/dashboard/orders/${order.id}` : undefined;
  const paymentInstructions = isBank
    ? 'Complete payment using the method shown on your order page, then upload your payment proof from your dashboard so we can verify and fulfill your order.'
    : isMfs
      ? 'You submitted a mobile banking payment reference. We will verify it and complete your order — watch your email and dashboard for updates.'
      : isBkashMerchant
        ? 'Complete payment on bKash when redirected. If you do not pay within the time limit, the order will be cancelled automatically.'
        : undefined;

  const resolvedCustomerName = order.shipping_name || user?.name?.trim() || undefined;

  if (user?.email) {
    const customerResult = await emailService.sendOrderPlacedEmail(user.email, {
      orderNumber: order.order_number,
      customerName: resolvedCustomerName,
      total: fmt(order.total),
      currency: order.currency,
      subtotal: fmt(order.subtotal),
      discount: fmt(order.discount),
      lines: userLines,
      paymentInstructions,
      dashboardUrl,
    });
    if (!customerResult.sent && env.nodeEnv !== 'test') {
      console.error('[Mail] Order placed email to customer failed:', user.email, customerResult.error ?? 'unknown');
    }
  }

  const adminRecipients = env.mail.adminNotificationEmails;
  if (adminRecipients.length === 0) {
    if (env.nodeEnv === 'development') {
      console.warn('[Mail] No admin order alerts: set ADMIN_NOTIFICATION_EMAIL (or ADMIN_EMAIL) in backend .env');
    }
    return;
  }

  const adminOrdersUrl = env.frontendUrl ? `${env.frontendUrl}/admin/orders/${order.id}` : undefined;
  const adminPayload = {
    orderNumber: order.order_number,
    customerEmail: user?.email || (order as any).shipping_mobile || 'Guest Customer',
    customerName: resolvedCustomerName || user?.email || 'Guest Customer',
    total: fmt(order.total),
    currency: order.currency,
    subtotal: fmt(order.subtotal),
    discount: fmt(order.discount),
    lines: lineRows,
    adminOrdersUrl,
  };

  const adminResults = await Promise.all(
    adminRecipients.map((to) => emailService.sendAdminNewOrderEmail(to, adminPayload))
  );
  adminResults.forEach((r, i) => {
    if (!r.sent && env.nodeEnv !== 'test') {
      console.error('[Mail] Admin new-order email failed:', adminRecipients[i], r.error ?? 'unknown');
    }
  });
}
