-- Reviews: one review per user per product; support admin hide (use deleted_at as hidden)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- One review per user per product
ALTER TABLE `reviews`
  ADD UNIQUE KEY `reviews_user_product_unique` (`user_id`, `product_id`);

SET FOREIGN_KEY_CHECKS = 1;
