-- Add sender_number, transaction_id, paid_amount to payment_proofs for manual payment details

SET NAMES utf8mb4;

ALTER TABLE `payment_proofs`
  ADD COLUMN `sender_number` VARCHAR(64) NULL DEFAULT NULL AFTER `user_id`,
  ADD COLUMN `transaction_id` VARCHAR(128) NULL DEFAULT NULL AFTER `sender_number`,
  ADD COLUMN `paid_amount` DECIMAL(12,2) NULL DEFAULT NULL AFTER `transaction_id`;
