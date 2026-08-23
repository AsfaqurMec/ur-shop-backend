export type OrderStatus = 'pending' | 'placed' | 'delivered' | 'complete' | 'completed' | 'cancelled' | 'refunded' | 'processing' | 'paid' | 'unpaid';
export type OrderItemProductType = 'downloadable' | 'license_key' | 'subscription_manual' | 'digital_service';

export interface OrderRow {
  id: number;
  user_id: number;
  order_number: string;
  status: OrderStatus;
  payment_status?: 'paid' | 'unpaid';
  subtotal: number;
  discount: number;
  coupon_code?: string | null;
  coupon_name?: string | null;
  tax: number;
  total: number;
  currency: string;
  shipping_name?: string | null;
  shipping_mobile: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_address_line2: string | null;
  shipping_method_id: string | null;
  shipping_method_title: string | null;
  shipping_fee: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number;
  product_variation_id: number | null;
  sku?: string | null;
  product_name: string;
  product_type: OrderItemProductType;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchase_selections: Record<string, string> | null;
  purchase_selections_summary: Array<{ label: string; value: string }> | null;
  created_at: Date;
}

export interface OrderItemPublic {
  id: number;
  product_id: number;
  sku?: string | null;
  product_name: string;
  product_type: OrderItemProductType;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchase_selections?: Record<string, string> | null;
  purchase_selections_summary?: Array<{ label: string; value: string }> | null;
}

export interface OrderPublic {
  id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  coupon_code?: string | null;
  coupon_name?: string | null;
  tax: number;
  total: number;
  currency: string;
  shipping_name?: string | null;
  items: OrderItemPublic[];
  payment?: { id: number; gateway: string; status: string; amount: number };
  created_at: string;
  /** Present only when checkout created a bKash redirect URL. */
  bkash_checkout_url?: string | null;
}

export interface PaymentRow {
  id: number;
  order_id: number;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  /** When set, bKash API credentials are resolved from this payment option row (merged with env). */
  payment_option_id: number | null;
  gateway_reference: string | null;
  bkash_payment_id: string | null;
  created_at: Date;
  updated_at: Date;
}
