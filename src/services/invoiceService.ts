import PDFDocument from 'pdfkit';
import { AppError } from '../middlewares/errorHandler';
import * as orderRepo from '../repositories/orderRepository';
import * as authRepo from '../repositories/authRepository';
import * as storeSettingsService from './storeSettingsService';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
}

function text(doc: PDFKit.PDFDocument, value: string, x: number, y: number, options: PDFKit.Mixins.TextOptions = {}) {
  doc.text(value || '-', x, y, options);
}

async function loadCompanyLogo(url: string): Promise<Buffer | null> {
  if (!/^https?:\/\//i.test(url)) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const length = Number(response.headers.get('content-length') || 0);
    if (!response.ok || (length && length > 2_000_000)) return null;
    const data = Buffer.from(await response.arrayBuffer());
    return data.length > 0 && data.length <= 2_000_000 ? data : null;
  } catch {
    return null;
  }
}

/** Creates a customer-owned, printable invoice. Amounts are taken only from the stored order. */
export async function createInvoicePdf(userId: number, orderId: number): Promise<{ filename: string; buffer: Buffer }> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) throw new AppError(404, 'Order not found');
  if (order.user_id !== userId) throw new AppError(403, 'Forbidden');

  const [items, payment, customer, settings] = await Promise.all([
    orderRepo.findOrderItems(orderId),
    orderRepo.findPaymentByOrderId(orderId),
    authRepo.findUserById(userId),
    storeSettingsService.getStoreSettings(),
  ]);

  const doc = new PDFDocument({ size: 'A4', margin: MARGIN, info: { Title: `Invoice ${order.order_number}` } });
  const chunks: Buffer[] = [];
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
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
    } catch {
      doc.roundedRect(MARGIN, 34, 48, 48, 8).fill('#FFFFFF');
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(20).text(brand.slice(0, 1).toUpperCase(), MARGIN, 47, { width: 48, align: 'center' });
    }
  } else {
    doc.roundedRect(MARGIN, 34, 48, 48, 8).fill('#FFFFFF');
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(20).text(brand.slice(0, 1).toUpperCase(), MARGIN, 47, { width: 48, align: 'center' });
  }
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(24).text(brand, MARGIN + 62, 38, { width: 238 });
  doc.font('Helvetica').fontSize(10).fillColor('#D1D5DB').text(settings.contactEmail || 'Invoice', MARGIN + 62, 70, { width: 238 });
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(21).text('INVOICE', 390, 40, { width: 157, align: 'right' });
  doc.font('Helvetica').fontSize(9).fillColor('#D1D5DB').text(order.order_number, 390, 69, { width: 157, align: 'right' });

  let y = 142;
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9).text('BILLED TO', MARGIN, y);
  doc.font('Helvetica').fontSize(10).text(customer?.name || 'Customer', MARGIN, y + 17);
  text(doc, customer?.email || '', MARGIN, y + 32);
  text(doc, order.shipping_mobile || customer?.mobile || '', MARGIN, y + 47);
  const address = [order.shipping_address, order.shipping_address_line2, [order.shipping_city, order.shipping_postal_code].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  text(doc, address, MARGIN, y + 62, { width: 250 });

  doc.font('Helvetica-Bold').fontSize(9).text('ORDER INFORMATION', 350, y);
  doc.font('Helvetica').fontSize(10);
  text(doc, `Date: ${orderDate}`, 350, y + 17);
  text(doc, `Order status: ${status}`, 350, y + 32);
  text(doc, `Payment: ${payment ? `${payment.gateway} (${payment.status})` : 'Pending'}`, 350, y + 47, { width: 195 });
  text(doc, `Shipping: ${order.shipping_method_title || 'Standard'}`, 350, y + 62, { width: 195 });

  y = 253;
  const drawTableHeader = () => {
    doc.rect(MARGIN, y, PAGE_WIDTH - MARGIN * 2, 26).fill('#F3F4F6');
    doc.fillColor('#374151').font('Helvetica-Bold').fontSize(9);
    doc.text('ITEM', MARGIN + 10, y + 9, { width: 270 });
    doc.text('QTY', 330, y + 9, { width: 40, align: 'right' });
    doc.text('PRICE', 380, y + 9, { width: 70, align: 'right' });
    doc.text('AMOUNT', 460, y + 9, { width: 78, align: 'right' });
    y += 26;
  };
  drawTableHeader();
  doc.font('Helvetica').fontSize(9).fillColor('#111827');
  for (const item of items) {
    const itemHeight = Math.max(34, doc.heightOfString(item.product_name, { width: 270 }) + 16);
    if (y + itemHeight > 660) {
      doc.addPage();
      y = MARGIN;
      drawTableHeader();
    }
    doc.moveTo(MARGIN, y + itemHeight).lineTo(PAGE_WIDTH - MARGIN, y + itemHeight).strokeColor('#E5E7EB').stroke();
    doc.fillColor('#111827').font('Helvetica-Bold').text(item.product_name, MARGIN + 10, y + 9, { width: 270 });
    doc.font('Helvetica').text(String(item.quantity), 330, y + 9, { width: 40, align: 'right' });
    doc.text(money(Number(item.unit_price), order.currency), 380, y + 9, { width: 70, align: 'right' });
    doc.text(money(Number(item.total_price), order.currency), 460, y + 9, { width: 78, align: 'right' });
    y += itemHeight;
  }

  // y = Math.max(y + 24, 610);
  // if (y > 690) { doc.addPage(); y = MARGIN + 20; }
  y += 24;

// Make sure there is enough room for the totals section.
// If not, move the totals to the next page.
  if (y > PAGE_HEIGHT - 150) {
    doc.addPage();
    y = MARGIN + 20;
  }

  const totalX = 365;
  const totalRow = (label: string, value: string, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9).fillColor('#111827');
    doc.text(label, totalX, y, { width: 90 });
    doc.text(value, 460, y, { width: 78, align: 'right' });
    y += bold ? 24 : 18;
  };
  totalRow('Subtotal', money(order.subtotal, order.currency));
  if (order.discount > 0) totalRow('Discount', `-${money(order.discount, order.currency)}`);
  if (order.tax > 0) totalRow('Tax', money(order.tax, order.currency));
  if (order.shipping_fee > 0 || order.shipping_method_title) totalRow('Shipping', money(order.shipping_fee, order.currency));
  doc.moveTo(totalX, y - 3).lineTo(PAGE_WIDTH - MARGIN, y - 3).strokeColor('#9CA3AF').stroke();
  totalRow('TOTAL', money(order.total, order.currency), true);

  doc.font('Helvetica').fontSize(8).fillColor('#6B7280').text(
    `Thank you for your order. This invoice was generated on ${new Date().toLocaleDateString('en-GB')}.`,
    MARGIN,
    PAGE_HEIGHT - 60,
    { width: PAGE_WIDTH - MARGIN * 2, align: 'center' }
  );
  doc.end();
  return { filename: `invoice-${order.order_number}.pdf`, buffer: await finished };
}
