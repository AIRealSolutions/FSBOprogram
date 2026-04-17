# FlipThisCrib Starter

Residential-only starter scaffold for FlipThisCrib / The Boardroom.

## Revised business model

### Tier 1 — DIY Boardroom ($399)
- basic property website builder
- all-in-one marketing tools
- seller-managed showings
- disclosures input for age, HVAC, utilities, and systems
- add-ons: sign, rider, info box
- no MLS, contracts, or broker-supported closing

### Tier 2 — MLS + Protected Closing (2%)
- 1% MLS exposure and syndication
- 1% broker-protected closing services
- seller showings by default
- optional +1% agent-performed showings as the dual-agent pathway
- buyer agency incentive configurable 0–5%
- 3-month listing agreement
- each 3-month term includes up to $250 in ad campaign funds

### Tier 3 — Premium Full Service (3%)
- full seller representation
- premium marketing included
- buyer agency incentive configurable 0–5%
- optional +1% dual agency when applicable
- 3-month listing agreement
- each 3-month term includes up to $250 in ad campaign funds

## Quarterly term rules
- all brokerage listing agreements run 3 months
- clients can extend another 3 months at a time
- each 3-month extension unlocks another $250 ad campaign allocation
- quarterly campaign funds are term-based marketing spend and do not roll into closing credit

## Boardroom control model
Sellers should be able to control through the portal:
- showing preferences and notice windows
- whether they handle showings or request the agent-showing module
- marketing approvals and featured photo order
- ad campaign approval and launch
- open house preferences
- buyer-agent incentive settings
- renewal requests every 3 months
- pause requests and listing-use preferences

## Credit logic
- Always creditable: Boardroom fee, sign, rider, info box, other explicitly creditable spend
- Premium-only creditable: drone and photography when the listing qualifies for premium conversion
- Never creditable: quarterly ad campaign funds and ad spend

## Key files
- `supabase/schema.sql` — revised schema with terms, renewals, quarterly campaign allocations, seller controls, and service selections
- `supabase/policies.sql` — row-level security policies
- `lib/pricing.ts` — business rule calculator for tiers, terms, credits, and quarterly ad funds
- `components/PricingBuilder.tsx` — UI for listing path, term, seller controls, and live summary
- `app/boardroom/[propertyId]/page.tsx` — Boardroom shell with term, renewal, campaign, and seller-control sections


## Environment variables
Create a `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

For this scaffold, server routes use the service-role key to persist pricing strategies, seller controls, and listing-term renewals. Before production, replace this with authenticated server access and stricter authorization checks.

## Wired routes
- `POST /api/boardroom/save-strategy`
- `POST /api/boardroom/save-preferences`
- `POST /api/boardroom/renew-term`

These routes now persist:
- property tier updates
- property service selections
- boardroom preferences
- strategy-builder ledger rows
- initial listing term creation for brokerage-backed tiers
- renewal creation with a fresh quarterly ad allocation
