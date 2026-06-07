import { env } from '../config';
import * as repo from '../repositories/storeSettingsRepository';
import type { SocialLink, StoreSettings } from '../types/storeSettings';

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

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function normalizeHttpUrl(input: unknown): string {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (isHttpUrl(trimmed)) return trimmed;
  const withProtocol = `https://${trimmed.replace(/^\/+/, '')}`;
  return isHttpUrl(withProtocol) ? withProtocol : '';
}

function normalizeAccentColor(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const s = input.trim();
  if (/^#[0-9A-Fa-f]{3}$/.test(s) || /^#[0-9A-Fa-f]{6}$/.test(s)) return s;
  return undefined;
}

function normalizeSocialLinks(input: unknown): SocialLink[] {
  if (!Array.isArray(input)) return [];
  const out: SocialLink[] = [];
  for (const raw of input.slice(0, 30)) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const id = typeof r.id === 'string' ? r.id.trim().slice(0, 64) : '';
    const label = typeof r.label === 'string' ? r.label.trim().slice(0, 80) : '';
    const logo = normalizeHttpUrl(r.logo).slice(0, 2048);
    const link = normalizeHttpUrl(r.link).slice(0, 2048);
    if (!id || !label || !logo || !link) continue;
    const accentColor = normalizeAccentColor(r.accentColor);
    out.push({ id, label, logo, link, ...(accentColor ? { accentColor } : {}) });
  }
  return out;
}

function defaults(): StoreSettings {
  const name = env.store.name || 'Digital Store';
  const supportEmail = env.store.supportEmail || '';
  return {
    siteTitle: name,
    siteLogo: '',
    emailHeaderLogo: '',
    emailHeaderSlogan: env.store.tagline || '',
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

let cachedSettings: StoreSettings = defaults();

function cleanString(input: unknown, maxLen = 5000): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLen);
}

function normalizeSettings(input?: Partial<StoreSettings> | null): StoreSettings {
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

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const raw = await repo.getStoreSettingsRaw();
    if (!raw) {
      cachedSettings = defaults();
      return cachedSettings;
    }
    const parsed = JSON.parse(raw) as Partial<StoreSettings>;
    cachedSettings = normalizeSettings(parsed);
    return cachedSettings;
  } catch {
    // DB/network/read failure: keep last known settings in memory so UI/email can still render.
    // If cache is empty (fresh boot), fall back to env defaults.
    if (!cachedSettings || !cachedSettings.siteTitle) {
      cachedSettings = defaults();
    }
    return cachedSettings;
  }
}

export async function updateStoreSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
  const current = await getStoreSettings();
  const next = normalizeSettings({ ...current, ...patch });
  await repo.upsertStoreSettingsRaw(JSON.stringify(next));
  cachedSettings = next;
  return next;
}

export async function getPublicStoreSettings(): Promise<
  Pick<
    StoreSettings,
    | 'siteTitle'
    | 'siteLogo'
    | 'emailHeaderLogo'
    | 'emailHeaderSlogan'
    | 'emailHeaderSubtitle'
    | 'emailFooterSupportEmail'
    | 'emailFooterSupportNumber'
    | 'socialLinks'
  >
> {
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

export function getStoreSettingsSnapshot(): StoreSettings {
  return cachedSettings;
}
