-- Store currency: default new orders/payments to BDT (existing rows unchanged).
SET NAMES utf8mb4;

ALTER TABLE `orders` MODIFY COLUMN `currency` CHAR(3) NOT NULL DEFAULT 'BDT';
ALTER TABLE `payments` MODIFY COLUMN `currency` CHAR(3) NOT NULL DEFAULT 'BDT';
