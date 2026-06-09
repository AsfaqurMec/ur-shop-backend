"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMongoConfigured = isMongoConfigured;
exports.connectMongo = connectMongo;
exports.disconnectMongo = disconnectMongo;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
let connectionPromise = null;
function isMongoConfigured() {
    return Boolean(config_1.env.db.uri);
}
async function connectMongo() {
    if (!config_1.env.db.uri) {
        throw new Error('Missing required env: MONGODB_URL');
    }
    if (mongoose_1.default.connection.readyState === 1)
        return mongoose_1.default;
    if (!connectionPromise) {
        connectionPromise = mongoose_1.default.connect(config_1.env.db.uri, {
            dbName: config_1.env.db.database || undefined,
            autoIndex: true,
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