"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCookieOptions = getCookieOptions;
exports.setAuthCookies = setAuthCookies;
exports.clearAuthCookies = clearAuthCookies;
const config_1 = require("../config");
function getCookieOptions(maxAgeMs) {
    const isProd = config_1.env.nodeEnv === 'production';
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? 'none' : 'lax'),
        path: '/',
        ...(maxAgeMs != null ? { maxAge: maxAgeMs } : {}),
    };
}
function setAuthCookies(res, accessToken, refreshToken) {
    const expiryDays = config_1.env.jwt.sessionExpiryDays || 15;
    const maxAgeMs = expiryDays * 24 * 60 * 60 * 1000;
    res.cookie('auth_token', accessToken, getCookieOptions(maxAgeMs));
    if (refreshToken) {
        res.cookie('refresh_token', refreshToken, getCookieOptions(maxAgeMs));
    }
}
function clearAuthCookies(res) {
    const isProd = config_1.env.nodeEnv === 'production';
    const sameSiteMode = (isProd ? 'none' : 'lax');
    const clearOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: sameSiteMode,
        path: '/',
        maxAge: 0,
        expires: new Date(0),
    };
    res.cookie('auth_token', '', clearOptions);
    res.cookie('refresh_token', '', clearOptions);
    res.clearCookie('auth_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
}
//# sourceMappingURL=cookieHelpers.js.map