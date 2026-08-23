"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const apiResponse_1 = require("../utils/apiResponse");
function extractToken(req) {
    const cookieToken = req.cookies?.auth_token;
    if (cookieToken && typeof cookieToken === 'string' && cookieToken.trim()) {
        return cookieToken.trim();
    }
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }
    return null;
}
/**
 * Auth middleware: verifies JWT and attaches user to req.
 * Use on routes that require authentication.
 */
function auth(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        (0, apiResponse_1.sendError)(res, 'Unauthorized', 401, 'No token provided');
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.env.jwt.secret);
        req.userId = String(decoded.id);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            sessionId: decoded.sessionId,
        };
        next();
    }
    catch {
        (0, apiResponse_1.sendError)(res, 'Unauthorized', 401, 'Invalid or expired token');
    }
}
/**
 * Optional auth: attaches user if valid token present, does not reject if missing.
 */
function optionalAuth(req, _res, next) {
    const token = extractToken(req);
    if (!token) {
        next();
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.env.jwt.secret);
        req.userId = String(decoded.id);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            sessionId: decoded.sessionId,
        };
    }
    catch {
        // ignore invalid token
    }
    next();
}
//# sourceMappingURL=auth.js.map