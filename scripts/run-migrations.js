/**
 * MongoDB setup helper.
 *
 * Uses MONGODB_URL (or MONGO_URL) and optional MONGODB_DB / DB_NAME.
 * MongoDB creates collections on first write; this script verifies the connection
 * and creates common indexes used by the application.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const uri = (process.env.MONGODB_URL || process.env.MONGO_URL || '').trim();
const dbName = (process.env.MONGODB_DB || process.env.DB_NAME || 'ur_shop').trim();

async function main() {
  if (!uri) {
    throw new Error('Missing required env: MONGODB_URL');
  }

  await mongoose.connect(uri, { dbName });
  const db = mongoose.connection.db;

  await Promise.all([
    db.collection('counters').createIndex({ _id: 1 }, { unique: true }),
    db.collection('users').createIndex({ email: 1, deleted_at: 1 }),
    db.collection('admins').createIndex({ email: 1, deleted_at: 1 }),
    db.collection('categories').createIndex({ slug: 1, deleted_at: 1 }),
    db.collection('products').createIndex({ slug: 1, deleted_at: 1 }),
    db.collection('product_images').createIndex({ product_id: 1, sort_order: 1 }),
    db.collection('orders').createIndex({ user_id: 1, created_at: -1 }),
    db.collection('orders').createIndex({ status: 1, created_at: -1 }),
    db.collection('payments').createIndex({ order_id: 1, created_at: -1 }),
    db.collection('reviews').createIndex({ product_id: 1, deleted_at: 1, created_at: -1 }),
  ]);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('MongoDB setup failed:', err.message || err);
  process.exit(1);
});
