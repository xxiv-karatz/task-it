# Task-IT Project Status

**Status date:** 2026-11-22

This document separates the current local MVP from the larger product roadmap in [PLAN.md](PLAN.md). It is a working snapshot, not a launch-readiness sign-off.

## What Is Built

- A web marketplace frontend built with React and Vite, with an Express API and SQLite persistence.
- Customer registration and sign-in, service/category browsing and search, provider profiles, and booking history.
- Provider dashboard for reviewing requests, accepting or declining them, completing accepted work, and viewing completed-booking earnings.
- Admin-protected management routes for marketplace summaries, categories, providers, services, and bookings.
- Password hashing for accounts and JWT bearer-token authentication.
- Local development scripts to run the frontend and backend together, plus a frontend production build script.
- Marketplace filtering by search text, category, and city.
- Customer booking cancellation for pending or accepted requests.
- Future-date validation and provider/date/time conflict prevention for booking requests.
- A password-change API for customer and provider accounts.
- A provider self-service profile update API.
- Cancelled booking status support in the SQLite migration.
- A private `web/backend/.env` has been created locally with generated admin credentials and a JWT secret. It is ignored by Git; the example file contains placeholders only.

## Not Built Yet

The following are in the product plan but are not part of the current MVP:

- Online payments, escrow, refunds, and dispute handling.
- Customer-provider messaging.
- Provider identity verification and a verification review workflow.
- Provider self-service registration and onboarding; provider accounts are currently created by an administrator.
- Booking-time scheduling beyond the current request and status workflow.
- Review submission and moderation workflows.
- Native mobile apps and expansion beyond the initial web-marketplace scope.
- Email verification and password-reset flows.
- Provider self-service UI for profile and service-listing management.
- Password-change UI for signed-in customer/provider accounts.
- Durable production hosting, automated backups, database migrations, monitoring, and HTTPS.
- Automated test suites and CI/CD.
- Reviews and ratings.
- Cancellation/refund policy and dispute handling.

## Next Steps

1. Run the app locally and verify customer registration, provider administration, booking creation/cancellation, status transitions, and JWT expiration.
2. Add automated API tests and frontend build/test checks. The repository has no test command yet.
3. Add the provider profile and password forms to the frontend for the new provider/profile/password APIs.
4. Use the admin dashboard to add real categories, providers, and service listings. No sample data is seeded.
5. Define provider onboarding, identity checks, booking duration rules, cancellation policies, and review moderation before implementing those workflows.
6. Select a payment provider and define authorization, escrow, payouts, refunds, and dispute behavior before integrating payments.
7. Configure production secrets outside source control, a persistent database location, backups, HTTPS, monitoring, and a deployment process.
8. Arrange South African legal review of the Terms of Service and Privacy Policy and update the effective dates/contact details.

## Decisions Still Open

- Initial category priorities.
- Hosting and production operations, including database backup and recovery.
- Payment provider and escrow model.
- Provider verification standards and process.
- Marketplace policies, including provider subscriptions and pricing.

For the broader phased roadmap and original open-decision list, see [PLAN.md](PLAN.md). For setup instructions and the documented API surface, see the [README](../README.md).