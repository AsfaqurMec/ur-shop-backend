/**
 * Send “expires tomorrow” emails for active subscriptions (UTC calendar rule).
 * Idempotent per subscription via `expiry_reminder_sent_at`.
 */
export declare function sendSubscriptionExpiryReminders(): Promise<{
    scanned: number;
    emails_sent: number;
    failed: number;
}>;
//# sourceMappingURL=subscriptionReminderService.d.ts.map