import type { OrderStatus } from './order';

/** Order list item for dashboard. */
export interface DashboardOrderListItem {
  id: number;
  order_number: string;
  status: OrderStatus;
  total: number;
  currency: string;
  created_at: string;
}

/** Order detail for dashboard (order + items + payment + delivery). */
export interface DashboardOrderDetail {
  id: number;
  order_number: string;
  status: OrderStatus;
  payment_status?: string | null;
  subtotal: number;
  discount: number;
  coupon_code?: string | null;
  coupon_name?: string | null;
  tax: number;
  total: number;
  currency: string;
  shipping_mobile: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_address_line2: string | null;
  shipping_method_id: string | null;
  shipping_method_title: string | null;
  shipping_fee: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_mobile: string | null;
  customer_address: string | null;
  items: DashboardOrderDetailItem[];
  payment: DashboardOrderPayment | null;
  delivery: DashboardOrderDelivery | null;
  created_at: string;
}

export interface DashboardOrderDetailItem {
  id: number;
  product_id: number;
  sku?: string | null;
  product_name: string;
  product_type: string;
  /** Primary product image path (same shape as storefront), or null if none. */
  product_thumbnail: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchase_selections_summary?: Array<{ label: string; value: string }> | null;
}

export interface DashboardOrderPayment {
  id: number;
  gateway: string;
  status: string;
  amount: number;
  currency: string;
}

export interface DashboardOrderDelivery {
  status: string;
  delivered_at: string | null;
}

/** License assigned to user (from order). */
export interface DashboardLicenseItem {
  id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  product_name: string;
  license_key: string;
  assigned_at: string;
}

/** Subscription (from subscriptions table). */
export interface DashboardSubscriptionItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  /** Storefront slug for renew deep link. */
  product_slug: string;
  /** Original purchase variation (for preselect on product page). */
  product_variation_id: number | null;
  status: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export interface DashboardPendingSubscriptionItem {
  queue_id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_variation_id: number | null;
  status: 'pending_activation';
  due_at: string | null;
  created_at: string;
}

/** Single delivered item for unified "my delivered" list. */
export interface DashboardDeliveredItem {
  type: 'download' | 'license' | 'subscription' | 'fulfillment';
  order_id: number;
  order_number: string;
  product_id: number;
  product_name: string;
  product_type: string;
  /** For download: file name. For license: masked key. For subscription: period end. For fulfillment: notes. */
  detail: string | null;
  created_at: string;
}

/** Dashboard summary counts. */
export interface DashboardSummary {
  orders_total: number;
  orders_pending: number;
  orders_paid: number;
  downloads_count: number;
  licenses_count: number;
  subscriptions_count: number;
  delivered_count: number;
}
