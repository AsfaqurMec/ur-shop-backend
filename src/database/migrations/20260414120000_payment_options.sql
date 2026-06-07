-- Configurable payment methods (manual / bKash merchant). Admin-managed; credentials merge with env for bKash.

CREATE TABLE IF NOT EXISTS `payment_options` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kind` ENUM('manual', 'merchant') NOT NULL,
  `gateway_key` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `manual_flow` ENUM('mfs_reference', 'bank_proof') NULL DEFAULT NULL,
  `bank_details` JSON NULL,
  `merchant_credentials` JSON NULL,
  `ui_brand` VARCHAR(32) NULL DEFAULT 'generic',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_options_gateway_key` (`gateway_key`),
  KEY `idx_payment_options_enabled_sort` (`is_enabled`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `payments`
  MODIFY `gateway` VARCHAR(64) NOT NULL,
  ADD COLUMN `payment_option_id` INT UNSIGNED NULL DEFAULT NULL AFTER `gateway`,
  ADD KEY `payments_payment_option_id` (`payment_option_id`);

-- Seed defaults (same behavior as previous hardcoded list; bKash credentials come from env when merchant_credentials is null)
INSERT IGNORE INTO `payment_options`
  (`kind`, `gateway_key`, `name`, `description`, `is_enabled`, `sort_order`, `manual_flow`, `bank_details`, `merchant_credentials`, `ui_brand`)
VALUES
(
  'merchant',
  'bkash',
  'bKash Merchant',
  'Official bKash checkout: you are redirected to bKash to pay securely. Complete within the time limit or the order is cancelled automatically.',
  1,
  0,
  NULL,
  NULL,
  NULL,
  'bkash'
),
(
  'manual',
  'manual_bkash',
  'bKash',
  'Send the order total to our merchant number from your bKash app, then submit your wallet number and TrxID for verification.',
  1,
  10,
  'mfs_reference',
  JSON_OBJECT(
    'bank_name', 'bKash',
    'account_holder_name', 'Merchant',
    'account_number', '01XXXXXXXXX',
    'payment_reference_hint', 'Use "Send Money" or "Make Payment". Send the exact order total, then copy TrxID from SMS or the app.'
  ),
  NULL,
  'bkash'
),
(
  'manual',
  'manual_nagad',
  'Nagad',
  'Send the order total from your Nagad app, then submit your Nagad number and transaction ID.',
  1,
  20,
  'mfs_reference',
  JSON_OBJECT(
    'bank_name', 'Nagad',
    'account_holder_name', 'Merchant',
    'account_number', '01XXXXXXXXX',
    'payment_reference_hint', 'Use Send Money. Enter the exact amount shown at checkout, then note the Txn ID.'
  ),
  NULL,
  'nagad'
),
(
  'manual',
  'manual_rocket',
  'Rocket',
  'Send the order total from your Rocket (DBBL) account, then submit your Rocket number and transaction ID.',
  1,
  30,
  'mfs_reference',
  JSON_OBJECT(
    'bank_name', 'Rocket (Dutch-Bangla)',
    'account_holder_name', 'Merchant',
    'account_number', '01XXXXXXXXX',
    'payment_reference_hint', 'Use Cash Out or Send Money as applicable. Copy the transaction reference from SMS.'
  ),
  NULL,
  'rocket'
),
(
  'manual',
  'manual',
  'Manual / Bank Transfer',
  'Pay via bank transfer and upload your payment proof (screenshot or receipt).',
  1,
  40,
  'bank_proof',
  JSON_OBJECT(
    'bank_name', 'Demo Valley Credit Union',
    'account_holder_name', 'Digital Products Store LLC',
    'account_number', '000123456789',
    'routing_number', '110000000',
    'iban', 'GB82WEST12345698765432',
    'swift_bic', 'DEMOUS33XXX',
    'payment_reference_hint', 'Include your order number (shown at the top of this page) in the transfer memo or reference so we can match your payment.'
  ),
  NULL,
  'generic'
);
