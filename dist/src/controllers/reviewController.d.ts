import { Request, Response } from 'express';
/** Customer: submit review for a purchased product. */
export declare function submitReview(req: Request, res: Response): Promise<Response>;
/** Customer: update own review. */
export declare function updateReview(req: Request, res: Response): Promise<Response>;
/** Admin: add an imported/manual testimonial, with an optional review photo. */
export declare function createAdminReview(req: Request, res: Response): Promise<Response>;
/** Admin: edit a review's displayed content, optionally replacing its photo. */
export declare function updateAdminReview(req: Request, res: Response): Promise<Response>;
/** Public: list reviews for a product (not hidden). */
export declare function listByProduct(req: Request, res: Response): Promise<Response>;
/** Public: newest published reviews across all products, used by the homepage slider. */
export declare function listAllPublic(req: Request, res: Response): Promise<Response>;
/** Admin: list all reviews for a product (pending, approved, hidden). */
export declare function listByProductAdmin(req: Request, res: Response): Promise<Response>;
/** Admin: paginated list of all reviews, optional category filter. */
export declare function listAllAdmin(req: Request, res: Response): Promise<Response>;
/** Customer: get own review detail (e.g. to edit). Admin can use admin get. */
export declare function getReviewDetail(req: Request, res: Response): Promise<Response>;
/** Admin: hide or unhide a review. */
export declare function setHidden(req: Request, res: Response): Promise<Response>;
/** Admin: get any review detail. */
export declare function getReviewDetailAdmin(req: Request, res: Response): Promise<Response>;
//# sourceMappingURL=reviewController.d.ts.map