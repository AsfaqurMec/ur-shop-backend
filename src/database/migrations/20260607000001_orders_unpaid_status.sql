ALTER TABLE `orders`
  MODIFY COLUMN `status` ENUM('pending','paid','unpaid','processing','completed','refunded','cancelled') NOT NULL DEFAULT 'pending';
