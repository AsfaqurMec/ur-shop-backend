export type ReviewStatus = 'pending' | 'approved';

export interface ReviewRow {
  id: number;
  product_id: number;
  user_id: number;
  order_id: number | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/** Public review (for product page list; not hidden). */
export interface ReviewPublic {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

/** Admin list row for a product (all statuses). */
export interface ReviewAdminListItem {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  is_hidden: boolean;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

/** Admin global table row (product + category context). */
export interface ReviewAdminTableRow extends ReviewAdminListItem {
  product_name: string;
  product_slug: string;
  category_id: number | null;
  category_name: string | null;
}

/** Review for owner or admin (includes status, hidden state). */
export interface ReviewDetailPublic {
  id: number;
  product_id: number;
  product_name: string;
  user_id: number;
  order_id: number | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  is_hidden: boolean;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}
