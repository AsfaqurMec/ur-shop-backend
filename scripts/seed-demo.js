/**
 * Seeds demo data for the MongoDB store.
 * Run after setup: npm run db:seed
 * Demo login: admin@demo.com / demo123 (admin), customer@demo.com / demo123 (customer)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const uri = (process.env.MONGODB_URL || process.env.MONGO_URL || '').trim();
const dbName = (process.env.MONGODB_DB || process.env.DB_NAME || 'ur_shop').trim();
const DEMO_PASSWORD = 'demo123';
const SALT_ROUNDS = 12;

const baseOptions = {
  versionKey: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  strict: false,
};

function model(name, collection) {
  return mongoose.models[name] || mongoose.model(name, new mongoose.Schema({
    id: { type: Number, required: true, unique: true, index: true },
    deleted_at: { type: Date, default: null, index: true },
  }, baseOptions), collection);
}

const Counter = mongoose.models.Counter || mongoose.model('Counter', new mongoose.Schema({
  _id: String,
  seq: Number,
}, { versionKey: false }), 'counters');

async function setCounter(name, seq) {
  await Counter.updateOne({ _id: name }, { $max: { seq } }, { upsert: true });
}

async function main() {
  if (!uri) throw new Error('Missing required env: MONGODB_URL');
  await mongoose.connect(uri, { dbName });

  const Admin = model('SeedAdmin', 'admins');
  const User = model('SeedUser', 'users');
  const Category = model('SeedCategory', 'categories');
  const Product = model('SeedProduct', 'products');
  const ProductImage = model('SeedProductImage', 'product_images');
  const ProductFile = model('SeedProductFile', 'product_files');
  const License = model('SeedLicense', 'product_license_pools');
  const Coupon = model('SeedCoupon', 'coupons');
  const Order = model('SeedOrder', 'orders');
  const OrderItem = model('SeedOrderItem', 'order_items');
  const Payment = model('SeedPayment', 'payments');
  const Delivery = model('SeedDelivery', 'deliveries');
  const Entitlement = model('SeedEntitlement', 'download_entitlements');
  const Review = model('SeedReview', 'reviews');
  const Ticket = model('SeedTicket', 'tickets');
  const TicketMessage = model('SeedTicketMessage', 'ticket_messages');

  const existing = await Admin.findOne({ email: 'admin@demo.com', deleted_at: null }).lean();
  if (existing) {
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  const now = new Date();

  await Admin.create({ id: 1, email: 'admin@demo.com', password_hash: passwordHash, name: 'Demo Admin', role: 'admin', deleted_at: null });
  await User.insertMany([
    { id: 1, email: 'customer@demo.com', password_hash: passwordHash, name: 'Jane Customer', email_verified_at: now, deleted_at: null },
    { id: 2, email: 'alice@demo.com', password_hash: passwordHash, name: 'Alice Buyer', email_verified_at: now, deleted_at: null },
    { id: 3, email: 'bob@demo.com', password_hash: passwordHash, name: 'Bob User', email_verified_at: null, deleted_at: null },
  ]);
  await Category.insertMany([
    { id: 1, name: 'Software', slug: 'software', description: 'Desktop and web applications', sort_order: 1, deleted_at: null },
    { id: 2, name: 'eBooks & Guides', slug: 'ebooks-guides', description: 'Digital books and guides', sort_order: 2, deleted_at: null },
    { id: 3, name: 'Templates', slug: 'templates', description: 'Design and document templates', sort_order: 3, deleted_at: null },
    { id: 4, name: 'Digital Services', slug: 'digital-services', description: 'One-time or subscription services', sort_order: 4, deleted_at: null },
  ]);
  await Product.insertMany([
    { id: 1, category_id: 3, name: 'Starter Template Pack', slug: 'starter-template-pack', description: '10 responsive HTML/CSS templates for landing pages and portfolios.', product_type: 'downloadable', manual_fulfillment_required: 0, price: 29, compare_at_price: 39, is_active: 1, is_featured: 1, deleted_at: null },
    { id: 2, category_id: 1, name: 'Pro License Key', slug: 'pro-license-key', description: 'Single-seat license for Pro Editor software. Key delivered after payment.', product_type: 'license_key', manual_fulfillment_required: 0, price: 79, compare_at_price: null, is_active: 1, is_featured: 1, deleted_at: null },
    { id: 3, category_id: 2, name: 'Design Masterclass eBook', slug: 'design-masterclass-ebook', description: 'Complete guide to UI/UX design. PDF + EPUB.', product_type: 'downloadable', manual_fulfillment_required: 0, price: 19, compare_at_price: 24, is_active: 1, is_featured: 0, deleted_at: null },
    { id: 4, category_id: 4, name: 'Monthly Coaching Call', slug: 'monthly-coaching-call', description: 'One 60-minute 1:1 coaching session. We will contact you to schedule.', product_type: 'digital_service', manual_fulfillment_required: 1, price: 99, compare_at_price: null, is_active: 1, is_featured: 1, deleted_at: null },
    { id: 5, category_id: 4, name: 'Premium Support Subscription', slug: 'premium-support-subscription', description: '3 months of priority email support and early access to updates.', product_type: 'subscription_manual', manual_fulfillment_required: 1, price: 49, compare_at_price: null, is_active: 1, is_featured: 0, deleted_at: null },
  ]);
  await ProductImage.insertMany([1, 2, 3, 4, 5].map((id) => ({
    id,
    product_id: id,
    path: `products/images/seed-${id}.png`,
    alt_text: `Product ${id}`,
    sort_order: 0,
    deleted_at: null,
  })));
  await ProductFile.insertMany([
    { id: 1, product_id: 1, file_path: 'products/files/starter-templates.zip', file_name: 'Starter Template Pack.zip', file_size: 2500000, download_limit: null, sort_order: 0, deleted_at: null },
    { id: 2, product_id: 3, file_path: 'products/files/design-masterclass.pdf', file_name: 'Design Masterclass.pdf', file_size: 5200000, download_limit: null, sort_order: 0, deleted_at: null },
    { id: 3, product_id: 3, file_path: 'products/files/design-masterclass.epub', file_name: 'Design Masterclass.epub', file_size: 3100000, download_limit: null, sort_order: 1, deleted_at: null },
  ]);
  await License.insertMany([
    { id: 1, product_id: 2, product_variation_id: null, license_key: 'DEMO-XXXX-YYYY-001', used_at: now, order_item_id: 3, deleted_at: null },
    { id: 2, product_id: 2, product_variation_id: null, license_key: 'DEMO-XXXX-YYYY-002', used_at: null, order_item_id: null, deleted_at: null },
    { id: 3, product_id: 2, product_variation_id: null, license_key: 'DEMO-XXXX-YYYY-003', used_at: null, order_item_id: null, deleted_at: null },
  ]);
  await Coupon.insertMany([
    { id: 1, code: 'WELCOME10', type: 'percentage', value: 10, min_order_amount: 20, max_uses: 100, max_uses_per_user: null, used_count: 0, valid_from: now, valid_until: new Date(now.getTime() + 365 * 86400000), is_active: 1, deleted_at: null },
    { id: 2, code: 'SAVE5', type: 'fixed_amount', value: 5, min_order_amount: 30, max_uses: null, max_uses_per_user: null, used_count: 0, valid_from: now, valid_until: new Date(now.getTime() + 180 * 86400000), is_active: 1, deleted_at: null },
  ]);
  await Order.insertMany([
    { id: 1, user_id: 1, order_number: 'ORD-DEMO-001', status: 'paid', subtotal: 48, discount: 0, tax: 0, total: 48, currency: 'BDT' },
    { id: 2, user_id: 2, order_number: 'ORD-DEMO-002', status: 'pending', subtotal: 79, discount: 0, tax: 0, total: 79, currency: 'BDT' },
  ]);
  await OrderItem.insertMany([
    { id: 1, order_id: 1, product_id: 1, product_variation_id: null, product_name: 'Starter Template Pack', product_type: 'downloadable', quantity: 1, unit_price: 29, total_price: 29, purchase_selections: {}, purchase_selections_summary: [] },
    { id: 2, order_id: 1, product_id: 3, product_variation_id: null, product_name: 'Design Masterclass eBook', product_type: 'downloadable', quantity: 1, unit_price: 19, total_price: 19, purchase_selections: {}, purchase_selections_summary: [] },
    { id: 3, order_id: 2, product_id: 2, product_variation_id: null, product_name: 'Pro License Key', product_type: 'license_key', quantity: 1, unit_price: 79, total_price: 79, purchase_selections: {}, purchase_selections_summary: [] },
  ]);
  await Payment.create({ id: 1, order_id: 1, amount: 48, currency: 'BDT', status: 'completed', gateway: 'cash_on_delivery', payment_option_id: null, gateway_reference: null, bkash_payment_id: null });
  await Delivery.create({ id: 1, order_id: 1, status: 'delivered', notes: null, delivered_at: now });
  await Entitlement.insertMany([
    { id: 1, order_item_id: 1, product_file_id: 1, expires_at: null },
    { id: 2, order_item_id: 2, product_file_id: 2, expires_at: null },
    { id: 3, order_item_id: 2, product_file_id: 3, expires_at: null },
  ]);
  await Review.insertMany([
    { id: 1, product_id: 1, user_id: 1, order_id: 1, rating: 5, title: 'Exactly what I needed', body: 'Clean templates, easy to customize. Great value.', status: 'approved', deleted_at: null },
    { id: 2, product_id: 3, user_id: 2, order_id: null, rating: 4, title: 'Solid content', body: 'Well written and practical. Recommended.', status: 'approved', deleted_at: null },
  ]);
  await Ticket.create({ id: 1, user_id: 1, order_id: 1, subject: 'Question about my order', status: 'answered' });
  await TicketMessage.insertMany([
    { id: 1, ticket_id: 1, sender_type: 'user', user_id: 1, admin_id: null, message: 'When will I get the download link?' },
    { id: 2, ticket_id: 1, sender_type: 'admin', user_id: null, admin_id: 1, message: 'Your order has been delivered. You can download the files from your dashboard under Orders.' },
  ]);

  await Promise.all([
    setCounter('admins', 1),
    setCounter('users', 3),
    setCounter('categories', 4),
    setCounter('products', 5),
    setCounter('product_images', 5),
    setCounter('product_files', 3),
    setCounter('product_license_pools', 3),
    setCounter('coupons', 2),
    setCounter('orders', 2),
    setCounter('order_items', 3),
    setCounter('payments', 1),
    setCounter('deliveries', 1),
    setCounter('download_entitlements', 3),
    setCounter('reviews', 2),
    setCounter('tickets', 1),
    setCounter('ticket_messages', 2),
  ]);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err.message || err);
  process.exit(1);
});
