import mongoose from 'mongoose';
import { env } from '../config';
import {
  ProductModel,
  CategoryModel,
  BannerModel,
  ReviewModel,
  AdModel,
  OrderModel,
  UserModel,
  ProductVariationModel,
} from './models';

let connectionPromise: Promise<typeof mongoose> | null = null;

export function isMongoConfigured(): boolean {
  return Boolean(env.db.uri);
}

export async function ensureOptimizedIndexes(): Promise<void> {
  try {
    await Promise.allSettled([
      ProductModel.collection.createIndex({ deleted_at: 1, is_active: 1, is_featured: 1 }),
      ProductModel.collection.createIndex({ deleted_at: 1, is_active: 1, is_trending: 1 }),
      ProductModel.collection.createIndex({ deleted_at: 1, category_id: 1, is_active: 1 }),
      ProductModel.collection.createIndex({ slug: 1 }),
      ProductModel.collection.createIndex({ sku: 1 }),
      CategoryModel.collection.createIndex({ deleted_at: 1, sort_order: 1 }),
      CategoryModel.collection.createIndex({ slug: 1 }),
      BannerModel.collection.createIndex({ deleted_at: 1, is_active: 1, sort_order: 1 }),
      ReviewModel.collection.createIndex({ deleted_at: 1, is_approved: 1, product_id: 1 }),
      AdModel.collection.createIndex({ deleted_at: 1, is_active: 1 }),
      OrderModel.collection.createIndex({ user_id: 1, created_at: -1 }),
      OrderModel.collection.createIndex({ status: 1 }),
      OrderModel.collection.createIndex({ payment_status: 1 }),
      UserModel.collection.createIndex({ email: 1 }),
      ProductVariationModel.collection.createIndex({ product_id: 1 }),
    ]);
  } catch (err) {
    console.warn('[mongo] ensureOptimizedIndexes non-blocking notice:', err);
  }
}

export async function connectMongo(): Promise<typeof mongoose> {
  if (!env.db.uri) {
    throw new Error('Missing required env: MONGODB_URL');
  }
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.db.uri, {
        dbName: env.db.database || undefined,
        autoIndex: true,
      })
      .then((m) => {
        void ensureOptimizedIndexes();
        return m;
      });
  }
  return connectionPromise;
}

export async function disconnectMongo(): Promise<void> {
  connectionPromise = null;
  await mongoose.disconnect();
}

export default mongoose;
