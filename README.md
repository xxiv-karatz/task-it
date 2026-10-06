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
- Book or request a service

### Provider-facing

- Profile and service listing visibility
- Basic service categorization
- Pricing and city-based discovery

### Platform/admin

- Category aggregation overview
- Marketplace listing data for initial launch validation

## Tech Stack

This MVP uses a lightweight stack for fast local development:

- Frontend: React + Vite
- Backend: Node.js + Express
- Data layer: In-memory sample data for the initial MVP
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

## Available API Endpoints

- GET /api/health
- GET /api/categories
- GET /api/services

## Current Status

This project is in a simple MVP stage with a working landing page, searchable listings, and a local API backend. It is ready for further iteration into booking, authentication, payments, or provider onboarding flows.

## Future Roadmap

- Provider authentication and onboarding
- Booking flows and scheduling
- Payment and escrow support
- Messaging between customers and providers
- Verification and review management
- Expansion into more cities and service categories
