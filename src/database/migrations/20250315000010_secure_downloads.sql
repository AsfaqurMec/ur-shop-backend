-- Secure downloads: entitlement expiry, download tokens (signed/random, DB-stored)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------
-- download_entitlements: optional expiry date
-- -----------------------------------------------
ALTER TABLE `download_entitlements`
  ADD COLUMN `expires_at` DATETIME(3) NULL DEFAULT NULL COMMENT 'Optional: access expires after this time' AFTER `product_file_id`,
  ADD KEY `download_entitlements_expires_at` (`expires_at`);

-- -----------------------------------------------
-- download_tokens (temporary token for one-time/few-time secure download URL)
-- -----------------------------------------------
CREATE TABLE `download_tokens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `token` VARCHAR(64) NOT NULL COMMENT 'Random token (e.g. 32-byte hex), not guessable',
  `entitlement_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `max_uses` INT UNSIGNED NOT NULL DEFAULT 1,
  `use_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `download_tokens_token_unique` (`token`),
  KEY `download_tokens_entitlement_id` (`entitlement_id`),
  KEY `download_tokens_user_id` (`user_id`),
  KEY `download_tokens_expires_at` (`expires_at`),
  CONSTRAINT `download_tokens_entitlement_fk` FOREIGN KEY (`entitlement_id`) REFERENCES `download_entitlements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `download_tokens_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
