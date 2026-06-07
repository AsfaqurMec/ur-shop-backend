# Digital products ecommerce – MySQL schema

## Product types (enum)

| Type | Description | Delivery |
|------|-------------|----------|
| `downloadable` | Files; delivery via product_files + downloads | After payment, user downloads from order; limit by product_files.download_limit |
| `license_key` | Pre-generated keys from product_license_pools | Assign one key per order_item from pool; record order_item_id on pool row |
| `subscription_manual` | Manual renewal / access period | Create subscriptions row; use current_period_start/end |
| `digital_service` | Service fulfilled manually | Mark delivery when fulfilled |

---

## Table relationships (brief)

### Auth & users
- **users** — Customers; soft delete (`deleted_at`).
- **admins** — Backend users; separate from users; soft delete.
- **user_sessions** → users (track JWT/session per user).
- **email_verifications** → users (pending verification tokens).
- **password_resets** → users (one-time reset tokens).

### Catalog
- **categories** → parent category (self); soft delete.
- **products** → category; `product_type` enum; soft delete.
- **product_images** → products (multiple per product).
- **product_files** → products (downloadable assets; optional download_limit per file).
- **product_license_pools** → products; optional → order_items when key is assigned.

### Cart & orders
- **carts** → users (nullable for guest; use session_id for guest).
- **cart_items** → carts, products.
- **orders** → users; status enum (pending → paid → processing → completed; or refunded/cancelled).
- **order_items** → orders, products; snapshot (product_name, product_type, unit_price, total_price).

### Payments & delivery
- **payments** → orders (one or more per order; gateway, status).
- **payment_proofs** → orders, users (uploaded proof for manual gateway).
- **deliveries** → orders (order-level digital delivery status).
- **downloads** → order_items, users, product_files (per-download event for limits/audit).
- **subscriptions** → orders, order_items, users, products (for subscription_manual).

### Promo & support
- **coupons** — Code, type (percentage/fixed), value, validity, max_uses; soft delete.
- **coupon_usages** → coupons, orders, users.
- **tickets** → users; optional → orders.
- **ticket_messages** → tickets; sender_type (user/admin) + user_id or admin_id.

### Reviews & system
- **reviews** → products, users; optional order_id (verified purchase); status pending/approved; soft delete.
- **settings** — Key-value (site config).
- **email_logs** — Outbound email audit (to, subject, status, sent_at).
- **audit_logs** — user_id/admin_id, action, entity_type/entity_id, old/new values, ip (no FK to users/admins to allow logging after delete).

---

## Indexes (summary)

- **Lookups:** email, slug, code, order_number, token/token_hash.
- **Filters:** status, product_type, is_active, deleted_at, role.
- **Joins:** All FKs indexed.
- **Sorting / range:** created_at, expires_at, sent_at, current_period_end.
- **Search:** products.name (prefix index).

---

## Soft delete

Used on: **users**, **admins**, **categories**, **products**, **coupons**, **reviews**.  
Queries should filter `WHERE deleted_at IS NULL` unless showing deleted.

---

## Timestamps

All main tables have `created_at`; most have `updated_at` (default CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)).  
Use DATETIME(3) for subsecond precision where needed (e.g. downloads, sessions).
