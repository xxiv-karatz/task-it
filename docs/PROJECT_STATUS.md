# Task-IT Project Status

**Status date:** 2026-10-23

This document separates the current local MVP from the larger product roadmap in [PLAN.md](PLAN.md). It is a working snapshot, not a launch-readiness sign-off.

## What Is Built

- A web marketplace frontend built with React and Vite, with an Express API and SQLite persistence.
- Customer registration and sign-in, service/category browsing and search, provider profiles, and booking history.
- Provider dashboard for reviewing requests, accepting or declining them, completing accepted work, and viewing completed-booking earnings.
- Admin-protected management routes for marketplace summaries, categories, providers, services, and bookings.
- Password hashing for accounts and JWT bearer-token authentication.
- Local development scripts to run the frontend and backend together, plus a frontend production build script.
- A private `web/backend/.env` has been created locally with generated admin credentials and a JWT secret. It is ignored by Git; the example file contains placeholders only.

## Not Built Yet

The following are in the product plan but are not part of the current MVP, according to the project documentation:

- Online payments, escrow, refunds, and dispute handling.
- Customer-provider messaging.
- Provider identity verification and a verification review workflow.
- Provider self-service registration and onboarding; provider accounts are currently created by an administrator.
- Booking-time scheduling beyond the current request and status workflow.
- Review submission and moderation workflows.
- Native mobile apps and expansion beyond the initial web-marketplace scope.

## Next Steps

1. Run the app locally and check the key customer, provider, and admin flows end to end. Add or document repeatable tests; the package scripts currently define no test command.
2. Use the admin dashboard to add the initial real categories, providers, and service listings, then decide the first launch city and category priorities.
3. Define provider onboarding, identity checks, scheduling rules, cancellation policies, and review moderation before implementing those workflows.
4. Select a payment provider and define how payment authorization, escrow, payouts, refunds, and disputes should work before integrating payments.
5. Prepare for public launch: review security and operational needs, configure production secrets and hosting, and arrange legal review of the draft Terms of Service and Privacy Policy for South Africa.

## Decisions Still Open

- Initial category priorities.
- Hosting and production operations, including database backup and recovery.
- Payment provider and escrow model.
- Provider verification standards and process.
- Marketplace policies, including provider subscriptions and pricing.

For the broader phased roadmap and original open-decision list, see [PLAN.md](PLAN.md). For setup instructions and the documented API surface, see the [README](../README.md).