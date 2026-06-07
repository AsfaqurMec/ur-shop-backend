-- bKash payment id on payments; optional proof file for bKash manual (transaction id only at checkout)

SET NAMES utf8mb4;

ALTER TABLE `payment_proofs`
  MODIFY COLUMN `file_path` VARCHAR(512) NULL DEFAULT NULL;

ALTER TABLE `payments`
  ADD COLUMN `bkash_payment_id` VARCHAR(80) NULL DEFAULT NULL AFTER `gateway_reference`,
  ADD KEY `payments_bkash_payment_id` (`bkash_payment_id`);
