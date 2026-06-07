import mongoose from 'mongoose';
import { env } from '../config';

let connectionPromise: Promise<typeof mongoose> | null = null;

export function isMongoConfigured(): boolean {
  return Boolean(env.db.uri);
}

export async function connectMongo(): Promise<typeof mongoose> {
  if (!env.db.uri) {
    throw new Error('Missing required env: MONGODB_URL');
  }
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.db.uri, {
      dbName: env.db.database || undefined,
      autoIndex: true,
    });
  }
  return connectionPromise;
}

export async function disconnectMongo(): Promise<void> {
  connectionPromise = null;
  await mongoose.disconnect();
}

export default mongoose;
