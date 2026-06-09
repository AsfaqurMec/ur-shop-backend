/**
 * Base HTML layout for all transactional emails (shared header & footer).
 */
/** Shown only under 600px width when line-item tables stack (no inline display — would block media queries). */
export declare function mobileFieldLabel(text: string): string;
export declare function getStoreName(): string;
export declare function wrapHtml(title: string, bodyHtml: string): string;
export declare function escapeHtml(s: string): string;
export declare function link(url: string, text?: string): string;
export declare function escapeAttr(s: string): string;
export declare function paragraph(html: string): string;
//# sourceMappingURL=layout.d.ts.map