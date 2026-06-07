/** Stable string for unique variation rows (sorted attr_key=value_key pairs). */
export function combinationSignature(combo: Record<string, string>): string {
  const keys = Object.keys(combo).sort();
  return keys.map((k) => `${k}=${combo[k]}`).join('|');
}

export function parseCombination(raw: unknown): Record<string, string> {
  let obj: Record<string, unknown> = {};
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        obj = parsed as Record<string, unknown>;
      } else {
        return {};
      }
    } catch {
      return {};
    }
  } else if (typeof raw === 'object' && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>;
  } else {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const s = typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : '';
    if (s.length > 0) out[k] = s;
  }
  return out;
}
