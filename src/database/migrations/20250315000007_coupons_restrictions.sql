-- Add per-user usage limit and product/category restrictions to coupons

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `coupons`
  ADD COLUMN `max_uses_per_user` INT UNSIGNED NULL DEFAULT NULL COMMENT 'NULL = unlimited per user' AFTER `max_uses`;

-- Coupon eligible products (empty = no product restriction)
CREATE TABLE `coupon_products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `coupon_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupon_products_coupon_product` (`coupon_id`, `product_id`),
  KEY `coupon_products_coupon_id` (`coupon_id`),
  KEY `coupon_products_product_id` (`product_id`),
  CONSTRAINT `coupon_products_coupon_id_fk` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `coupon_products_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Coupon eligible categories (empty = no category restriction)
CREATE TABLE `coupon_categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `coupon_id` INT UNSIGNED NOT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupon_categories_coupon_category` (`coupon_id`, `category_id`),
  KEY `coupon_categories_coupon_id` (`coupon_id`),
  KEY `coupon_categories_category_id` (`category_id`),
  CONSTRAINT `coupon_categories_coupon_id_fk` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `coupon_categories_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
