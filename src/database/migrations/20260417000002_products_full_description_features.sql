SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `products`
  ADD COLUMN `full_description` LONGTEXT NULL AFTER `description`,
  ADD COLUMN `features` JSON NULL AFTER `full_description`;

SET FOREIGN_KEY_CHECKS = 1;
