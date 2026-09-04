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
const MARGIN = 48;
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
function money(amount, currency) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
}
function text(doc, value, x, y, options = {}) {
    doc.text(value || '-', x, y, options);
}
async function loadCompanyLogo(url) {
    if (!/^https?:\/\//i.test(url))
        return null;
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
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
    const doc = new pdfkit_1.default({ size: 'A4', margin: MARGIN, info: { Title: `Invoice ${order.order_number}` } });
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
    const brand = 'UR SHOP';
    const logo = await loadCompanyLogo(settings.siteLogo);
    const orderDate = order.created_at.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const status = order.status.replace(/_/g, ' ').toUpperCase();
    doc.rect(0, 0, PAGE_WIDTH, 112).fill('#111827');
    if (logo) {
        try {
            doc.image(logo, MARGIN, 34, { fit: [48, 48], align: 'center', valign: 'center' });
        }
        catch {
            doc.roundedRect(MARGIN, 34, 48, 48, 8).fill('#FFFFFF');
            doc.fillColor('#111827').font(fontBold).fontSize(20).text(brand.slice(0, 1).toUpperCase(), MARGIN, 47, { width: 48, align: 'center' });
        }
    }
    else {
        doc.roundedRect(MARGIN, 34, 48, 48, 8).fill('#FFFFFF');
        doc.fillColor('#111827').font(fontBold).fontSize(20).text(brand.slice(0, 1).toUpperCase(), MARGIN, 47, { width: 48, align: 'center' });
    }
    doc.fillColor('#FFFFFF').font(fontBold).fontSize(24).text(brand, MARGIN + 62, 38, { width: 238 });
    doc.font(fontRegular).fontSize(10).fillColor('#D1D5DB').text(settings.contactEmail || 'Invoice', MARGIN + 62, 70, { width: 238 });
    doc.fillColor('#FFFFFF').font(fontBold).fontSize(21).text('INVOICE', 390, 40, { width: 157, align: 'right' });
    doc.font(fontRegular).fontSize(9).fillColor('#D1D5DB').text(order.order_number, 390, 69, { width: 157, align: 'right' });
    let y = 142;
    doc.fillColor('#111827').font(fontBold).fontSize(9).text('BILLED TO', MARGIN, y);
    doc.font(fontRegular).fontSize(10).text(order.shipping_name || customer?.name || 'Customer', MARGIN, y + 17);
    text(doc, customer?.email || '', MARGIN, y + 32);
    text(doc, order.shipping_mobile || customer?.mobile || '', MARGIN, y + 47);
    const address = [order.shipping_address, order.shipping_address_line2, order.shipping_postal_code].filter(Boolean).join(', ');
    text(doc, address, MARGIN, y + 62, { width: 250 });
    doc.font(fontBold).fontSize(9).text('ORDER INFORMATION', 350, y);
    doc.font(fontRegular).fontSize(10);
    text(doc, `Date: ${orderDate}`, 350, y + 17);
    text(doc, `Order status: ${status}`, 350, y + 32);
    text(doc, `Payment: ${payment ? `${payment.gateway} (${payment.status})` : 'Pending'}`, 350, y + 47, { width: 195 });
    text(doc, `Shipping: ${order.shipping_method_title || 'Standard'}`, 350, y + 62, { width: 195 });
    y = 253;
    const drawTableHeader = () => {
        doc.rect(MARGIN, y, PAGE_WIDTH - MARGIN * 2, 26).fill('#F3F4F6');
        doc.fillColor('#374151').font(fontBold).fontSize(9);
        doc.text('ITEM', MARGIN + 10, y + 9, { width: 270 });
        doc.text('QTY', 330, y + 9, { width: 40, align: 'right' });
        doc.text('PRICE', 380, y + 9, { width: 70, align: 'right' });
        doc.text('AMOUNT', 460, y + 9, { width: 78, align: 'right' });
        y += 26;
    };
    drawTableHeader();
    doc.font(fontRegular).fontSize(9).fillColor('#111827');
    for (const item of items) {
        const variationParts = item.purchase_selections_summary?.map((s) => `${s.label}: ${s.value}`).join(', ') || '';
        const skuText = item.sku ? `SKU: ${item.sku}` : '';
        const metaText = [skuText, variationParts].filter(Boolean).join(' | ');
        const hasMeta = Boolean(metaText);
        const itemHeight = hasMeta ? 46 : Math.max(34, doc.heightOfString(item.product_name, { width: 270 }) + 16);
        if (y + itemHeight > 660) {
            doc.addPage();
            y = MARGIN;
            drawTableHeader();
        }
        doc.moveTo(MARGIN, y + itemHeight).lineTo(PAGE_WIDTH - MARGIN, y + itemHeight).strokeColor('#E5E7EB').stroke();
        doc.fillColor('#111827').font(fontBold).fontSize(9).text(item.product_name, MARGIN + 10, y + 7, { width: 270 });
        if (hasMeta) {
            doc.fillColor('#6B7280').font(fontRegular).fontSize(8).text(metaText, MARGIN + 10, y + 22, { width: 270 });
        }
        doc.fillColor('#111827').font(fontRegular).fontSize(9).text(String(item.quantity), 330, y + 9, { width: 40, align: 'right' });
        doc.text(money(Number(item.unit_price), order.currency), 380, y + 9, { width: 70, align: 'right' });
        doc.text(money(Number(item.total_price), order.currency), 460, y + 9, { width: 78, align: 'right' });
        y += itemHeight;
    }
    y += 24;
    if (y > PAGE_HEIGHT - 150) {
        doc.addPage();
        y = MARGIN + 20;
    }
    const totalX = 365;
    const totalRow = (label, value, bold = false) => {
        doc.font(bold ? fontBold : fontRegular).fontSize(bold ? 11 : 9).fillColor('#111827');
        doc.text(label, totalX, y, { width: 90 });
        doc.text(value, 460, y, { width: 78, align: 'right' });
        y += bold ? 24 : 18;
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
    doc.moveTo(totalX, y - 3).lineTo(PAGE_WIDTH - MARGIN, y - 3).strokeColor('#9CA3AF').stroke();
    totalRow('TOTAL', money(order.total, order.currency), true);
    doc.font(fontRegular).fontSize(8).fillColor('#6B7280').text(`Thank you for your order. This invoice was generated on ${new Date().toLocaleDateString('en-GB')}.`, MARGIN, PAGE_HEIGHT - 60, { width: PAGE_WIDTH - MARGIN * 2, align: 'center' });
    doc.end();
    return { filename: `invoice-${order.order_number}.pdf`, buffer: await finished };
}
//# sourceMappingURL=invoiceService.js.map