-- Migration: Coupons, support tickets, reviews
-- Relationships: coupon_usages → coupon, order, user; ticket_messages → ticket (sender via user_id or admin_id);
-- reviews → product, user, optional order for verified purchase.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------
-- coupons (soft delete)
-- -----------------------------------------------
CREATE TABLE `coupons` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(64) NOT NULL,
  `type` ENUM('percentage','fixed_amount') NOT NULL,
  `value` DECIMAL(12,2) NOT NULL COMMENT 'Percentage (e.g. 10) or fixed amount',
  `min_order_amount` DECIMAL(12,2) NULL DEFAULT NULL,
  `max_uses` INT UNSIGNED NULL DEFAULT NULL COMMENT 'NULL = unlimited',
  `used_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `valid_from` DATETIME(3) NULL DEFAULT NULL,
  `valid_until` DATETIME(3) NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupons_code_unique` (`code`),
  KEY `coupons_code` (`code`),
  KEY `coupons_is_active` (`is_active`),
  KEY `coupons_valid_dates` (`valid_from`,`valid_until`),
  KEY `coupons_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- coupon_usages (which order used which coupon)
-- -----------------------------------------------
CREATE TABLE `coupon_usages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `coupon_id` INT UNSIGNED NOT NULL,
  `order_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `discount_amount` DECIMAL(12,2) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `coupon_usages_coupon_id` (`coupon_id`),
  KEY `coupon_usages_order_id` (`order_id`),
  KEY `coupon_usages_user_id` (`user_id`),
  CONSTRAINT `coupon_usages_coupon_id_fk` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `coupon_usages_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `coupon_usages_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- tickets (support tickets)
-- -----------------------------------------------
CREATE TABLE `tickets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `order_id` INT UNSIGNED NULL DEFAULT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `status` ENUM('open','answered','closed') NOT NULL DEFAULT 'open',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `tickets_user_id` (`user_id`),
  KEY `tickets_order_id` (`order_id`),
  KEY `tickets_status` (`status`),
  KEY `tickets_created_at` (`created_at`),
  CONSTRAINT `tickets_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tickets_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- ticket_messages (sender_type: user | admin; sender_id = user_id or admin_id)
-- -----------------------------------------------
CREATE TABLE `ticket_messages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ticket_id` INT UNSIGNED NOT NULL,
  `sender_type` ENUM('user','admin') NOT NULL,
  `user_id` INT UNSIGNED NULL DEFAULT NULL,
  `admin_id` INT UNSIGNED NULL DEFAULT NULL,
  `message` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ticket_messages_ticket_id` (`ticket_id`),
  KEY `ticket_messages_created_at` (`created_at`),
  CONSTRAINT `ticket_messages_ticket_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_messages_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ticket_messages_admin_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- reviews (product reviews; soft delete; optional order for verified badge)
-- -----------------------------------------------
CREATE TABLE `reviews` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `order_id` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Set if verified purchase',
  `rating` TINYINT UNSIGNED NOT NULL COMMENT '1-5',
  `title` VARCHAR(255) NULL DEFAULT NULL,
  `body` TEXT NULL DEFAULT NULL,
  `status` ENUM('pending','approved') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reviews_product_id` (`product_id`),
  KEY `reviews_user_id` (`user_id`),
  KEY `reviews_order_id` (`order_id`),
  KEY `reviews_status` (`status`),
  KEY `reviews_rating` (`rating`),
  KEY `reviews_deleted_at` (`deleted_at`),
  CONSTRAINT `reviews_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
