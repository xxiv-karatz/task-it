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

- Browse service categories
- Search for services and providers
- View sample provider listings and pricing
- Review ratings and service descriptions
- Request a service and view its status in booking history
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
2. Start both the backend and frontend:
   npm run dev
3. Open the app in your browser:
   http://localhost:5173
4. Check the API health endpoint:
   http://localhost:3001/api/health

### Demo accounts

All seeded demo accounts use the password `taskit-demo`.

- Customer: `nandi@example.com`
- Provider: `anele@taskit.test`
- Other providers use their first name in lowercase followed by `@taskit.test`.

Set `JWT_SECRET` to a stable, private value before deployment. Without it, the API generates a temporary signing key on startup, so existing browser sessions will need to sign in again after a restart. The sample passwords are for local development only.

## Available API Endpoints

- GET /api/health
- GET /api/categories
- GET /api/services
- GET /api/providers and GET /api/providers/:id
- POST /api/auth/login
- POST /api/bookings (customer session required)
- GET /api/bookings/mine (customer session required)
- GET /api/provider/dashboard (provider session required)
- PATCH /api/bookings/:id/status (provider session required)

## Current Status

This project is a local MVP with searchable listings, persisted SQLite data, customer booking history, and a provider booking dashboard. Sign-in is implemented for seeded demo accounts; account registration, payment processing, and deployment-grade security are not yet included.

## Future Roadmap

- Provider authentication and onboarding
- Booking flows and scheduling
- Payment and escrow support
- Messaging between customers and providers
- Verification and review management
- Expansion into more cities and service categories
