-- Fulfillment SLA/audit fields and subscription pending activation support

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `products`
  ADD COLUMN `manual_fulfillment_required` TINYINT(1) NOT NULL DEFAULT 1
  AFTER `product_type`;

ALTER TABLE `subscriptions`
  MODIFY COLUMN `status` ENUM('pending_activation','active','cancelled','expired') NOT NULL DEFAULT 'active';

ALTER TABLE `fulfillment_queue`
  ADD COLUMN `due_at` DATETIME(3) NULL DEFAULT NULL AFTER `notes`,
  ADD COLUMN `fulfilled_by_admin_id` INT UNSIGNED NULL DEFAULT NULL AFTER `fulfilled_at`,
  ADD KEY `fulfillment_queue_due_at` (`due_at`),
  ADD KEY `fulfillment_queue_fulfilled_by_admin_id` (`fulfilled_by_admin_id`),
  ADD CONSTRAINT `fulfillment_queue_fulfilled_by_admin_fk`
    FOREIGN KEY (`fulfilled_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL;

SET FOREIGN_KEY_CHECKS = 1;
