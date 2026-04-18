# FSBO Program – Development Progress

**Owner:** Lightkeeper Realty
**Stack:** Next.js 14 App Router · TypeScript · Supabase · Stripe · Tailwind CSS
**Repo:** AIRealSolutions/fsboprogram
**Last Updated:** 2026-04-17

---

## Current State (as of 2026-04-17)

Already built:
- `app/boardroom/[propertyId]/page.tsx` — Boardroom shell (now DB-backed)
- `app/boardroom/pricing/page.tsx` — Pricing page (supports `?propertyId=`)
- `app/property/[slug]/page.tsx` — Public listing page (DB-backed)
- `app/sell/page.tsx` — Create listing wizard entry point
- `components/BoardroomControls.tsx` — Boardroom UI controls
- `components/PricingBuilder.tsx` — Pricing builder component
- `components/SellWizard.tsx` — 3-step listing creator (Property → Basics → Publish)
- `components/LeadCaptureForm.tsx` — Lead capture form (calls API route)
- `lib/pricing.ts` — Pricing logic
- `lib/boardroom.ts` — Boardroom service logic
- `lib/supabaseAdmin.ts` — Supabase admin client
- `lib/properties.ts` — Property fetch helpers
- `lib/slug.ts` — Slug builder
- API routes: renew-term, save-preferences, save-strategy, pricing-preview
- API routes: `POST /api/properties/create`, `POST /api/leads/create`

Missing: Auth, Stripe activation + webhook, storage upload, agent system, showings

---

## Phase 1 — Foundation (MVP) 🟡 IN PROGRESS

Goal: Sellers can register, create a listing, and publish a public page.

### 1.1 Database Schema (Supabase)
- [x] `supabase/schema.sql` exists and defines `profiles`, `properties`, `property_media`, `leads`, `listing_terms`, etc.
- [x] `supabase/policies.sql` exists (RLS policies)

### 1.2 Auth
- [ ] Supabase Auth (email/password + magic link)
- [ ] Auth middleware protecting `/boardroom` routes
- [ ] `/login` and `/register` pages
- Note: current `/sell` uses `DEFAULT_OWNER_PROFILE_ID` env for demo ownership until auth is wired.

### 1.3 Create Listing Flow
- [x] `/sell` onboarding page — 3-step wizard:
  1. Property details (address, beds, baths, sqft, price)
  2. Tier selection (Basic $500 / Hybrid / Premium 3%)
  3. Payment (Stripe) → listing goes live (placeholder: demo publish toggle)
- [x] Slug auto-generated from address
- [x] Listing status: `draft → active → expired` (demo uses `draft`/`active`)
- [ ] Tier selection + Stripe activation (replace demo publish toggle)

### 1.4 Public Listing Page (`/property/[slug]`)
- [x] Display: price, details, story placeholders from DB
- [x] Lead capture form — name, email, phone, message → inserts to `leads`
- [ ] SEO meta tags (title, description, OG image)
- [ ] Photos gallery from `property_media`

### 1.5 Stripe Integration
- [ ] Install `stripe` + `@stripe/stripe-js`
- [ ] Product/price objects for each tier
- [ ] Checkout session on listing creation
- [ ] Webhook: `checkout.session.completed` → activate listing in DB

---

## Phase 2 — Seller Boardroom 🔴 NOT STARTED

Goal: Sellers manage their listing from a full dashboard.

### 2.1 Boardroom Dashboard (`/boardroom/[propertyId]`)
- [ ] Auth-gated — seller must own the listing
- [ ] Tabs: Overview · Listing · Leads · Services · Showings · Messages

### 2.2 Listing Control Tab
- [ ] Edit property details (price, description, beds/baths/sqft)
- [ ] Photo upload (Supabase Storage → `listing_media`)
- [ ] Video URL field
- [ ] Preview public listing link

### 2.3 Activity Feed
- [ ] Recent leads with timestamps
- [ ] Scheduled showings
- [ ] Service order status updates

