-- License keys can be scoped to a catalog variation (variation-specific stock pool).
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `product_license_pools`
  ADD COLUMN `product_variation_id` INT UNSIGNED NULL DEFAULT NULL
    COMMENT 'When set, key is sold only for this variation; NULL = product-level pool (no variations)'
    AFTER `product_id`;

ALTER TABLE `product_license_pools`
  ADD KEY `product_license_pools_variation_used` (`product_id`, `product_variation_id`, `used_at`);

ALTER TABLE `product_license_pools`
  ADD CONSTRAINT `product_license_pools_variation_fk`
  FOREIGN KEY (`product_variation_id`) REFERENCES `product_variations` (`id`) ON DELETE SET NULL;

SET FOREIGN_KEY_CHECKS = 1;
