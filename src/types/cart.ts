export interface CartRow {
  id: number;
  user_id: number | null;
  session_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CartItemRow {
  id: number;
  cart_id: number;
  product_id: number;
  variation_id: number | null;
  quantity: number;
  selections: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface CartItemPublic {
  id: number;
  product_id: number;
  product_variation_id: number | null;
  product_name: string;
  product_slug: string;
  product_type: string;
  product_thumbnail: string | null;
  quantity: number;
  /** Max quantity allowed for this line (variation stock, license pool, or 1 for fixed digital types). */
  max_quantity: number;
  unit_price: number;
  line_total: number;
  selections: Record<string, string>;
  selections_summary: Array<{ label: string; value: string }>;
}

export interface CartPublic {
  id: number;
  items: CartItemPublic[];
  item_count: number;
  subtotal: number;
}