### 2.4 Lead Management Tab
- [ ] Table of all leads for this listing
- [ ] Status toggle: new → contacted → qualified → closed
- [ ] Click to reveal buyer contact info

### 2.5 Service Marketplace Tab
- [ ] `services` table — id, type, name, price, description
- [ ] `orders` table — id, listing_id, service_id, status, stripe_payment_id, created_at
- [ ] Purchasable services:
  - Professional Photos ($TBD)
  - Drone Package ($TBD)
  - Social Media Boost ($250/3-month cycle)
  - Open House Hosting ($TBD)
  - Agent Showing (1% or flat fee)
- [ ] Stripe Checkout per service purchase
- [ ] Webhook activates order on payment success

### 2.6 Ad Campaign System
- [ ] `ad_campaigns` table — id, listing_id, order_id, start_date, end_date, status
- [ ] $250 per 3-month cycle, non-rollover
- [ ] Campaign status display in dashboard
- [ ] Renewal prompt when campaign expires

### 2.7 Listing Term & Renewal
- [ ] Default term: 3 months from activation
- [ ] Expiry banner in Boardroom when <14 days remain
- [ ] `/api/boardroom/renew-term` (already exists — wire to Stripe)
- [ ] Each renewal = new ad campaign eligibility

---

## Phase 3 — Agent System & Showings 🔴 NOT STARTED

Goal: Agents can register, accept service requests, and get paid.

### 3.1 Agent Registration
- [ ] Agent registration flow — role = `agent` in users table
- [ ] Agent profile: name, license #, service area, headshot

### 3.2 Showing Manager
- [ ] `showings` table — id, listing_id, agent_id, buyer_name, buyer_contact, scheduled_at, fee_type (flat/percent), fee_amount, status
- [ ] Seller can self-schedule (no agent fee)
- [ ] Seller can request agent showing → fee trigger
- [ ] Agent receives notification + accepts/declines
- [ ] On completion → payout calculated

### 3.3 Agent Payout Logic
- [ ] 1% of listing price if agent handles showing/buyer
- [ ] OR configurable flat fee per showing
- [ ] Stripe Connect for agent payouts

### 3.4 Upgrade Logic
- [ ] Sellers can upgrade tier anytime from Boardroom
- [ ] Previous payments do NOT roll over (show clear warning)
- [ ] Upgrading to Premium (3%) → full representation agreement
- [ ] Upgrade flow: tier comparison modal → confirm → new Stripe checkout

### 3.5 Upgrade Prompt UX
- [ ] Tier comparison card visible in Boardroom sidebar
- [ ] Upgrade prompt triggered by: 30+ days on market, 0 showings, agent activity

---

## Phase 4 — Admin Panel 🔴 NOT STARTED

Goal: Broker can oversee all listings, pricing, and referrals.

### 4.1 Admin Dashboard (`/admin`)
- [ ] Auth-gated to role = `admin`
- [ ] All listings table with status/tier/revenue
- [ ] All orders table
- [ ] All agents table

### 4.2 Pricing Config
- [ ] Configurable tier prices (stored in DB or env)
- [ ] Configurable service add-on prices
- [ ] Ad campaign pricing

### 4.3 Referral Tracking
- [ ] `referrals` table — id, referrer_id, listing_id, status, payout
- [ ] Referral link generation per agent/seller

---

## Phase 5 — Future Features 🔴 NOT STARTED

- [ ] AI-generated listing descriptions (OpenAI gpt-4o)
- [ ] Auto social media posts on listing publish
- [ ] Nationwide agent referral network
- [ ] CRM + follow-up automation (email sequences)
- [ ] Meta Ads API integration for ad campaigns

---

## Monetization Summary

| Stream | Model |
|---|---|
| Basic listing fee | $500–$1,000 flat |
| Hybrid base + add-ons | À la carte per service |
| Premium listing | 3% of sale price |
| Ad campaigns | $250/3-month cycle |
| Agent showings | 1% or flat fee |

---

## Success Metrics

- Listings created per month
- Tier upgrade conversion rate
- Avg revenue per listing
- Lead-to-close ratio
- Agent participation rate
