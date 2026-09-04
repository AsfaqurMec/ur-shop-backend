"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCookieOptions = getCookieOptions;
exports.setAuthCookies = setAuthCookies;
exports.clearAuthCookies = clearAuthCookies;
const config_1 = require("../config");
function getCookieOptions(maxAgeMs) {
    const isProd = config_1.env.nodeEnv === 'production';
    const customSameSite = process.env.COOKIE_SAMESITE;
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: (customSameSite || (isProd ? 'lax' : 'lax')),
        path: '/',
        ...(maxAgeMs != null ? { maxAge: maxAgeMs } : {}),
    };
}
function setAuthCookies(res, accessToken, refreshToken) {
    // Short-lived access token cookie (15 minutes)
    const accessMaxAgeMs = 15 * 60 * 1000;
    res.cookie('auth_token', accessToken, getCookieOptions(accessMaxAgeMs));
    // Long-lived refresh token cookie (default 7 days)
    if (refreshToken) {
        const expiryDays = config_1.env.jwt.sessionExpiryDays || 7;
        const refreshMaxAgeMs = expiryDays * 24 * 60 * 60 * 1000;
        res.cookie('refresh_token', refreshToken, getCookieOptions(refreshMaxAgeMs));
    }
}
function clearAuthCookies(res) {
    const clearOptions = {
        ...getCookieOptions(0),
        expires: new Date(0),
    };
    res.cookie('auth_token', '', clearOptions);
    res.cookie('refresh_token', '', clearOptions);
    res.clearCookie('auth_token', clearOptions);
    res.clearCookie('refresh_token', clearOptions);
}
//# sourceMappingURL=cookieHelpers.js.map