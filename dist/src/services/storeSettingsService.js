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
exports.getStoreSettings = getStoreSettings;
exports.updateStoreSettings = updateStoreSettings;
exports.getPublicStoreSettings = getPublicStoreSettings;
exports.getStoreSettingsSnapshot = getStoreSettingsSnapshot;
const config_1 = require("../config");
const repo = __importStar(require("../repositories/storeSettingsRepository"));
const CURRENCIES = new Set(['BDT', 'USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']);
const TIMEZONES = new Set([
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Australia/Sydney',
]);
function isHttpUrl(s) {
    try {
        const u = new URL(s);
        return u.protocol === 'https:' || u.protocol === 'http:';
    }
    catch {
        return false;
    }
}
function normalizeHttpUrl(input) {
    if (typeof input !== 'string')
        return '';
    const trimmed = input.trim();
    if (!trimmed)
        return '';
    if (isHttpUrl(trimmed))
        return trimmed;
    const withProtocol = `https://${trimmed.replace(/^\/+/, '')}`;
    return isHttpUrl(withProtocol) ? withProtocol : '';
}
function normalizeAccentColor(input) {
    if (typeof input !== 'string')
        return undefined;
    const s = input.trim();
    if (/^#[0-9A-Fa-f]{3}$/.test(s) || /^#[0-9A-Fa-f]{6}$/.test(s))
        return s;
    return undefined;
}
function normalizeSocialLinks(input) {
    if (!Array.isArray(input))
        return [];
    const out = [];
    for (const raw of input.slice(0, 30)) {
        if (!raw || typeof raw !== 'object')
            continue;
        const r = raw;
        const id = typeof r.id === 'string' ? r.id.trim().slice(0, 64) : '';
        const label = typeof r.label === 'string' ? r.label.trim().slice(0, 80) : '';
        const logo = normalizeHttpUrl(r.logo).slice(0, 2048);
        const link = normalizeHttpUrl(r.link).slice(0, 2048);
        if (!id || !label || !logo || !link)
            continue;
        const accentColor = normalizeAccentColor(r.accentColor);
        out.push({ id, label, logo, link, ...(accentColor ? { accentColor } : {}) });
    }
    return out;
}
function defaults() {
    const name = config_1.env.store.name || 'Digital Store';
    const supportEmail = config_1.env.store.supportEmail || '';
    return {
        siteTitle: name,
        siteLogo: '',
        emailHeaderLogo: '',
        emailHeaderSlogan: config_1.env.store.tagline || '',
        emailHeaderSubtitle: '',
        emailFooterSupportEmail: supportEmail,
        emailFooterSupportNumber: '',
        storeName: name,
        contactEmail: supportEmail,
        address: '',
        currency: 'BDT',
        timezone: 'UTC',
        socialLinks: [],
    };
}
let cachedSettings = defaults();
function cleanString(input, maxLen = 5000) {
    if (typeof input !== 'string')
        return '';
    return input.trim().slice(0, maxLen);
}
function normalizeSettings(input) {
    const base = defaults();
    const merged = { ...base, ...(input ?? {}) };
    const currency = CURRENCIES.has(merged.currency) ? merged.currency : base.currency;
    const timezone = TIMEZONES.has(merged.timezone) ? merged.timezone : base.timezone;
    return {
        siteTitle: cleanString(merged.siteTitle, 255) || base.siteTitle,
        siteLogo: cleanString(merged.siteLogo, 2_000_000),
        emailHeaderLogo: cleanString(merged.emailHeaderLogo, 2_000_000),
        emailHeaderSlogan: cleanString(merged.emailHeaderSlogan, 255),
        emailHeaderSubtitle: cleanString(merged.emailHeaderSubtitle, 255),
        emailFooterSupportEmail: cleanString(merged.emailFooterSupportEmail, 255),
        emailFooterSupportNumber: cleanString(merged.emailFooterSupportNumber, 100),
        storeName: cleanString(merged.storeName, 255) || base.storeName,
        contactEmail: cleanString(merged.contactEmail, 255),
        address: cleanString(merged.address, 1000),
        currency,
        timezone,
        socialLinks: normalizeSocialLinks(merged.socialLinks),
    };
}
async function getStoreSettings() {
    try {
        const raw = await repo.getStoreSettingsRaw();
        if (!raw) {
            cachedSettings = defaults();
            return cachedSettings;
        }
        const parsed = JSON.parse(raw);
        cachedSettings = normalizeSettings(parsed);
        return cachedSettings;
    }
    catch {
        // DB/network/read failure: keep last known settings in memory so UI/email can still render.
        // If cache is empty (fresh boot), fall back to env defaults.
        if (!cachedSettings || !cachedSettings.siteTitle) {
            cachedSettings = defaults();
        }
        return cachedSettings;
    }
}
async function updateStoreSettings(patch) {
    const current = await getStoreSettings();
    const next = normalizeSettings({ ...current, ...patch });
    await repo.upsertStoreSettingsRaw(JSON.stringify(next));
    cachedSettings = next;
    return next;
}
async function getPublicStoreSettings() {
    const settings = await getStoreSettings();
    return {
        siteTitle: settings.siteTitle,
        siteLogo: settings.siteLogo,
        emailHeaderLogo: settings.emailHeaderLogo,
        emailHeaderSlogan: settings.emailHeaderSlogan,
        emailHeaderSubtitle: settings.emailHeaderSubtitle,
        emailFooterSupportEmail: settings.emailFooterSupportEmail,
        emailFooterSupportNumber: settings.emailFooterSupportNumber,
        socialLinks: settings.socialLinks,
    };
}
function getStoreSettingsSnapshot() {
    return cachedSettings;
}
//# sourceMappingURL=storeSettingsService.js.map