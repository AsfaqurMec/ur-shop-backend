# MySQL schema migrations

**Quick setup (from backend root):** Ensure MySQL is running (see [LOCAL-DATABASE.md](../../../docs/LOCAL-DATABASE.md) for Docker or winget install), then run:

```bash
npm run db:setup
npm run db:seed
```

- `db:setup` creates the database (from `DB_NAME` in `.env`) if it doesn't exist and runs all migrations.
- `db:seed` inserts demo data (admin: admin@demo.com / demo123, customer: customer@demo.com / demo123). Safe to run once; skips if demo admin already exists.

---

Manual: run migrations in order by filename (lexicographic). Use a single DB connection and run each `.sql` file once.

**Order:**

1. `20250315000001_users_and_auth.sql` — users, admins, user_sessions, email_verifications, password_resets  
2. `20250315000002_catalog.sql` — categories, products, product_images, product_files, product_license_pools  
3. `20250315000003_orders_and_delivery.sql` — carts, cart_items, orders, order_items, payments, payment_proofs, deliveries, downloads, subscriptions; adds FK from product_license_pools to order_items  
4. `20250315000004_coupons_tickets_reviews.sql` — coupons, coupon_usages, tickets, ticket_messages, reviews  
5. `20250315000005_system.sql` — settings, email_logs, audit_logs  
6. `20250315000006_products_is_featured.sql` — adds is_featured to products  
7. `20250315000007_coupons_restrictions.sql` — adds max_uses_per_user, coupon_products, coupon_categories  
8. `20250315000008_payment_proofs_extra.sql` — adds sender_number, transaction_id, paid_amount to payment_proofs  
9. `20250315000009_digital_delivery.sql` — download_entitlements, fulfillment_queue, delivery_logs  
10. `20250315000010_secure_downloads.sql` — download_entitlements.expires_at, download_tokens  
11. `20250315000011_ticket_attachments_and_status.sql` — tickets status customer_reply, ticket_message_attachments  
12. `20250315000012_reviews_unique_and_hidden.sql` — reviews unique (user_id, product_id)  

**Example (CLI):**

```bash
mysql -u user -p database_name < src/database/migrations/20250315000001_users_and_auth.sql
# ... repeat for 02, 03, 04, 05
```

See `SCHEMA.md` in this folder for entity relationships and design notes.
