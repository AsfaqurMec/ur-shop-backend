"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_ADMIN = void 0;
exports.hashToken = hashToken;
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.getRefreshTokenExpiry = getRefreshTokenExpiry;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const ROLE_USER = 'user';
exports.ROLE_ADMIN = 'admin';
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
function generateAccessToken(payload, role = ROLE_USER) {
    return jsonwebtoken_1.default.sign({ ...payload, role }, config_1.env.jwt.secret, { expiresIn: config_1.env.jwt.accessExpiresIn });
}
function generateRefreshToken(payload, role = ROLE_USER) {
    return jsonwebtoken_1.default.sign({ ...payload, role }, config_1.env.jwt.secret, { expiresIn: config_1.env.jwt.refreshExpiresIn });
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, config_1.env.jwt.secret);
}
function getRefreshTokenExpiry() {
    const match = config_1.env.jwt.refreshExpiresIn.match(/^(\d+)([dm])$/);
    if (!match)
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7 days
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const ms = unit === 'd' ? value * 24 * 60 * 60 * 1000 : value * 60 * 1000;
    return new Date(Date.now() + ms);
}
//# sourceMappingURL=tokenHelpers.js.map