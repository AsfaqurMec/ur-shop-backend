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
exports.createInvoicePdf = createInvoicePdf;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const errorHandler_1 = require("../middlewares/errorHandler");
const orderRepo = __importStar(require("../repositories/orderRepository"));
const authRepo = __importStar(require("../repositories/authRepository"));
const storeSettingsService = __importStar(require("./storeSettingsService"));
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 30; // Reduced horizontal padding
const MARGIN_Y = 32;
const FOOTER_ZONE = 44;
const CONTENT_BOTTOM_LIMIT = PAGE_HEIGHT - FOOTER_ZONE - 12;
const TABLE_PAD_LEFT = 10;
const TABLE_PAD_RIGHT = 14;
function resolveFontPath(filename) {
    const candidates = [
        path_1.default.join(__dirname, '..', '..', 'assets', 'fonts', filename),
        path_1.default.join(__dirname, '..', 'assets', 'fonts', filename),
        path_1.default.join(__dirname, 'assets', 'fonts', filename),
        path_1.default.join(process.cwd(), 'assets', 'fonts', filename),
        path_1.default.join(process.cwd(), 'src', 'assets', 'fonts', filename),
        path_1.default.join(process.cwd(), 'dist', 'assets', 'fonts', filename),
    ];
    for (const c of candidates) {
        if (fs_1.default.existsSync(c))
            return c;
    }
    return null;
}
function money(amount, currency = 'BDT') {
    const numeric = Number(amount) || 0;
    const curr = (currency || 'BDT').toUpperCase().trim();
    const formattedNumber = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numeric);
    if (curr === 'BDT') {
        return `BDT ৳ ${formattedNumber}`;
    }
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: curr,
            minimumFractionDigits: 2,
        }).format(numeric);
    }
    catch {
        return `${curr} ${formattedNumber}`;
    }
}
function text(doc, value, x, y, options = {}) {
    doc.text(value || '-', x, y, options);
}
function getStoreBrandName(settings) {
    const isBoilerplate = (s) => /^digital product(s)? selling$/i.test(s) ||
        /^digital (store|products?)$/i.test(s) ||
        /^my digital store$/i.test(s);
    if (settings.siteTitle && settings.siteTitle.trim() && !isBoilerplate(settings.siteTitle.trim())) {
        return settings.siteTitle.trim();
    }
    if (settings.storeName && settings.storeName.trim() && !isBoilerplate(settings.storeName.trim())) {
        return settings.storeName.trim();
    }
    const envName = process.env.NEXT_PUBLIC_SITE_NAME || process.env.MAIL_APP_NAME || process.env.STORE_NAME;
    if (envName && envName.trim() && !isBoilerplate(envName.trim())) {
        return envName.trim();
    }
    return 'UR SHOP';
}
async function loadCompanyLogo(urlOrPath) {
    if (!urlOrPath)
        return null;
    const trimmed = urlOrPath.trim();
    if (!trimmed)
        return null;
    // Local filesystem path or relative URL
    if (trimmed.startsWith('/') || !/^https?:\/\//i.test(trimmed)) {
        const cleanPath = trimmed.replace(/^\/+/, '');
        const candidates = [
            path_1.default.resolve(cleanPath),
            path_1.default.join(process.cwd(), cleanPath),
            path_1.default.join(process.cwd(), 'public', cleanPath),
            path_1.default.join(process.cwd(), 'uploads', cleanPath),
            path_1.default.join(process.cwd(), '..', cleanPath),
            path_1.default.join(process.cwd(), '..', 'UR-Shop--Frontend', 'public', cleanPath),
        ];
        for (const c of candidates) {
            if (fs_1.default.existsSync(c)) {
                try {
                    const buf = fs_1.default.readFileSync(c);
                    if (buf.length > 0 && buf.length <= 2_000_000)
                        return buf;
                }
                catch { }
            }
        }
    }
    // Remote HTTP/HTTPS URL
    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const response = await fetch(trimmed, { signal: AbortSignal.timeout(4000) });
            const length = Number(response.headers.get('content-length') || 0);
            if (!response.ok || (length && length > 2_000_000))
                return null;
            const data = Buffer.from(await response.arrayBuffer());
            return data.length > 0 && data.length <= 2_000_000 ? data : null;
        }
        catch {
            return null;
        }
    }
    return null;
}
/** Creates a customer-owned or admin printable invoice. Amounts are taken only from the stored order. */
async function createInvoicePdf(userId, orderId, isAdmin = false, guestToken) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order)
        throw new errorHandler_1.AppError(404, 'Order not found');
    const isGuestMatch = order.user_id == null &&
        Boolean(order.guest_token) &&
        Boolean(guestToken) &&
        order.guest_token?.trim() === guestToken?.trim();
    const isOwner = userId != null && order.user_id === userId;
    if (!isAdmin && !isOwner && !isGuestMatch) {
        throw new errorHandler_1.AppError(403, 'Forbidden');
    }
    const [items, payment, customer, settings] = await Promise.all([
        orderRepo.findOrderItems(orderId),
        orderRepo.findPaymentByOrderId(orderId),
        order.user_id != null ? authRepo.findUserById(order.user_id) : null,
        storeSettingsService.getStoreSettings(),
    ]);
    const rawOrderId = order.id ? Number(order.id) : null;
    const orderSerialFormatted = rawOrderId != null ? `#${rawOrderId}` : (order.order_number ? `#${order.order_number}` : '#—');
    const orderRef = order.order_number ? String(order.order_number).trim() : (rawOrderId != null ? `ORD-${rawOrderId}` : '—');
    const hasDistinctRef = Boolean(orderRef && orderRef !== String(rawOrderId) && orderRef !== `#${rawOrderId}`);
    const doc = new pdfkit_1.default({
        size: 'A4',
        margins: { top: MARGIN_Y, bottom: MARGIN_Y, left: MARGIN_X, right: MARGIN_X },
        bufferPages: true,
        info: { Title: `Invoice ${orderSerialFormatted}` },
    });
    const regFontPath = resolveFontPath('HindSiliguri-Regular.ttf');
    const boldFontPath = resolveFontPath('HindSiliguri-Bold.ttf');
    let fontRegular = 'Helvetica';
    let fontBold = 'Helvetica-Bold';
    if (regFontPath && boldFontPath) {
        try {
            doc.registerFont('AppFont', regFontPath);
            doc.registerFont('AppFont-Bold', boldFontPath);
            fontRegular = 'AppFont';
            fontBold = 'AppFont-Bold';
        }
        catch {
            fontRegular = 'Helvetica';
            fontBold = 'Helvetica-Bold';
        }
    }
    const chunks = [];
    const finished = new Promise((resolve, reject) => {
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });
    const brand = getStoreBrandName(settings);
    const logo = await loadCompanyLogo(settings.siteLogo);
    const orderDate = order.created_at.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const status = order.status.replace(/_/g, ' ').toUpperCase();
    // 1. Header Banner
    doc.rect(0, 0, PAGE_WIDTH, 102).fill('#0F172A');
    if (logo) {
        try {
            doc.image(logo, MARGIN_X, 25, { fit: [52, 52], align: 'center', valign: 'center' });
        }
        catch {
            doc.roundedRect(MARGIN_X, 25, 52, 52, 6).fill('#1E293B');
            doc.fillColor('#FFFFFF').font(fontBold).fontSize(22).text(brand.slice(0, 1).toUpperCase(), MARGIN_X, 38, { width: 52, align: 'center' });
        }
    }
    else {
        doc.roundedRect(MARGIN_X, 25, 52, 52, 6).fill('#1E293B');
        doc.fillColor('#FFFFFF').font(fontBold).fontSize(22).text(brand.slice(0, 1).toUpperCase(), MARGIN_X, 38, { width: 52, align: 'center' });
    }
    doc.fillColor('#FFFFFF').font(fontBold).fontSize(20).text(brand, MARGIN_X + 64, 26, { width: 240 });
    doc.font(fontRegular).fontSize(9).fillColor('#94A3B8').text(settings.contactEmail || 'Customer Invoice', MARGIN_X + 64, 50, { width: 240 });
    if (settings.address) {
        doc.font(fontRegular).fontSize(8).fillColor('#64748B').text(settings.address, MARGIN_X + 64, 64, { width: 240 });
    }
    const rightColX = 330;
    const rightColWidth = PAGE_WIDTH - MARGIN_X - rightColX;
    doc.fillColor('#FFFFFF').font(fontBold).fontSize(22).text('INVOICE', rightColX, 22, { width: rightColWidth, align: 'right' });
    doc.font(fontBold).fontSize(13).fillColor('#38BDF8').text(orderSerialFormatted, rightColX, 48, { width: rightColWidth, align: 'right' });
    if (hasDistinctRef) {
        doc.font(fontRegular).fontSize(8).fillColor('#94A3B8').text(`Ref: ${orderRef}`, rightColX, 66, { width: rightColWidth, align: 'right' });
        doc.font(fontRegular).fontSize(8).fillColor('#64748B').text(`Date: ${orderDate}`, rightColX, 78, { width: rightColWidth, align: 'right' });
    }
    else {
        doc.font(fontRegular).fontSize(8.5).fillColor('#94A3B8').text(`Date: ${orderDate}`, rightColX, 66, { width: rightColWidth, align: 'right' });
    }
    // 2. Billed To & Order Details Section
    let y = 118;
    const customerName = order.shipping_name || customer?.name || 'Customer';
    const customerEmail = customer?.email || '';
    const customerPhone = order.shipping_mobile || customer?.mobile || '';
    const addressParts = [
        order.shipping_address,
        order.shipping_address_line2,
        order.shipping_city,
        order.shipping_postal_code,
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ');
    // Left: Billed To
    doc.fillColor('#64748B').font(fontBold).fontSize(8).text('BILLED TO', MARGIN_X, y);
    doc.fillColor('#0F172A').font(fontBold).fontSize(10.5).text(customerName, MARGIN_X, y + 14);
    let custY = y + 29;
    if (customerEmail) {
        doc.font(fontRegular).fontSize(9).fillColor('#334155');
        text(doc, customerEmail, MARGIN_X, custY);
        custY += 14;
    }
    if (customerPhone) {
        doc.font(fontRegular).fontSize(9).fillColor('#334155');
        text(doc, customerPhone, MARGIN_X, custY);
        custY += 14;
    }
    if (fullAddress) {
        doc.font(fontRegular).fontSize(8.5).fillColor('#475569');
        text(doc, fullAddress, MARGIN_X, custY, { width: 230 });
        custY += doc.heightOfString(fullAddress, { width: 230 }) + 4;
    }
    // Right: Order Information
    const infoX = 330;
    doc.fillColor('#64748B').font(fontBold).fontSize(8).text('ORDER INFORMATION', infoX, y);
    doc.font(fontRegular).fontSize(9).fillColor('#475569');
    doc.text('Order Serial #: ', infoX, y + 14, { continued: true }).font(fontBold).fillColor('#0F172A').text(orderSerialFormatted);
    let infoRowY = y + 29;
    if (hasDistinctRef) {
        doc.font(fontRegular).fillColor('#475569').text('Order Ref: ', infoX, infoRowY, { continued: true }).font(fontRegular).fillColor('#111827').text(orderRef);
        infoRowY += 15;
    }
    doc.font(fontRegular).fillColor('#475569').text('Order Date: ', infoX, infoRowY, { continued: true }).font(fontRegular).fillColor('#111827').text(orderDate);
    infoRowY += 15;
    const statusColor = status === 'PAID' || status === 'COMPLETED' ? '#059669' : status === 'CANCELLED' ? '#DC2626' : '#D97706';
    doc.font(fontRegular).fillColor('#475569').text('Order Status: ', infoX, infoRowY, { continued: true }).font(fontBold).fillColor(statusColor).text(status);
    infoRowY += 15;
    const paymentText = payment ? `${payment.gateway} (${payment.status})` : 'Pending';
    doc.font(fontRegular).fillColor('#475569').text('Payment: ', infoX, infoRowY, { continued: true }).font(fontRegular).fillColor('#111827').text(paymentText, { width: rightColWidth });
    infoRowY += 15;
    const shippingText = order.shipping_method_title || 'Standard Delivery';
    doc.font(fontRegular).fillColor('#475569').text('Shipping: ', infoX, infoRowY, { continued: true }).font(fontRegular).fillColor('#111827').text(shippingText, { width: rightColWidth });
    infoRowY += 15;
    const infoBottom = Math.max(custY, infoRowY);
    y = infoBottom + 14;
    // 3. Line Items Table
    const tableWidth = PAGE_WIDTH - MARGIN_X * 2;
    const tableRight = PAGE_WIDTH - MARGIN_X;
    const amountColWidth = tableRight - 466 - TABLE_PAD_RIGHT; // Generates clean gap on right
    const drawTableHeader = () => {
        doc.rect(MARGIN_X, y, tableWidth, 24).fill('#F1F5F9');
        doc.fillColor('#475569').font(fontBold).fontSize(8.5);
        doc.text('#', MARGIN_X + TABLE_PAD_LEFT, y + 7, { width: 24, align: 'center' });
        doc.text('ITEM DESCRIPTION', 68, y + 7, { width: 252 });
        doc.text('QTY', 328, y + 7, { width: 36, align: 'center' });
        doc.text('PRICE', 372, y + 7, { width: 88, align: 'right' });
        doc.text('AMOUNT', 466, y + 7, { width: amountColWidth, align: 'right' });
        y += 24;
    };
    drawTableHeader();
    doc.font(fontRegular).fontSize(9).fillColor('#111827');
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const variationParts = item.purchase_selections_summary?.map((s) => `${s.label}: ${s.value}`).join(', ') || '';
        const skuText = item.sku ? `SKU: ${item.sku}` : '';
        const metaText = [skuText, variationParts].filter(Boolean).join(' | ');
        const nameHeight = doc.heightOfString(item.product_name, { width: 252 });
        const metaHeight = metaText ? doc.heightOfString(metaText, { width: 252 }) : 0;
        const itemHeight = Math.max(34, nameHeight + metaHeight + 14);
        if (y + itemHeight > CONTENT_BOTTOM_LIMIT - 90) {
            doc.addPage();
            y = MARGIN_Y + 10;
            drawTableHeader();
        }
        doc.moveTo(MARGIN_X, y + itemHeight).lineTo(tableRight, y + itemHeight).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
        // Serial number column
        doc.fillColor('#64748B').font(fontRegular).fontSize(8.5).text(String(i + 1), MARGIN_X + TABLE_PAD_LEFT, y + 8, { width: 24, align: 'center' });
        // Item name & meta
        doc.fillColor('#0F172A').font(fontBold).fontSize(9).text(item.product_name, 68, y + 8, { width: 252 });
        if (metaText) {
            doc.fillColor('#64748B').font(fontRegular).fontSize(8).text(metaText, 68, y + 8 + nameHeight + 2, { width: 252 });
        }
        // Qty
        doc.fillColor('#0F172A').font(fontRegular).fontSize(9).text(String(item.quantity), 328, y + 8, { width: 36, align: 'center' });
        // Unit Price & Total with right padding gap
        doc.fillColor('#334155').font(fontRegular).fontSize(9).text(money(Number(item.unit_price), order.currency), 372, y + 8, { width: 88, align: 'right' });
        doc.fillColor('#0F172A').font(fontBold).fontSize(9).text(money(Number(item.total_price), order.currency), 466, y + 8, { width: amountColWidth, align: 'right' });
        y += itemHeight;
    }
    // 4. Totals & Payment Summary Section
    y += 14;
    if (y + 110 > CONTENT_BOTTOM_LIMIT) {
        doc.addPage();
        y = MARGIN_Y + 10;
    }
    const totalsStartY = y;
    // Left card: Payment Details
    const cardWidth = 240;
    doc.roundedRect(MARGIN_X, totalsStartY, cardWidth, 68, 4).fill('#F8FAFC').strokeColor('#E2E8F0').lineWidth(0.5).stroke();
    doc.fillColor('#475569').font(fontBold).fontSize(8).text('PAYMENT DETAILS', MARGIN_X + 12, totalsStartY + 10);
    doc.fillColor('#334155').font(fontRegular).fontSize(8).text(`Status: ${(payment?.status || order.payment_status || 'PENDING').toUpperCase()}`, MARGIN_X + 12, totalsStartY + 24);
    doc.fillColor('#334155').font(fontRegular).fontSize(8).text(`Gateway: ${payment?.gateway || 'Standard'}`, MARGIN_X + 12, totalsStartY + 37);
    const paymentRef = payment?.bkash_payment_id || payment?.gateway_reference;
    if (paymentRef) {
        doc.fillColor('#64748B').font(fontRegular).fontSize(7.5).text(`Order Ref: ${orderSerialFormatted} | Payment Ref: ${paymentRef}`, MARGIN_X + 12, totalsStartY + 50, { width: cardWidth - 24 });
    }
    else {
        doc.fillColor('#64748B').font(fontRegular).fontSize(7.5).text(`Order Serial: ${orderSerialFormatted}${hasDistinctRef ? ` | Ref: ${orderRef}` : ''}`, MARGIN_X + 12, totalsStartY + 50, { width: cardWidth - 24 });
    }
    // Right side: Totals breakdown
    const totalLabelX = 330;
    const totalValueX = 434;
    const totalValueWidth = tableRight - totalValueX - TABLE_PAD_RIGHT;
    const totalRow = (label, value, bold = false) => {
        doc.font(bold ? fontBold : fontRegular).fontSize(bold ? 9.5 : 8.5).fillColor('#334155');
        doc.text(label, totalLabelX, y, { width: 95 });
        doc.text(value, totalValueX, y, { width: totalValueWidth, align: 'right' });
        y += bold ? 24 : 16;
    };
    totalRow('Subtotal', money(order.subtotal, order.currency));
    if (order.discount > 0) {
        const couponLabel = order.coupon_code || order.coupon_name ? `Discount (${order.coupon_code || order.coupon_name})` : 'Discount';
        totalRow(couponLabel, `-${money(order.discount, order.currency)}`);
    }
    if (order.tax > 0)
        totalRow('Tax', money(order.tax, order.currency));
    if (order.shipping_fee > 0 || order.shipping_method_title)
        totalRow('Shipping', money(order.shipping_fee, order.currency));
    doc.moveTo(totalLabelX, y).lineTo(tableRight, y).strokeColor('#CBD5E1').lineWidth(0.5).stroke();
    y += 5;
    // Final Total Highlight Box with right padding gap
    doc.rect(totalLabelX - 8, y, tableRight - (totalLabelX - 8), 26).fill('#0F172A');
    doc.fillColor('#FFFFFF').font(fontBold).fontSize(9.5).text('TOTAL', totalLabelX, y + 7);
    doc.fillColor('#FFFFFF').font(fontBold).fontSize(10.5).text(money(order.total, order.currency), totalValueX, y + 6, { width: totalValueWidth, align: 'right' });
    // 5. Post-Processing: Draw Footers on All Pages Without Overflow
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const oldBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        // Footer divider line
        doc.moveTo(MARGIN_X, PAGE_HEIGHT - 38).lineTo(tableRight, PAGE_HEIGHT - 38).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
        // Footer text
        doc.font(fontRegular).fontSize(8).fillColor('#64748B');
        doc.text(`Thank you for shopping with ${brand}. Generated on ${new Date().toLocaleDateString('en-GB')}.`, MARGIN_X, PAGE_HEIGHT - 28, { lineBreak: false });
        doc.font(fontRegular).fontSize(8).fillColor('#94A3B8');
        doc.text(`Page ${i + 1} of ${range.count}`, MARGIN_X, PAGE_HEIGHT - 28, { width: tableWidth, align: 'right', lineBreak: false });
        doc.page.margins.bottom = oldBottom;
    }
    doc.end();
    return { filename: `invoice-${rawOrderId || order.order_number}.pdf`, buffer: await finished };
}
//# sourceMappingURL=invoiceService.js.map