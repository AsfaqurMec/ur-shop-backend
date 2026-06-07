-- Migration: Catalog (categories, products, product assets)
-- Relationships: categories self-ref for tree; products → category; images/files/license_pools → product.
-- Product types: downloadable, license_key, subscription_manual, digital_service.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------
-- categories (hierarchical; soft delete)
-- -----------------------------------------------
CREATE TABLE `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id` INT UNSIGNED NULL DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_unique` (`slug`),
  KEY `categories_parent_id` (`parent_id`),
  KEY `categories_slug` (`slug`),
  KEY `categories_deleted_at` (`deleted_at`),
  CONSTRAINT `categories_parent_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- products (soft delete; type drives delivery)
-- -----------------------------------------------
CREATE TABLE `products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` INT UNSIGNED NULL DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `product_type` ENUM('downloadable','license_key','subscription_manual','digital_service') NOT NULL,
  `price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `compare_at_price` DECIMAL(12,2) NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_slug_unique` (`slug`),
  KEY `products_category_id` (`category_id`),
  KEY `products_product_type` (`product_type`),
  KEY `products_is_active` (`is_active`),
  KEY `products_deleted_at` (`deleted_at`),
  KEY `products_name_search` (`name`(100)),
  CONSTRAINT `products_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- product_images (multiple per product)
-- -----------------------------------------------
CREATE TABLE `product_images` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `path` VARCHAR(512) NOT NULL COMMENT 'Storage path or URL',
  `alt_text` VARCHAR(255) NULL DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `product_images_product_id` (`product_id`),
  CONSTRAINT `product_images_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- product_files (downloadable assets; download_limit per purchase)
-- -----------------------------------------------
CREATE TABLE `product_files` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `file_path` VARCHAR(512) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL COMMENT 'Display name for download',
  `file_size` BIGINT UNSIGNED NULL DEFAULT NULL,
  `download_limit` INT UNSIGNED NULL DEFAULT NULL COMMENT 'NULL = unlimited per order_item',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `product_files_product_id` (`product_id`),
  CONSTRAINT `product_files_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- product_license_pools (pre-generated keys for license_key products)
-- -----------------------------------------------
CREATE TABLE `product_license_pools` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `license_key` VARCHAR(255) NOT NULL,
  `used_at` DATETIME(3) NULL DEFAULT NULL,
  `order_item_id` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Set when key is assigned to a purchase',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_license_pools_key_product` (`product_id`,`license_key`),
  KEY `product_license_pools_product_id` (`product_id`),
  KEY `product_license_pools_used_at` (`used_at`) COMMENT 'Find available keys: used_at IS NULL',
  CONSTRAINT `product_license_pools_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
