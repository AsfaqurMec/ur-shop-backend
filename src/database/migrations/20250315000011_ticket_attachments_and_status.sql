-- Support tickets: add customer_reply status, ticket_message_attachments

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------
-- tickets: add status 'customer_reply'
-- -----------------------------------------------
ALTER TABLE `tickets`
  MODIFY COLUMN `status` ENUM('open','answered','customer_reply','closed') NOT NULL DEFAULT 'open';

-- -----------------------------------------------
-- ticket_message_attachments (file per message)
-- -----------------------------------------------
CREATE TABLE `ticket_message_attachments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ticket_message_id` INT UNSIGNED NOT NULL,
  `file_path` VARCHAR(512) NOT NULL COMMENT 'Relative path from upload base',
  `file_name` VARCHAR(255) NOT NULL COMMENT 'Original display name',
  `file_size` INT UNSIGNED NULL DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ticket_message_attachments_message_id` (`ticket_message_id`),
  CONSTRAINT `ticket_message_attachments_message_fk` FOREIGN KEY (`ticket_message_id`) REFERENCES `ticket_messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
