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
exports.submitReview = submitReview;
exports.updateReview = updateReview;
exports.createAdminReview = createAdminReview;
exports.updateAdminReview = updateAdminReview;
exports.listByProduct = listByProduct;
exports.listAllPublic = listAllPublic;
exports.listByProductAdmin = listByProductAdmin;
exports.listAllAdmin = listAllAdmin;
exports.getReviewDetail = getReviewDetail;
exports.setHidden = setHidden;
exports.getReviewDetailAdmin = getReviewDetailAdmin;
const apiResponse_1 = require("../utils/apiResponse");
const reviewService = __importStar(require("../services/reviewService"));
const cloudinaryService = __importStar(require("../services/cloudinaryService"));
const config_1 = require("../config");
const upload_1 = require("../middlewares/upload");
async function getUploadedImagePath(file) {
    if (!file)
        return null;
    return cloudinaryService.isCloudinaryConfigured()
        ? cloudinaryService.uploadImageBuffer(file, config_1.env.cloudinary.reviewFolder)
        : (0, upload_1.getReviewImageRelativePath)(file.filename);
}
/** Customer: submit review for a purchased product. */
async function submitReview(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const imagePath = await getUploadedImagePath(req.file);
    const productId = Number(req.params.productId);
    const rating = Number(req.body.rating);
    const title = req.body.title != null ? String(req.body.title).trim() : undefined;
    const body = req.body.body != null ? String(req.body.body).trim() : undefined;
    const review = await reviewService.submitReview(req.user.id, productId, {
        rating,
        title: title ?? null,
        body: body ?? null,
        image_path: imagePath,
    });
    return (0, apiResponse_1.sendSuccess)(res, review, 201, 'Review submitted');
}
/** Customer: update own review. */
async function updateReview(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const reviewId = Number(req.params.reviewId);
    const rating = req.body.rating != null ? Number(req.body.rating) : undefined;
    const title = req.body.title !== undefined ? (req.body.title === null ? null : String(req.body.title).trim()) : undefined;
    const body = req.body.body !== undefined ? (req.body.body === null ? null : String(req.body.body).trim()) : undefined;
    const imagePath = req.file ? await getUploadedImagePath(req.file) : undefined;
    const review = await reviewService.updateReview(req.user.id, reviewId, {
        rating,
        title,
        body,
        image_path: imagePath,
    });
    return (0, apiResponse_1.sendSuccess)(res, review, 200, 'Review updated');
}
/** Admin: add an imported/manual testimonial, with an optional review photo. */
async function createAdminReview(req, res) {
    const imagePath = await getUploadedImagePath(req.file);
    const review = await reviewService.createAdminReview({
        product_id: Number(req.body.product_id),
        reviewer_name: String(req.body.reviewer_name).trim(),
        rating: Number(req.body.rating),
        title: req.body.title != null ? String(req.body.title).trim() || null : null,
        body: req.body.body != null ? String(req.body.body).trim() || null : null,
        image_path: imagePath,
    });
    return (0, apiResponse_1.sendSuccess)(res, review, 201, 'Review created');
}
/** Admin: edit a review's displayed content, optionally replacing its photo. */
async function updateAdminReview(req, res) {
    const reviewId = Number(req.params.reviewId);
    const imagePath = req.file ? await getUploadedImagePath(req.file) : undefined;
    const review = await reviewService.updateAdminReview(reviewId, {
        reviewer_name: req.body.reviewer_name !== undefined ? String(req.body.reviewer_name).trim() : undefined,
        rating: req.body.rating !== undefined ? Number(req.body.rating) : undefined,
        title: req.body.title !== undefined ? String(req.body.title).trim() || null : undefined,
        body: req.body.body !== undefined ? String(req.body.body).trim() || null : undefined,
        image_path: imagePath,
    });
    return (0, apiResponse_1.sendSuccess)(res, review, 200, 'Review updated');
}
/** Public: list reviews for a product (not hidden). */
async function listByProduct(req, res) {
    const productId = Number(req.params.productId);
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
    const result = await reviewService.listByProduct(productId, { limit, offset });
    return (0, apiResponse_1.sendSuccess)(res, result);
}
/** Public: newest published reviews across all products, used by the homepage slider. */
async function listAllPublic(req, res) {
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
    const result = await reviewService.listAllPublic({ limit, offset });
    return (0, apiResponse_1.sendSuccess)(res, result);
}
/** Admin: list all reviews for a product (pending, approved, hidden). */
async function listByProductAdmin(req, res) {
    const productId = Number(req.params.productId);
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
    const result = await reviewService.listByProductAdmin(productId, { limit, offset });
    return (0, apiResponse_1.sendSuccess)(res, result);
}
/** Admin: paginated list of all reviews, optional category filter. */
async function listAllAdmin(req, res) {
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
    const categoryId = req.query.category_id !== undefined && req.query.category_id !== ''
        ? Number(req.query.category_id)
        : undefined;
    const result = await reviewService.listAllAdmin(categoryId, { limit, offset });
    return (0, apiResponse_1.sendSuccess)(res, result);
}
/** Customer: get own review detail (e.g. to edit). Admin can use admin get. */
async function getReviewDetail(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const reviewId = Number(req.params.reviewId);
    const review = await reviewService.getReviewDetail(reviewId, req.user.id, false);
    return (0, apiResponse_1.sendSuccess)(res, review);
}
/** Admin: hide or unhide a review. */
async function setHidden(req, res) {
    const reviewId = Number(req.params.reviewId);
    const hidden = req.body.hidden === true;
    const review = await reviewService.setReviewHidden(reviewId, hidden);
    return (0, apiResponse_1.sendSuccess)(res, review, 200, hidden ? 'Review hidden' : 'Review visible');
}
/** Admin: get any review detail. */
async function getReviewDetailAdmin(req, res) {
    const reviewId = Number(req.params.reviewId);
    const review = await reviewService.getReviewDetail(reviewId, undefined, true);
    return (0, apiResponse_1.sendSuccess)(res, review);
}
//# sourceMappingURL=reviewController.js.map