"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdModel = exports.BannerModel = exports.AuditLogModel = exports.EmailLogModel = exports.PaymentOptionModel = exports.StoreSettingsModel = exports.ReviewModel = exports.TicketAttachmentModel = exports.TicketMessageModel = exports.TicketModel = exports.FulfillmentQueueModel = exports.SubscriptionModel = exports.DownloadTokenModel = exports.DownloadEntitlementModel = exports.DownloadModel = exports.DeliveryLogModel = exports.DeliveryModel = exports.PaymentProofModel = exports.PaymentModel = exports.OrderItemModel = exports.OrderModel = exports.CouponCategoryModel = exports.CouponProductModel = exports.CouponUsageModel = exports.CouponModel = exports.CartItemModel = exports.CartModel = exports.ProductPurchaseVariableOptionModel = exports.ProductPurchaseVariableModel = exports.ProductVariationModel = exports.ProductAttributeValueModel = exports.ProductAttributeModel = exports.ProductLicensePoolModel = exports.ProductFileModel = exports.ProductImageModel = exports.ProductModel = exports.CategoryModel = exports.PasswordResetModel = exports.EmailVerificationModel = exports.AdminSessionModel = exports.UserSessionModel = exports.AdminModel = exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const baseOptions = {
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    strict: false,
};
function makeModel(name, collection) {
    const schema = new mongoose_1.Schema({
        id: { type: Number, required: true, unique: true, index: true },
        deleted_at: { type: Date, default: null, index: true },
    }, baseOptions);
    return mongoose_1.models[name] || (0, mongoose_1.model)(name, schema, collection);
}
exports.UserModel = makeModel('User', 'users');
exports.AdminModel = makeModel('Admin', 'admins');
exports.UserSessionModel = makeModel('UserSession', 'user_sessions');
exports.AdminSessionModel = makeModel('AdminSession', 'admin_sessions');
exports.EmailVerificationModel = makeModel('EmailVerification', 'email_verifications');
exports.PasswordResetModel = makeModel('PasswordReset', 'password_resets');
exports.CategoryModel = makeModel('Category', 'categories');
exports.ProductModel = makeModel('Product', 'products');
exports.ProductImageModel = makeModel('ProductImage', 'product_images');
exports.ProductFileModel = makeModel('ProductFile', 'product_files');
exports.ProductLicensePoolModel = makeModel('ProductLicensePool', 'product_license_pools');
exports.ProductAttributeModel = makeModel('ProductAttribute', 'product_attributes');
exports.ProductAttributeValueModel = makeModel('ProductAttributeValue', 'product_attribute_values');
exports.ProductVariationModel = makeModel('ProductVariation', 'product_variations');
exports.ProductPurchaseVariableModel = makeModel('ProductPurchaseVariable', 'product_purchase_variables');
exports.ProductPurchaseVariableOptionModel = makeModel('ProductPurchaseVariableOption', 'product_purchase_variable_options');
exports.CartModel = makeModel('Cart', 'carts');
exports.CartItemModel = makeModel('CartItem', 'cart_items');
exports.CouponModel = makeModel('Coupon', 'coupons');
exports.CouponUsageModel = makeModel('CouponUsage', 'coupon_usages');
exports.CouponProductModel = makeModel('CouponProduct', 'coupon_products');
exports.CouponCategoryModel = makeModel('CouponCategory', 'coupon_categories');
exports.OrderModel = makeModel('Order', 'orders');
exports.OrderItemModel = makeModel('OrderItem', 'order_items');
exports.PaymentModel = makeModel('Payment', 'payments');
exports.PaymentProofModel = makeModel('PaymentProof', 'payment_proofs');
exports.DeliveryModel = makeModel('Delivery', 'deliveries');
exports.DeliveryLogModel = makeModel('DeliveryLog', 'delivery_logs');
exports.DownloadModel = makeModel('Download', 'downloads');
exports.DownloadEntitlementModel = makeModel('DownloadEntitlement', 'download_entitlements');
exports.DownloadTokenModel = makeModel('DownloadToken', 'download_tokens');
exports.SubscriptionModel = makeModel('Subscription', 'subscriptions');
exports.FulfillmentQueueModel = makeModel('FulfillmentQueue', 'fulfillment_queue');
exports.TicketModel = makeModel('Ticket', 'tickets');
exports.TicketMessageModel = makeModel('TicketMessage', 'ticket_messages');
exports.TicketAttachmentModel = makeModel('TicketAttachment', 'ticket_attachments');
exports.ReviewModel = makeModel('Review', 'reviews');
exports.StoreSettingsModel = makeModel('StoreSettings', 'store_settings');
exports.PaymentOptionModel = makeModel('PaymentOption', 'payment_options');
exports.EmailLogModel = makeModel('EmailLog', 'email_logs');
exports.AuditLogModel = makeModel('AuditLog', 'audit_logs');
exports.BannerModel = makeModel('Banner', 'banners');
exports.AdModel = makeModel('Ad', 'ads');
//# sourceMappingURL=models.js.map