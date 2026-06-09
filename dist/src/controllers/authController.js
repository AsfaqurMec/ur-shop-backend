"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.refresh = refresh;
exports.verifyEmail = verifyEmail;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
const config_1 = require("../config");
const apiResponse_1 = require("../utils/apiResponse");
const authService = __importStar(require("../services/authService"));
function pickVerificationBaseUrl(req) {
    const fromBody = typeof req.body?.verificationBaseUrl === 'string' ? req.body.verificationBaseUrl.trim() : '';
    const fromQuery = typeof req.query?.verificationBaseUrl === 'string' ? req.query.verificationBaseUrl.trim() : '';
    if (fromBody)
        return fromBody.replace(/\/$/, '');
    if (fromQuery)
        return fromQuery.replace(/\/$/, '');
    if (config_1.env.frontendUrl)
        return `${config_1.env.frontendUrl}/verify-email`;
    return undefined;
}
function pickResetBaseUrl(req) {
    const fromBody = typeof req.body?.resetBaseUrl === 'string' ? req.body.resetBaseUrl.trim() : '';
    const fromQuery = typeof req.query?.resetBaseUrl === 'string' ? req.query.resetBaseUrl.trim() : '';
    if (fromBody)
        return fromBody.replace(/\/$/, '');
    if (fromQuery)
        return fromQuery.replace(/\/$/, '');
    if (config_1.env.frontendUrl)
        return `${config_1.env.frontendUrl}/reset-password`;
    return undefined;
}
async function register(req, res) {
    const { email, password, name } = req.body;
    const verificationBaseUrl = pickVerificationBaseUrl(req);
    const result = await authService.register(email, password, name ?? '', verificationBaseUrl);
    return (0, apiResponse_1.sendSuccess)(res, result, 201, result.message);
}
async function login(req, res) {
    const { email, password } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
    const userAgent = req.headers['user-agent'] ?? null;
    const result = await authService.login(email, password, ip, userAgent);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function logout(req, res) {
    const sessionId = req.user?.sessionId;
    const role = req.user?.role ?? 'user';
    if (sessionId) {
        await authService.logout(sessionId, role);
    }
    return (0, apiResponse_1.sendSuccess)(res, { message: 'Logged out successfully' });
}
async function refresh(req, res) {
    const { refreshToken } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
    const userAgent = req.headers['user-agent'] ?? null;
    const result = await authService.refresh(refreshToken, ip, userAgent);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function verifyEmail(req, res) {
    const raw = req.body.token ?? req.query.token;
    const token = (typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '').trim();
    const result = await authService.verifyEmail(token);
    return (0, apiResponse_1.sendSuccess)(res, result, 200, 'Email verified successfully');
}
async function forgotPassword(req, res) {
    const { email } = req.body;
    const resetBaseUrl = pickResetBaseUrl(req);
    const result = await authService.forgotPassword(email, resetBaseUrl);
    return (0, apiResponse_1.sendSuccess)(res, result, 200, result.message);
}
async function resetPassword(req, res) {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    return (0, apiResponse_1.sendSuccess)(res, result, 200, result.message);
}
async function getProfile(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const user = await authService.getProfile(req.user.id, req.user.role);
    return (0, apiResponse_1.sendSuccess)(res, { user });
}
async function updateProfile(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const { name } = req.body;
    const user = await authService.updateProfileName(req.user.id, req.user.role, name);
    return (0, apiResponse_1.sendSuccess)(res, { user }, 200, 'Profile updated');
}
//# sourceMappingURL=authController.js.map