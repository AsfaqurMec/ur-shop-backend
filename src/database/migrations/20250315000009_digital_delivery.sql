-- Digital delivery: download entitlements, fulfillment queue, delivery logs

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------
-- download_entitlements (grants access to product_file for an order_item)
-- -----------------------------------------------
CREATE TABLE `download_entitlements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_item_id` INT UNSIGNED NOT NULL,
  `product_file_id` INT UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `download_entitlements_order_item_file` (`order_item_id`, `product_file_id`),
  KEY `download_entitlements_order_item_id` (`order_item_id`),
  KEY `download_entitlements_product_file_id` (`product_file_id`),
  CONSTRAINT `download_entitlements_order_item_fk` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `download_entitlements_product_file_fk` FOREIGN KEY (`product_file_id`) REFERENCES `product_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- fulfillment_queue (subscription_manual, digital_service - pending admin action)
-- -----------------------------------------------
CREATE TABLE `fulfillment_queue` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `order_item_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `product_type` ENUM('subscription_manual','digital_service') NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `status` ENUM('pending','fulfilled','failed') NOT NULL DEFAULT 'pending',
  `notes` TEXT NULL DEFAULT NULL,
  `fulfilled_at` DATETIME(3) NULL DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `fulfillment_queue_order_id` (`order_id`),
  KEY `fulfillment_queue_status` (`status`),
  KEY `fulfillment_queue_product_type` (`product_type`),
  CONSTRAINT `fulfillment_queue_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fulfillment_queue_order_item_fk` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fulfillment_queue_product_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fulfillment_queue_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- delivery_logs (audit of delivery actions per order/item)
-- -----------------------------------------------
CREATE TABLE `delivery_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `order_item_id` INT UNSIGNED NULL DEFAULT NULL,
  `action` VARCHAR(64) NOT NULL COMMENT 'e.g. entitlement_created, license_assigned, fulfillment_queued',
  `details` JSON NULL DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `delivery_logs_order_id` (`order_id`),
  KEY `delivery_logs_created_at` (`created_at`),
  CONSTRAINT `delivery_logs_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
