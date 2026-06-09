"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const config_1 = require("../config");
const pool = promise_1.default.createPool({
    host: config_1.env.db.host,
    port: config_1.env.db.port,
    user: config_1.env.db.user,
    password: config_1.env.db.password,
    database: config_1.env.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});
exports.default = pool;
//# sourceMappingURL=pool.js.map