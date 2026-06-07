export type FulfillmentQueueProductType = 'subscription_manual' | 'digital_service';
export type FulfillmentQueueStatus = 'pending' | 'fulfilled' | 'failed';

export interface DownloadEntitlementRow {
  id: number;
  order_item_id: number;
  product_file_id: number;
  created_at: Date;
}

export interface FulfillmentQueueRow {
  id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  product_type: FulfillmentQueueProductType;
  user_id: number;
  status: FulfillmentQueueStatus;
  notes: string | null;
  due_at: Date | null;
  fulfilled_at: Date | null;
  fulfilled_by_admin_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface DeliveryLogRow {
  id: number;
  order_id: number;
  order_item_id: number | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: Date;
}

export interface FulfillmentQueuePublic {
  id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  product_type: FulfillmentQueueProductType;
  user_id: number;
  status: FulfillmentQueueStatus;
  notes: string | null;
  due_at: string | null;
  fulfilled_at: string | null;
  fulfilled_by_admin_id: number | null;
  is_sla_breached: boolean;
  created_at: string;
}
