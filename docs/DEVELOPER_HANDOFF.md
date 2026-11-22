# Developer Handoff

## Summary

Task-IT is a local MVP for a South African service marketplace. It uses a React/Vite frontend and an Express/SQLite backend. The database is initially empty: no customers, providers, services, categories, reviews, or bookings are seeded.

## What Changed

- Repaired authenticated frontend API calls so bearer tokens are sent consistently.
- Corrected customer and provider booking field mappings.
- Added category and city filters, plus category selection in the marketplace UI.
- Added customer cancellation for bookings in `Pending` or `Accepted` status.
- Added a `Cancelled` status and a SQLite migration for it.
- Added future-date/time validation and exact provider/date/time conflict prevention.
- Set a minimum booking date in the browser form.
- Added password-change and provider-profile APIs.
- Updated README and project status documentation.

## Running the Project

```sh
npm install
cp web/backend/.env.example web/backend/.env
npm run dev
```

Set private values in `web/backend/.env` before starting. The frontend runs at `http://localhost:5173`; the backend health check is `http://localhost:3001/api/health`.

The admin account is environment-backed. Supply `ADMIN_EMAIL` and `ADMIN_PASSWORD`; do not create or commit a default account.

## Data Model

- `categories`: administrator-managed names.
- `providers`: public profile, city, category, pricing, biography, specialties, availability, and active state.
- `users`: customer/provider accounts, bcrypt password hashes, role, provider link, and policy acceptance timestamps.
- `admin_users`: environment-provisioned administrator account.
- `services`: provider/category listings and ZAR whole-number pricing.
- `bookings`: customer, provider, service, date/time, notes, status, and creation timestamp.

Booking statuses are `Pending`, `Accepted`, `Completed`, `Declined`, and `Cancelled`.

## API Additions

- `PATCH /api/account/password`: customer/provider password change; requires `currentPassword` and `newPassword`.
- `PATCH /api/provider/profile`: signed-in provider profile update; requires `city` and `categoryId`.
- `PATCH /api/bookings/:id/cancel`: customer cancellation for pending or accepted requests.
- `GET /api/services`: accepts `q`, `categoryId`, and `city`.

Existing endpoints are in the README.

## Testing Status

The frontend production build passes. Backend syntax checks pass. The repository has no automated test suite or test script.

Before release, test:

- Customer/provider/admin registration and login.
- Admin category/provider/service CRUD.
- JWT expiry, role enforcement, and logout behavior.
- Past-date, provider-conflict, and mismatched-service booking requests.:
- Provider accept, decline, complete transitions.
- Customer cancellation ownership and status rules.
- Password changes and incorrect-password handling.
- Category/city search combinations.

## Known Gaps

1. No provider profile or password-change UI for the new APIs.
2. No email verification or password reset.
3. Provider registration and admin-created providers both exist; choose one production onboarding model.
4. No reviews or ratings.
5. Availability is free text and not schedule-aware.
6. No payment, escrow, payout, refund, dispute, or invoice workflow.
7. No messaging or notifications.
8. No backup/restore process.
9. SQLite needs a documented deployment and concurrency strategy.
10. No rate limiting, CORS allowlist, security headers, structured logging, or secret manager.
11. No automated migrations framework; `database.js` uses `PRAGMA user_version`.
12. Legal documents are drafts requiring South African counsel review.

## Next-Developer Priorities

### Test Baseline

- Extract Express app creation for process-free API tests.
- Use a separate temporary SQLite database for every suite.
- Add test scripts and CI for API and frontend checks.
- Keep test fixtures inside test setup; do not seed production data.

### Account UX

- Add provider profile editing and password-change forms.
- Load current values and handle category validation.
- Add password confirmation and post-change session handling.

### Booking Rules

- Add cancellation confirmation and future-date guards.
- Display API conflicts to the customer.
- Decide booking duration and implement real overlap checks, not exact-time-only checks.
- Define cancellation windows and all status transitions.

### Verification and Notifications

- Add provider identity/professional credential review.
- Add admin verification states and public labels.
- Add email verification, password reset, and booking status notifications.

### Reviews and Moderation

- Permit one review only for completed matched bookings.
- Store rating, comment, moderation state, and timestamps.
- Add admin moderation/report handling and aggregate public ratings.

### Production Hardening

- Replace ad hoc migration logic with tested reversible migrations.
- Decide between persistent SQLite and managed PostgreSQL.
- Configure backups and restore drills.
- Set a strict CORS allowlist and security headers.
- Add rate limiting, secret management, HTTPS, monitoring, and structured logs.

### Payments and Disputes

Before coding payments, define:

- South African payment provider and payout requirements.
- Authorization/capture timing.
- Escrow or delayed payout model.
- Cancellation/refund rules.
- Provider fees and taxes.
- Dispute evidence and adjudication.
- Reconciliation and webhook replay handling.
