"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combinationSignature = combinationSignature;
exports.parseCombination = parseCombination;
/** Stable string for unique variation rows (sorted attr_key=value_key pairs). */
function combinationSignature(combo) {
    const keys = Object.keys(combo).sort();
    return keys.map((k) => `${k}=${combo[k]}`).join('|');
}
function parseCombination(raw) {
    let obj = {};
    if (raw == null)
        return {};
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                obj = parsed;
            }
            else {
                return {};
            }
        }
        catch {
            return {};
        }
    }
    else if (typeof raw === 'object' && !Array.isArray(raw)) {
        obj = raw;
    }
    else {
        return {};
    }
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v == null)
            continue;
        const s = typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : '';
        if (s.length > 0)
            out[k] = s;
    }
    return out;
}
//# sourceMappingURL=combinationSignature.js.map