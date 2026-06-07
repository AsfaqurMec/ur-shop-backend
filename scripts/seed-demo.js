/**
 * Seeds demo data for the digital products store.
 * Run after migrations: npm run db:seed
 * Demo login: admin@demo.com / demo123 (admin), customer@demo.com / demo123 (customer)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'digital_products';

const DEMO_PASSWORD = 'demo123';
const SALT_ROUNDS = 12;

async function main() {
  //  console.log('Connecting to database...');
  let conn;
  try {
    conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: true,
    });
  } catch (e) {
    if (e.code === 'ECONNREFUSED') {
      console.error('Cannot connect to MySQL. Start the database first (see docs/LOCAL-DATABASE.md).');
    }
    throw e;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  try {
    const [existing] = await conn.execute('SELECT 1 FROM admins WHERE email = ? LIMIT 1', ['admin@demo.com']);
    if (existing.length) {
      //  console.log('Demo data already present. Skip seeding.');
      return;
    }
    //  console.log('Seeding admins...');
    await conn.execute(
      `INSERT INTO admins (email, password_hash, name, role) VALUES (?, ?, ?, ?)`,
      ['admin@demo.com', passwordHash, 'Demo Admin', 'admin']
    );

    //  console.log('Seeding users...');
    const [userRes] = await conn.execute(
      `INSERT INTO users (email, password_hash, name, email_verified_at) VALUES 
       (?, ?, ?, NOW()), (?, ?, ?, NOW()), (?, ?, ?, NULL)`,
      [
        'customer@demo.com', passwordHash, 'Jane Customer',
        'alice@demo.com', passwordHash, 'Alice Buyer',
        'bob@demo.com', passwordHash, 'Bob User',
      ]
    );
    const userId1 = userRes.insertId;
    const userId2 = userId1 + 1;
    const userId3 = userId1 + 2;

    //  console.log('Seeding categories...');
    await conn.execute(
      `INSERT INTO categories (name, slug, description, sort_order) VALUES
       ('Software', 'software', 'Desktop and web applications', 1),
       ('eBooks & Guides', 'ebooks-guides', 'Digital books and guides', 2),
       ('Templates', 'templates', 'Design and document templates', 3),
       ('Digital Services', 'digital-services', 'One-time or subscription services', 4)`
    );
    const [catRows] = await conn.execute('SELECT id FROM categories ORDER BY id');
    const catIds = catRows.map((r) => r.id);

    //  console.log('Seeding products...');
    await conn.execute(
      `INSERT INTO products (category_id, name, slug, description, product_type, price, compare_at_price, is_active, is_featured) VALUES
       (?, 'Starter Template Pack', 'starter-template-pack', '10 responsive HTML/CSS templates for landing pages and portfolios.', 'downloadable', 29.00, 39.00, 1, 1),
       (?, 'Pro License Key', 'pro-license-key', 'Single-seat license for Pro Editor software. Key delivered after payment.', 'license_key', 79.00, NULL, 1, 1),
       (?, 'Design Masterclass eBook', 'design-masterclass-ebook', 'Complete guide to UI/UX design. PDF + EPUB.', 'downloadable', 19.00, 24.00, 1, 0),
       (?, 'Monthly Coaching Call', 'monthly-coaching-call', 'One 60-minute 1:1 coaching session. We will contact you to schedule.', 'digital_service', 99.00, NULL, 1, 1),
       (?, 'Premium Support Subscription', 'premium-support-subscription', '3 months of priority email support and early access to updates.', 'subscription_manual', 49.00, NULL, 1, 0)`,
      [catIds[2], catIds[0], catIds[1], catIds[3], catIds[3]]
    );
    const [prodRows] = await conn.execute('SELECT id, product_type FROM products ORDER BY id');
    const prodIds = prodRows.map((r) => r.id);

    //  console.log('Seeding product images...');
    for (let i = 0; i < prodIds.length; i++) {
      await conn.execute(
        `INSERT INTO product_images (product_id, path, alt_text, sort_order) VALUES (?, ?, ?, 0)`,
        [prodIds[i], `products/images/seed-${prodIds[i]}.png`, `Product ${prodIds[i]}`]
      );
    }

    //  console.log('Seeding product files (downloadable products)...');
    await conn.execute(
      `INSERT INTO product_files (product_id, file_path, file_name, file_size, download_limit, sort_order) VALUES
       (?, 'products/files/starter-templates.zip', 'Starter Template Pack.zip', 2500000, NULL, 0),
       (?, 'products/files/design-masterclass.pdf', 'Design Masterclass.pdf', 5200000, NULL, 0),
       (?, 'products/files/design-masterclass.epub', 'Design Masterclass.epub', 3100000, NULL, 1)`,
      [prodIds[0], prodIds[2], prodIds[2]]
    );

    //  console.log('Seeding license keys (for Pro License Key product)...');
    const licenseProductId = prodIds[1];
    await conn.execute(
      `INSERT INTO product_license_pools (product_id, license_key) VALUES
       (?, 'DEMO-XXXX-YYYY-001'), (?, 'DEMO-XXXX-YYYY-002'), (?, 'DEMO-XXXX-YYYY-003')`,
      [licenseProductId, licenseProductId, licenseProductId]
    );

    //  console.log('Seeding coupons...');
    await conn.execute(
      `INSERT INTO coupons (code, type, value, min_order_amount, max_uses, valid_from, valid_until, is_active) VALUES
       ('WELCOME10', 'percentage', 10.00, 20.00, 100, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 1),
       ('SAVE5', 'fixed_amount', 5.00, 30.00, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 1)`
    );

    //  console.log('Seeding orders and order items...');
    await conn.execute(
      `INSERT INTO orders (user_id, order_number, status, subtotal, discount, tax, total, currency) VALUES
       (?, 'ORD-DEMO-001', 'paid', 48.00, 0.00, 0.00, 48.00, 'BDT'),
       (?, 'ORD-DEMO-002', 'pending', 79.00, 0.00, 0.00, 79.00, 'BDT')`,
      [userId1, userId2]
    );
    const [orderRows] = await conn.execute('SELECT id FROM orders ORDER BY id');
    const orderId1 = orderRows[0].id;
    const orderId2 = orderRows[1].id;

    const [fileRows] = await conn.execute('SELECT id, product_id FROM product_files ORDER BY id');
    const fileId1 = fileRows[0].id;
    const fileId2 = fileRows[1].id;

    await conn.execute(
      `INSERT INTO order_items (order_id, product_id, product_name, product_type, quantity, unit_price, total_price) VALUES
       (?, ?, 'Starter Template Pack', 'downloadable', 1, 29.00, 29.00),
       (?, ?, 'Design Masterclass eBook', 'downloadable', 1, 19.00, 19.00)`,
      [orderId1, prodIds[0], orderId1, prodIds[2]]
    );
    const [oiRows] = await conn.execute('SELECT id, product_id, product_type FROM order_items WHERE order_id = ? ORDER BY id', [orderId1]);
    const oi1 = oiRows[0].id;
    const oi2 = oiRows[1].id;

    await conn.execute(
      `INSERT INTO order_items (order_id, product_id, product_name, product_type, quantity, unit_price, total_price) VALUES
       (?, ?, 'Pro License Key', 'license_key', 1, 79.00, 79.00)`,
      [orderId2, prodIds[1]]
    );
    const [oi2Rows] = await conn.execute('SELECT id FROM order_items WHERE order_id = ?', [orderId2]);
    const oiLicense = oi2Rows[0].id;

    await conn.execute(
      `INSERT INTO payments (order_id, amount, currency, status, gateway) VALUES (?, 48.00, 'BDT', 'completed', 'manual')`,
      [orderId1]
    );

    await conn.execute(
      `INSERT INTO deliveries (order_id, status, delivered_at) VALUES (?, 'delivered', NOW())`,
      [orderId1]
    );

    await conn.execute(
      `INSERT INTO download_entitlements (order_item_id, product_file_id) VALUES (?, ?), (?, ?), (?, ?)`,
      [oi1, fileId1, oi2, fileId2, oi2, fileRows[2].id]
    );

    const [poolRows] = await conn.execute(
      'SELECT id FROM product_license_pools WHERE product_id = ? AND used_at IS NULL LIMIT 1',
      [licenseProductId]
    );
    if (poolRows.length) {
      await conn.execute(
        'UPDATE product_license_pools SET used_at = NOW(), order_item_id = ? WHERE id = ?',
        [oiLicense, poolRows[0].id]
      );
    }

    //  console.log('Seeding reviews...');
    await conn.execute(
      `INSERT INTO reviews (product_id, user_id, order_id, rating, title, body, status) VALUES
       (?, ?, ?, 5, 'Exactly what I needed', 'Clean templates, easy to customize. Great value.', 'approved'),
       (?, ?, NULL, 4, 'Solid content', 'Well written and practical. Recommended.', 'approved')`,
      [prodIds[0], userId1, orderId1, prodIds[2], userId2]
    );

    //  console.log('Seeding support ticket...');
    await conn.execute(
      `INSERT INTO tickets (user_id, order_id, subject, status) VALUES (?, ?, 'Question about my order', 'answered')`,
      [userId1, orderId1]
    );
    const [ticketRows] = await conn.execute('SELECT id FROM tickets ORDER BY id DESC LIMIT 1');
    const ticketId = ticketRows[0].id;
    const [adminRows] = await conn.execute('SELECT id FROM admins LIMIT 1');
    const adminId = adminRows[0].id;
    await conn.execute(
      `INSERT INTO ticket_messages (ticket_id, sender_type, user_id, admin_id, message) VALUES
       (?, 'user', ?, NULL, 'When will I get the download link?'),
       (?, 'admin', NULL, ?, 'Your order has been delivered. You can download the files from your dashboard under Orders.')`,
      [ticketId, userId1, ticketId, adminId]
    );

    //  console.log('Demo data seeded successfully.');
    //  console.log('  Admin:  admin@demo.com / ' + DEMO_PASSWORD);
    //  console.log('  Customer: customer@demo.com / ' + DEMO_PASSWORD);
  } finally {
    if (conn) await conn.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message || err);
  process.exit(1);
});
