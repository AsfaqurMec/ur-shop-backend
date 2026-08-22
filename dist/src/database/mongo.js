"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMongoConfigured = isMongoConfigured;
exports.ensureOptimizedIndexes = ensureOptimizedIndexes;
exports.connectMongo = connectMongo;
exports.disconnectMongo = disconnectMongo;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
const models_1 = require("./models");
let connectionPromise = null;
function isMongoConfigured() {
    return Boolean(config_1.env.db.uri);
}
async function ensureOptimizedIndexes() {
    try {
        await Promise.allSettled([
            models_1.ProductModel.collection.createIndex({ deleted_at: 1, is_active: 1, is_featured: 1 }),
            models_1.ProductModel.collection.createIndex({ deleted_at: 1, is_active: 1, is_trending: 1 }),
            models_1.ProductModel.collection.createIndex({ deleted_at: 1, category_id: 1, is_active: 1 }),
            models_1.ProductModel.collection.createIndex({ slug: 1 }),
            models_1.ProductModel.collection.createIndex({ sku: 1 }),
            models_1.CategoryModel.collection.createIndex({ deleted_at: 1, sort_order: 1 }),
            models_1.CategoryModel.collection.createIndex({ slug: 1 }),
            models_1.BannerModel.collection.createIndex({ deleted_at: 1, is_active: 1, sort_order: 1 }),
            models_1.ReviewModel.collection.createIndex({ deleted_at: 1, is_approved: 1, product_id: 1 }),
            models_1.AdModel.collection.createIndex({ deleted_at: 1, is_active: 1 }),
            models_1.OrderModel.collection.createIndex({ user_id: 1, created_at: -1 }),
            models_1.OrderModel.collection.createIndex({ status: 1 }),
            models_1.OrderModel.collection.createIndex({ payment_status: 1 }),
            models_1.UserModel.collection.createIndex({ email: 1 }),
            models_1.ProductVariationModel.collection.createIndex({ product_id: 1 }),
        ]);
    }
    catch (err) {
        console.warn('[mongo] ensureOptimizedIndexes non-blocking notice:', err);
    }
}
async function connectMongo() {
    if (!config_1.env.db.uri) {
        throw new Error('Missing required env: MONGODB_URL');
    }
    if (mongoose_1.default.connection.readyState === 1)
        return mongoose_1.default;
    if (!connectionPromise) {
        connectionPromise = mongoose_1.default
            .connect(config_1.env.db.uri, {
            dbName: config_1.env.db.database || undefined,
            autoIndex: true,
        })
            .then((m) => {
            void ensureOptimizedIndexes();
            return m;
        });
    }
    return connectionPromise;
}
async function disconnectMongo() {
    connectionPromise = null;
    await mongoose_1.default.disconnect();
}
exports.default = mongoose_1.default;
//# sourceMappingURL=mongo.js.map