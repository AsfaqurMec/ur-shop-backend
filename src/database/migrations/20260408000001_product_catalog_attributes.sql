-- Product SKU, attributes/values, variations (WooCommerce-style), cart/order variation link.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `products`
  ADD COLUMN `sku` VARCHAR(128) NULL DEFAULT NULL AFTER `compare_at_price`,
  ADD COLUMN `default_variation_id` INT UNSIGNED NULL DEFAULT NULL AFTER `sku`;

CREATE TABLE `product_attributes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `attr_key` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `kind` ENUM('select','text','email') NOT NULL DEFAULT 'select',
  `visible_on_page` TINYINT(1) NOT NULL DEFAULT 1,
  `used_for_variations` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `pa_product_attr_key` (`product_id`, `attr_key`),
  KEY `pa_product_id` (`product_id`),
  CONSTRAINT `pa_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_attribute_values` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `attribute_id` INT UNSIGNED NOT NULL,
  `value_key` VARCHAR(64) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `pav_attr_value_key` (`attribute_id`, `value_key`),
  KEY `pav_attribute_id` (`attribute_id`),
  CONSTRAINT `pav_attribute_id_fk` FOREIGN KEY (`attribute_id`) REFERENCES `product_attributes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_variations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `sku` VARCHAR(128) NULL DEFAULT NULL,
  `price` DECIMAL(12,2) NOT NULL,
  `compare_at_price` DECIMAL(12,2) NULL DEFAULT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `combination` JSON NOT NULL,
  `combination_signature` VARCHAR(512) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `pv_product_signature` (`product_id`, `combination_signature`),
  KEY `pv_product_id` (`product_id`),
  CONSTRAINT `pv_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `products`
  ADD CONSTRAINT `products_default_variation_fk`
  FOREIGN KEY (`default_variation_id`) REFERENCES `product_variations` (`id`) ON DELETE SET NULL;

ALTER TABLE `cart_items`
  ADD COLUMN `variation_id` INT UNSIGNED NULL DEFAULT NULL AFTER `product_id`,
  ADD KEY `cart_items_variation_id` (`variation_id`),
  ADD CONSTRAINT `cart_items_variation_fk` FOREIGN KEY (`variation_id`) REFERENCES `product_variations` (`id`) ON DELETE SET NULL;

ALTER TABLE `order_items`
  ADD COLUMN `product_variation_id` INT UNSIGNED NULL DEFAULT NULL AFTER `product_id`,
  ADD KEY `order_items_variation_id` (`product_variation_id`);

SET FOREIGN_KEY_CHECKS = 1;
