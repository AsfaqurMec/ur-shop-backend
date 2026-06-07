-- Migration: System tables (settings, email_logs, audit_logs)
-- No FKs to core business tables where possible to allow logging after deletes.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------
-- settings (key-value config)
-- -----------------------------------------------
CREATE TABLE `settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(128) NOT NULL,
  `value` TEXT NULL DEFAULT NULL COMMENT 'Plain or JSON',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key_unique` (`key`),
  KEY `settings_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- email_logs (outbound email audit)
-- -----------------------------------------------
CREATE TABLE `email_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `to_email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(512) NULL DEFAULT NULL,
  `template` VARCHAR(128) NULL DEFAULT NULL,
  `status` ENUM('sent','failed') NOT NULL,
  `error_message` TEXT NULL DEFAULT NULL,
  `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `email_logs_to_email` (`to_email`),
  KEY `email_logs_sent_at` (`sent_at`),
  KEY `email_logs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- audit_logs (admin/user actions for compliance and debugging)
-- -----------------------------------------------
CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL DEFAULT NULL,
  `admin_id` INT UNSIGNED NULL DEFAULT NULL,
  `action` VARCHAR(128) NOT NULL,
  `entity_type` VARCHAR(64) NULL DEFAULT NULL COMMENT 'e.g. order, product, user',
  `entity_id` VARCHAR(64) NULL DEFAULT NULL,
  `old_values` JSON NULL DEFAULT NULL,
  `new_values` JSON NULL DEFAULT NULL,
  `ip` VARCHAR(45) NULL DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id` (`user_id`),
  KEY `audit_logs_admin_id` (`admin_id`),
  KEY `audit_logs_entity` (`entity_type`,`entity_id`),
  KEY `audit_logs_created_at` (`created_at`),
  KEY `audit_logs_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
