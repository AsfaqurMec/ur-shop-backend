-- Add is_featured to products for featured products listing

SET NAMES utf8mb4;

ALTER TABLE `products`
  ADD COLUMN `is_featured` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_active`,
  ADD KEY `products_is_featured` (`is_featured`);
