import { Schema, model, models } from 'mongoose';

const baseOptions = {
  versionKey: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  strict: false,
} as const;

function makeModel<T>(name: string, collection: string) {
  const schema = new Schema<T>(
    {
      id: { type: Number, required: true, unique: true, index: true },
      deleted_at: { type: Date, default: null, index: true },
    },
    baseOptions
  );
  return models[name] || model<T>(name, schema, collection);
}

export type AnyDoc = Record<string, any>;

export const UserModel = makeModel<AnyDoc>('User', 'users');
export const AdminModel = makeModel<AnyDoc>('Admin', 'admins');
export const UserSessionModel = makeModel<AnyDoc>('UserSession', 'user_sessions');
export const AdminSessionModel = makeModel<AnyDoc>('AdminSession', 'admin_sessions');
export const EmailVerificationModel = makeModel<AnyDoc>('EmailVerification', 'email_verifications');
export const PasswordResetModel = makeModel<AnyDoc>('PasswordReset', 'password_resets');
export const CategoryModel = makeModel<AnyDoc>('Category', 'categories');
export const ProductModel = makeModel<AnyDoc>('Product', 'products');
export const ProductImageModel = makeModel<AnyDoc>('ProductImage', 'product_images');
export const ProductFileModel = makeModel<AnyDoc>('ProductFile', 'product_files');
export const ProductLicensePoolModel = makeModel<AnyDoc>('ProductLicensePool', 'product_license_pools');
export const ProductAttributeModel = makeModel<AnyDoc>('ProductAttribute', 'product_attributes');
export const ProductAttributeValueModel = makeModel<AnyDoc>('ProductAttributeValue', 'product_attribute_values');
export const ProductVariationModel = makeModel<AnyDoc>('ProductVariation', 'product_variations');
export const ProductPurchaseVariableModel = makeModel<AnyDoc>('ProductPurchaseVariable', 'product_purchase_variables');
export const ProductPurchaseVariableOptionModel = makeModel<AnyDoc>('ProductPurchaseVariableOption', 'product_purchase_variable_options');
export const CartModel = makeModel<AnyDoc>('Cart', 'carts');
export const CartItemModel = makeModel<AnyDoc>('CartItem', 'cart_items');
export const CouponModel = makeModel<AnyDoc>('Coupon', 'coupons');
export const CouponUsageModel = makeModel<AnyDoc>('CouponUsage', 'coupon_usages');
export const CouponProductModel = makeModel<AnyDoc>('CouponProduct', 'coupon_products');
export const CouponCategoryModel = makeModel<AnyDoc>('CouponCategory', 'coupon_categories');
export const OrderModel = makeModel<AnyDoc>('Order', 'orders');
export const OrderItemModel = makeModel<AnyDoc>('OrderItem', 'order_items');
export const PaymentModel = makeModel<AnyDoc>('Payment', 'payments');
export const PaymentProofModel = makeModel<AnyDoc>('PaymentProof', 'payment_proofs');
export const DeliveryModel = makeModel<AnyDoc>('Delivery', 'deliveries');
export const DeliveryLogModel = makeModel<AnyDoc>('DeliveryLog', 'delivery_logs');
export const DownloadModel = makeModel<AnyDoc>('Download', 'downloads');
export const DownloadEntitlementModel = makeModel<AnyDoc>('DownloadEntitlement', 'download_entitlements');
export const DownloadTokenModel = makeModel<AnyDoc>('DownloadToken', 'download_tokens');
export const SubscriptionModel = makeModel<AnyDoc>('Subscription', 'subscriptions');
export const FulfillmentQueueModel = makeModel<AnyDoc>('FulfillmentQueue', 'fulfillment_queue');
export const TicketModel = makeModel<AnyDoc>('Ticket', 'tickets');
export const TicketMessageModel = makeModel<AnyDoc>('TicketMessage', 'ticket_messages');
export const TicketAttachmentModel = makeModel<AnyDoc>('TicketAttachment', 'ticket_attachments');
export const ReviewModel = makeModel<AnyDoc>('Review', 'reviews');
export const StoreSettingsModel = makeModel<AnyDoc>('StoreSettings', 'store_settings');
export const PaymentOptionModel = makeModel<AnyDoc>('PaymentOption', 'payment_options');
export const EmailLogModel = makeModel<AnyDoc>('EmailLog', 'email_logs');
export const AuditLogModel = makeModel<AnyDoc>('AuditLog', 'audit_logs');
export const BannerModel = makeModel<AnyDoc>('Banner', 'banners');
export const AdModel = makeModel<AnyDoc>('Ad', 'ads');
