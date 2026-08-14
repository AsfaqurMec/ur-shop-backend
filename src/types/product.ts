export const PRODUCT_TYPES = ['downloadable', 'license_key', 'subscription_manual', 'digital_service'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export interface ProductRow {
  id: number;
  category_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  full_description: string | null;
  size_chart_image: string | null;
  features: string | null;
  product_type: ProductType;
  manual_fulfillment_required: number;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  quantity: number | null;
  default_variation_id: number | null;
  is_active: number;
  is_featured: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface ProductImageRow {
  id: number;
  product_id: number;
  path: string;
  alt_text: string | null;
  sort_order: number;
  created_at: Date;
}

export interface ProductFileRow {
  id: number;
  product_id: number;
  file_path: string;
  file_name: string;
  file_size: number | null;
  download_limit: number | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductLicensePoolRow {
  id: number;
  product_id: number;
  /** When set, this key is only sold for the matching catalog variation. */
  product_variation_id: number | null;
  license_key: string;
  used_at: Date | null;
  order_item_id: number | null;
  created_at: Date;
}

export type ProductPurchaseVariablePublic = {
  var_key: string;
  label: string;
  kind: 'select' | 'email';
  required: boolean;
  sort_order: number;
  enabled?: boolean;
  options?: Array<{
    option_key: string;
    label: string;
    price_adjustment: number;
    sort_order: number;
  }>;
};

export type ProductCatalogAttributeKind = 'select' | 'text' | 'email';

export interface ProductCatalogAttributePublic {
  attr_key: string;
  name: string;
  kind: ProductCatalogAttributeKind;
  visible_on_page: boolean;
  used_for_variations: boolean;
  sort_order: number;
  values: Array<{ value_key: string; label: string; sort_order: number }>;
}

export interface ProductCatalogVariationPublic {
  id: number;
  sku: string | null;
  quantity: number | null;
  price: number;
  compare_at_price: number | null;
  enabled: boolean;
  sort_order: number;
  combination: Record<string, string>;
}

export interface ProductPublic {
  id: number;
  category_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  full_description?: string | null;
  size_chart_image?: string | null;
  features?: string[];
  product_type: ProductType;
  manual_fulfillment_required?: boolean;
  price: number;
  compare_at_price: number | null;
  sku?: string | null;
  quantity?: number | null;
  default_variation_id?: number | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  thumbnail?: string | null;
  images?: ProductImagePublic[];
  files?: ProductFilePublic[];
  license_available_count?: number;
  /** True when the customer should choose options on the product page (list cards link through). */
  needs_pdp_config?: boolean;
  /** New catalog options (attributes + variations). */
  catalog_attributes?: ProductCatalogAttributePublic[];
  catalog_variations?: ProductCatalogVariationPublic[];
  /** Enabled variables only on storefront; admin responses may include disabled with enabled flag. */
  purchase_variables?: ProductPurchaseVariablePublic[];
}

export interface ProductImagePublic {
  id: number;
  path: string;
  alt_text: string | null;
  sort_order: number;
}

export interface ProductFilePublic {
  id: number;
  file_name: string;
  file_size: number | null;
  download_limit: number | null;
  sort_order: number;
}

export interface ProductListQuery {
  page: number;
  limit: number;
  category_id?: number;
  product_type?: ProductType;
  min_price?: number;
  max_price?: number;
  search?: string;
  featured?: boolean;
  is_active?: boolean;
}

export interface ProductListResult {
  products: ProductPublic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
