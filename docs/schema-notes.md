# Schema notes

## 1. Listing term model
All brokerage-backed listing agreements are modeled as 3-month terms in `listing_terms`.

- a term starts with `start_date`
- the end date is constrained to 3 months minus 1 day
- each term carries its own ad campaign allocation of up to $250
- renewals are tracked in `listing_renewals`

This gives the Boardroom a clean quarterly rhythm for renewals and marketing resets.

## 2. Quarterly ad campaign funds
Use `ad_campaign_allocations` to track the $250 allocation per 3-month term.

Recommended app behavior:
- create one allocation row when a brokerage term activates
- create a new allocation row when a term is renewed
- show the remaining amount inside the Boardroom
- require seller approval before launch if your workflow needs it

These campaign funds are always `never_creditable`.

## 3. Seller-controlled Boardroom preferences
`boardroom_preferences` is the source of truth for seller controls such as:
- seller-managed showings
- showing notice hours
- buyer-agent incentive
- dual-agency allowed
- ad-campaign auto-launch
- open-house allowed
- listing pause requested

Changes that affect MLS or brokerage disclosures can be captured here first, then reviewed and applied by admin.

## 4. Service selections
`property_service_selections` stores the chosen services for a property.

Examples:
- `boardroom_diy`
- `mls_exposure`
- `protected_closing`
- `showing_agent`
- `drone`
- `photos`

The app should upsert one row per property and service pair.

## 5. Credit handling
Use `property_payment_ledger` plus `property_credit_summary`.

Rules:
- `always_creditable` = rolls into a higher plan when policy allows
- `premium_only_creditable` = only applies if the listing qualifies for premium conversion
- `never_creditable` = campaign and ad spend plus other consumed services

The app should evaluate whether premium criteria are met before applying premium-only credit.

## 6. Recommended app-side workflows

### Save strategy
When a seller saves a plan:
1. update `properties.tier`
2. upsert selected services in `property_service_selections`
3. upsert `boardroom_preferences`
4. create or update the active `listing_terms` row if a brokerage-backed tier is selected

### Renew term
When a seller extends the listing:
1. create a new `listing_terms` row with the next 3-month dates
2. insert into `listing_renewals`
3. create a new `ad_campaign_allocations` row for that term

### Launch campaign
When a seller approves a campaign:
1. create `marketing_approvals` row if needed
2. create `ad_campaigns` row
3. decrement `spent_amount_cents` on `ad_campaign_allocations`

### Turn on agent showings in Tier 2
When the seller enables agent showings:
1. upsert the `showing_agent` service selection
2. update `boardroom_preferences.seller_managed_showings` to false
3. surface disclosure workflow before offer handling

## 7. Future agentic readiness
The connected-agent tables remain groundwork only.

Long-range goal:
- public machine-readable property feeds
- permissioned outside AI agent access
- Boardroom participation by approved tools
