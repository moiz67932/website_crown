# Crown Coastal Real Estate Platform - Documentation

A comprehensive Next.js real estate application with property management, advanced search, AI-powered landing pages, and admin dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Quick Start](#quick-start)
4. [Environment Configuration](#environment-configuration)
5. [Project Structure](#project-structure)
6. [Features](#features)
7. [Database Setup](#database-setup)
8. [API Reference](#api-reference)
9. [Admin Dashboard](#admin-dashboard)
10. [Authentication System](#authentication-system)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Overview

Crown Coastal Real Estate Platform is a modern real estate web application built with Next.js 15. It integrates with the Trestle API (CoreLogic) for property data, uses Supabase for authentication and user data, and Cloud SQL (PostgreSQL) for property storage.

### Key Features
- Property search with semantic AI capabilities
- Interactive maps with Leaflet and Google Maps
- 3000+ AI-generated SEO landing pages
- Admin dashboard for content management
- User authentication with favorites and saved searches
- CRM integration (Lofty)
- Referral system

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4, Radix UI |
| Database | PostgreSQL (Cloud SQL), Supabase |
| Authentication | JWT, Supabase Auth |
| Maps | Leaflet, Google Maps API |
| AI/ML | OpenAI GPT, Qdrant Vector DB |
| State Management | Zustand, TanStack Query |
| Email | Nodemailer |
| CRM | Lofty API |

---

## Quick Start

### Prerequisites
- Node.js 22.x
- npm/yarn/pnpm
- Google Cloud CLI (for Cloud SQL Proxy)
- Supabase account

### Installation

```bash
# Clone and install
cd back
npm install

# Configure environment
cp env.example .env
# Edit .env with your credentials
```

### Running the Application

**Two terminals required for local development:**

**Terminal 1 - Cloud SQL Proxy:**
```powershell
.\start-proxy.ps1
```
Wait for: `The proxy has started successfully and is ready for new connections!`

**Terminal 2 - Dev Server:**
```bash
npm run dev
```

Visit: http://localhost:3000

---

## Environment Configuration

### Required Environment Variables

```env
# Core
NODE_ENV=development
JWT_SECRET=your-secret-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Database (Cloud SQL via Proxy)
DATABASE_URL=postgres://postgres:PASSWORD@127.0.0.1:5433/redata

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your-map-id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (for AI features)
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4o-mini

# Trestle API (Property Data)
TRESTLE_API_ID=your-api-id
TRESTLE_API_PASSWORD=your-api-password
TRESTLE_BASE_URL=https://api-trestle.corelogic.com/trestle/odata

# Qdrant (Vector Search)
QDRANT_URL=your-qdrant-url
QDRANT_API_KEY=your-qdrant-key

# Admin
ADMIN_USERNAME=admin@email.com
ADMIN_PASSWORD=your-admin-password

# CRM (Lofty)
LOFTY_API_KEY=your-lofty-key
LOFTY_BASE_URL=https://api.lofty.com/v1.0
```

---

## Project Structure

```
back/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── admin/         # Admin endpoints
│   │   │   ├── auth/          # Authentication (login, register, me)
│   │   │   ├── properties/    # Property search & details
│   │   │   ├── autocomplete/  # Search autocomplete
│   │   │   ├── blog/          # Blog management
│   │   │   ├── contact/       # Contact forms
│   │   │   ├── leads/         # Lead management
│   │   │   └── user/          # User profile & preferences
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── auth/              # Auth pages (login, register)
│   │   ├── properties/        # Property listing pages
│   │   ├── california/        # California property pages
│   │   ├── [state]/           # Dynamic state routes
│   │   ├── blog/              # Blog pages
│   │   ├── map/               # Map interface
│   │   └── profile/           # User profile
│   ├── components/            # React Components
│   │   ├── ui/               # Reusable UI (shadcn/ui)
│   │   ├── admin/            # Admin components
│   │   ├── filters/          # Search filters
│   │   ├── map/              # Map components
│   │   ├── landing/          # Landing page components
│   │   └── search/           # Search components
│   ├── lib/                   # Core Libraries
│   │   ├── auth.ts           # JWT authentication
│   │   ├── database.ts       # Database operations
│   │   ├── supabase.ts       # Supabase client
│   │   ├── supabase-auth.ts  # Supabase auth service
│   │   ├── trestle-api.ts    # Trestle API integration
│   │   ├── landing/          # Landing page generation
│   │   └── ai/               # AI utilities
│   ├── hooks/                 # Custom React Hooks
│   │   ├── use-auth.ts       # Authentication hook
│   │   └── queries/          # TanStack Query hooks
│   ├── ai/                    # AI Module
│   └── types/                 # TypeScript types
├── scripts/                   # Utility scripts
└── .env                       # Environment variables
```

---

## Features

### Property Search
- **Semantic Search**: AI-powered property search using OpenAI embeddings and Qdrant
- **Advanced Filters**: Price, bedrooms, bathrooms, property type, location
- **Autocomplete**: Smart location suggestions with fuzzy matching
- **Map Search**: Draw polygons to search areas

### Interactive Maps
- Leaflet-based maps with property markers
- Google Maps integration for street view
- Drawing tools for area selection
- Property clustering for performance

### Landing Pages (3000+)
AI-generated SEO landing pages for:
- Cities: `/{state}/{city}/homes-for-sale`
- Neighborhoods: `/{state}/{city}/{neighborhood}`
- Property Types: `condos-for-sale`, `townhomes`, etc.
- Bedrooms: `2-bedroom-apartments`, `3-bedroom-homes`

### User Features
- **Authentication**: Email/password login via Supabase
- **Favorites**: Save favorite properties (requires login)
- **Saved Searches**: Save search criteria
- **Property Comparison**: Side-by-side comparison
- **Alerts**: Email notifications for new listings

### Referral System
- Unique referral codes per user
- Points for signups, leads, appointments, closings
- Admin management dashboard

---

## Database Setup

### Cloud SQL (Properties)
Properties are stored in Google Cloud SQL PostgreSQL. Local access requires Cloud SQL Proxy:

```powershell
# Install gcloud CLI, then:
gcloud auth login
gcloud config set project your-project-id

# Run proxy (uses port 5433 locally)
gcloud sql auth-proxy PROJECT:REGION:INSTANCE --port=5433
```

### Supabase (Users & Auth)
User data, authentication, and saved properties use Supabase.

**Required Tables:**
```sql
-- Run in Supabase SQL Editor
-- Users table (auto-created by Supabase Auth)

-- Saved Properties
CREATE TABLE user_saved_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_key TEXT NOT NULL,
  property_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_key)
);

-- Enable RLS
ALTER TABLE user_saved_properties ENABLE ROW LEVEL SECURITY;
```

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/register` | POST | Create new account |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/logout` | POST | Logout user |
| `/api/auth/forgot-password` | POST | Password reset email |

### Properties

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/properties` | GET | Search properties |
| `/api/properties/[id]` | GET | Property details |
| `/api/properties/semantic-search` | GET | AI-powered search |
| `/api/autocomplete` | GET | Location autocomplete |

### User

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/profile` | GET/PUT | User profile |
| `/api/user/saved-properties` | GET/POST | Saved properties |
| `/api/user/saved-searches` | GET/POST | Saved searches |

### Admin

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/properties` | GET | Admin property list |
| `/api/admin/landing-pages` | GET/POST/PUT | Landing page management |
| `/api/admin/leads` | GET | Lead management |
| `/api/admin/analytics` | GET | Dashboard analytics |

---

## Admin Dashboard

Access: `http://localhost:3000/admin`

**Credentials:** Set via `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`

### Dashboard Sections

| Section | Path | Description |
|---------|------|-------------|
| Dashboard | `/admin` | Overview & analytics |
| Properties | `/admin/properties` | Property management, Trestle sync |
| Landing Pages | `/admin/landing` | 3000+ SEO pages management |
| Blog Posts | `/admin/posts` | Blog content management |
| Leads | `/admin/leads` | Customer leads from forms |
| Analytics | `/admin/analytics` | Traffic & conversion data |
| Settings | `/admin/settings` | Site configuration |

### Landing Page Generation

```bash
# Generate landing pages for cities
npm run generate:city-pages

# Validate generated pages
npm run validate:landings

# Regenerate failing pages
npm run validate:landings:regenerate
```

---

## Authentication System

### Flow
1. User registers via `/auth/register`
2. Supabase creates auth user + profile
3. JWT token stored in HTTP-only cookie
4. `/api/auth/me` validates session on page load

### Implementation
- **Server**: `src/lib/supabase-auth.ts` - Supabase auth service
- **Client**: `src/hooks/use-auth.ts` - React auth hook
- **API**: `src/app/api/auth/` - Auth endpoints

### Protected Routes
Admin routes require authentication via middleware (`src/middleware.ts`).

---

## Deployment

### Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Configure environment variables
3. Set up Cloud SQL connection via Workload Identity Federation

**Required for production:**
```env
NODE_ENV=production
DB_BACKEND=cloudsql
INSTANCE_CONNECTION_NAME=project:region:instance
```

### Build Commands

```bash
# Production build
npm run build

# Start production server
npm run start

# Build without lint (faster)
npm run build:no-lint
```

---

## Troubleshooting

### Common Issues

#### "ECONNREFUSED 127.0.0.1:5433"
**Cause:** Cloud SQL Proxy not running
**Fix:** Start proxy in separate terminal: `.\start-proxy.ps1`

#### "Application Default Credentials not found"
**Cause:** GCloud not authenticated
**Fix:** Run `gcloud auth login` and `gcloud auth application-default login`

#### "Proxy already running on port 5433"
**Fix:**
```powershell
Get-Process -Name cloud-sql-proxy | Stop-Process -Force
.\start-proxy.ps1
```

#### Trestle API Connection Issues
**Fix:** Verify credentials in `.env` and test with:
```bash
node debug-trestle-api.js
```

#### Landing Pages Not Generating
1. Ensure `OPENAI_API_KEY` is set
2. Check `LANDING_DEBUG=true` for verbose logs
3. Verify Supabase connection

### Useful Scripts

```bash
# Test database connection
node test-db-connection.js

# Test properties API
node test-properties-api.js

# Debug Trestle API
node debug-trestle-api.js
```

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run generate:city-pages` | Generate city landing pages |
| `npm run validate:landings` | Validate landing pages |
| `npm run backfill:props` | Backfill property embeddings |

---

## Contributing

1. Create a feature branch
2. Make changes
3. Test locally with `npm run dev`
4. Ensure build passes: `npm run build`
5. Submit pull request

---

## License

Proprietary - Crown Coastal Real Estate. All rights reserved.

---

*Last updated: December 2025*
