# Task-IT

Task-IT is a simple service marketplace MVP for South Africa, connecting customers with trusted local professionals for everyday services.

## Overview

The platform helps customers discover local providers for services such as barbering, tutoring, plumbing, electrical work, cleaning, and personal styling. It is designed to make booking easier while giving providers a clear way to showcase skills and availability.

## Problem

Customers often struggle to find trustworthy, reliable professionals for everyday jobs. Independent providers also struggle to build visibility and find steady, recurring work.

## Core Value

- Customers can browse services by category and city.
- Providers can be discovered via profile, rating, and service detail.
- Requests are easy to compare, book, and track.
- The platform can later expand into payments, messaging, verification, and subscriptions.

## MVP Features

### Customer-facing

- Browse administrator-created service categories
- Search for services and providers
- Filter marketplace services by category and city
- View provider listings and pricing
- Review ratings and service descriptions
- Request a service and view its status in booking history
- Cancel pending or accepted booking requests
- Prevent duplicate provider bookings at the same date and time
- Validate that booking requests use a future date and time
- Sign in and return to a persisted customer account

### Provider-facing

- Provider profile, service listing, and city-based discovery
- Booking dashboard with pending, accepted, and completed requests
- Accept or decline requests and mark accepted work complete
- Completed booking earnings summary

### Platform/admin

- Category and marketplace listing data
- Persisted customer, provider, service, and booking records
- Password-hashed demo accounts and signed API sessions

## Tech Stack

This MVP uses a lightweight stack for fast local development:

- Frontend: React + Vite
- Backend: Node.js + Express
- Data layer: SQLite database at `web/backend/task-it.sqlite`
- Authentication: bcrypt password hashes and 12-hour JWT bearer tokens
- Runtime: Local development environment for testing and iteration

## Project Structure

- [web/frontend](web/frontend) - React frontend for the marketplace UI
- [web/backend](web/backend) - Express API for service and category data
- [docs](docs) - Planning and product documentation

## Getting Started

1. Install dependencies from the project root:
   npm install
2. Configure admin credentials by copying `web/backend/.env.example` to `web/backend/.env` and setting a private email, strong password, and stable random `JWT_SECRET`.
3. Start both the backend and frontend:
   npm run dev
4. Open the app in your browser:
   http://localhost:5173
5. Check the API health endpoint:
   http://localhost:3001/api/health

The old sample providers, services, customers, reviews, ratings, and bookings are not seeded. On first start after this update, the database migration removes the previous sample records and creates an empty catalog. Use the admin account to add real marketplace information.

Customers can create an account from the sign-in screen. Admin credentials are read from `web/backend/.env` and there is no default admin account. Create provider accounts through the admin dashboard; the admin sets their initial password.

Set `JWT_SECRET` to a stable, private value before deployment. In development, if it is omitted, the API generates a temporary signing key on startup, so browser sessions will need to sign in again after a restart.

## Available API Endpoints

- GET /api/health
- GET /api/categories
- GET /api/services
- GET /api/providers and GET /api/providers/:id
- POST /api/auth/login
- POST /api/auth/register (customer)
- POST /api/bookings (customer session required)
- GET /api/bookings/mine (customer session required)
- GET /api/provider/dashboard (provider session required)
- PATCH /api/bookings/:id/status (provider session required)
- PATCH /api/bookings/:id/cancel (customer session required)
- PATCH /api/account/password (customer/provider session required)
- PATCH /api/provider/profile (provider session required)
- `/api/admin/*` routes for summary, categories, provider accounts, service listings, and bookings (admin session required)

## Current Status

This project is a local MVP with searchable SQLite-backed listings, customer booking history, a provider dashboard, and an admin management area. Payments are not integrated. The in-app Terms of Service and Privacy Policy are draft templates and must be reviewed by qualified South African legal counsel before public launch.

## Future Roadmap

- Provider authentication and onboarding
- Booking flows and scheduling
- Payment and escrow support
- Messaging between customers and providers
- Verification and review management
- Expansion into more cities and service categories
