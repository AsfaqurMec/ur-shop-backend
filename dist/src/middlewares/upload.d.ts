export declare const uploadProductImage: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadProductImages: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadProductFile: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadPaymentProof: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/** One optional customer-review photo, sent in the multipart field named `image`. */
export declare const uploadReviewImage: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/** Relative path from upload base for storage in DB */
export declare function getProductImageRelativePath(filename: string): string;
export declare function getProductFileRelativePath(filename: string): string;
export declare function getPaymentProofRelativePath(filename: string): string;
/** Absolute path for a product file from DB file_path (relative to upload base). */
export declare function getProductFileAbsolutePath(relativePath: string): string;
/** Absolute path for a payment proof file from DB file_path (relative to upload base). */
export declare function getPaymentProofAbsolutePath(relativePath: string): string;
export declare const uploadTicketAttachment: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadSettingsLogo: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadBannerImage: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/** Relative path for ticket attachment (store in DB). */
export declare function getTicketAttachmentRelativePath(filename: string): string;
/** Absolute path for ticket attachment (stream download). */
export declare function getTicketAttachmentAbsolutePath(relativePath: string): string;
/** Relative path for settings logo (store in DB). */
export declare function getSettingsLogoRelativePath(filename: string): string;
export declare function getBannerImageRelativePath(filename: string): string;
export declare function getReviewImageRelativePath(filename: string): string;
export declare const uploadCategoryImages: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/** @deprecated use uploadCategoryImages */
export declare const uploadCategoryImage: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare function getCategoryImageRelativePath(filename: string): string;
export declare function getCategoryBannerRelativePath(filename: string): string;
//# sourceMappingURL=upload.d.ts.map