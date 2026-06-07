-- Track one-time email: subscription expires tomorrow (renew prompt).
ALTER TABLE `subscriptions`
  ADD COLUMN `expiry_reminder_sent_at` DATETIME(3) NULL DEFAULT NULL AFTER `current_period_end`,
  ADD KEY `subscriptions_expiry_reminder` (`status`, `expiry_reminder_sent_at`, `current_period_end`);
