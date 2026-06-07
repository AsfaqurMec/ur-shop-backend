-- Per-product purchase variables (select options with price adjustments, optional email field).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `product_purchase_variables` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `var_key` VARCHAR(64) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `kind` ENUM('select','email') NOT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `required` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_purchase_variables_product_var_key` (`product_id`, `var_key`),
  KEY `product_purchase_variables_product_id` (`product_id`),
  CONSTRAINT `product_purchase_variables_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_purchase_variable_options` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `variable_id` INT UNSIGNED NOT NULL,
  `option_key` VARCHAR(64) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `price_adjustment` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ppvo_variable_option_key` (`variable_id`, `option_key`),
  KEY `ppvo_variable_id` (`variable_id`),
  CONSTRAINT `ppvo_variable_id_fk` FOREIGN KEY (`variable_id`) REFERENCES `product_purchase_variables` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `cart_items`
  ADD COLUMN `selections` JSON NOT NULL DEFAULT (JSON_OBJECT()) AFTER `quantity`;

ALTER TABLE `order_items`
  ADD COLUMN `purchase_selections` JSON NULL DEFAULT NULL AFTER `total_price`,
  ADD COLUMN `purchase_selections_summary` JSON NULL DEFAULT NULL AFTER `purchase_selections`;

SET FOREIGN_KEY_CHECKS = 1;
