create extension if not exists pgcrypto;

-- enums
create type public.app_role as enum ('buyer', 'seller', 'broker_admin', 'connected_agent');
create type public.property_status as enum ('draft', 'pending_review', 'active', 'under_contract', 'sold', 'expired', 'archived');
create type public.property_tier as enum ('diy', 'mls_protected', 'premium_full_service');
create type public.listing_term_status as enum ('draft', 'active', 'expiring', 'expired', 'renewed', 'cancelled', 'closed');
create type public.lead_status as enum ('new', 'contacted', 'showing_scheduled', 'offer_discussion', 'under_contract', 'closed', 'archived');
create type public.boardroom_stage as enum ('inquiry', 'contacted', 'showing', 'offer', 'under_contract', 'closed');
create type public.agent_connection_status as enum ('requested', 'approved', 'revoked');
create type public.credit_rule as enum ('always_creditable', 'premium_only_creditable', 'never_creditable');
create type public.approval_status as enum ('pending', 'approved', 'rejected');
create type public.campaign_status as enum ('available', 'pending_approval', 'scheduled', 'active', 'paused', 'completed', 'cancelled');

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'buyer',
  full_name text,
  phone text,
  brokerage_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- properties
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  assigned_broker_user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  slug text not null unique,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  county text,
  state text not null default 'NC',
  postal_code text not null,
  latitude numeric,
  longitude numeric,
  price_cents bigint not null check (price_cents >= 0),
  beds numeric(4,1),
  baths numeric(4,1),
  square_feet integer,
  lot_size_acres numeric(10,2),
  year_built integer,
  hvac_details text,
  power_details text,
  gas_details text,
  water_details text,
  sewer_details text,
  annual_tax_estimate_cents bigint,
  annual_insurance_estimate_cents bigint,
  mortgage_default_rate numeric(5,3),
  down_payment_default_percent numeric(5,2),
  status public.property_status not null default 'draft',
  tier public.property_tier not null default 'diy',
  headline text,
  story text,
  community_summary text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index properties_owner_idx on public.properties(owner_user_id);
create index properties_slug_idx on public.properties(slug);
create index properties_status_idx on public.properties(status);

-- service catalog and selections
create table public.service_catalog (
  code text primary key,
  label text not null,
  description text,
  fee_type text not null check (fee_type in ('flat', 'percent', 'informational')),
  default_amount_cents bigint,
  default_percent numeric(6,3),
  credit_rule public.credit_rule not null,
  available_in_tiers public.property_tier[] not null default array['diy','mls_protected','premium_full_service']::public.property_tier[],
  is_core_service boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.service_catalog (code, label, description, fee_type, default_amount_cents, default_percent, credit_rule, available_in_tiers, is_core_service)
values
('boardroom_diy','DIY Boardroom','Basic website builder with marketing tools, seller-managed showings, and disclosures.', 'flat', 39900, null, 'always_creditable', array['diy']::public.property_tier[], true),
('mls_exposure','MLS Exposure','MLS entry and syndication.', 'percent', null, 1.0, 'always_creditable', array['mls_protected','premium_full_service']::public.property_tier[], true),
('protected_closing','Protected Closing','Broker protected closing services including disclosures, contracts, and seller support.', 'percent', null, 1.0, 'always_creditable', array['mls_protected']::public.property_tier[], true),
('full_seller_representation','Full Seller Representation','Hands-on seller representation, pricing strategy, negotiation, and closing support.', 'percent', null, 3.0, 'always_creditable', array['premium_full_service']::public.property_tier[], true),
('showing_agent','Showing Agent','Agent-performed showings as an added dual-agent path.', 'percent', null, 1.0, 'always_creditable', array['mls_protected']::public.property_tier[], false),
('buyer_agency_incentive','Buyer Agency Incentive','Optional offer of compensation to buyer agents.', 'percent', null, 0.0, 'never_creditable', array['mls_protected','premium_full_service']::public.property_tier[], false),
('dual_agency','Dual Agency','Optional dual agency incentive when properly disclosed.', 'percent', null, 1.0, 'never_creditable', array['premium_full_service','mls_protected']::public.property_tier[], false),
('premium_marketing','Premium Marketing','Premium marketing package for full-service listings.', 'informational', null, 1.0, 'premium_only_creditable', array['premium_full_service']::public.property_tier[], false),
('sign_qr','For Sale Sign with QR','Two-sided sign with QR code to property site.', 'flat', 10000, null, 'always_creditable', array['diy','mls_protected','premium_full_service']::public.property_tier[], false),
('rider_qr','Rider Sign','Two-sided rider.', 'flat', 2500, null, 'always_creditable', array['diy','mls_protected','premium_full_service']::public.property_tier[], false),
('info_box_qr','Info Box with QR','Info box linked to property site.', 'flat', 2500, null, 'always_creditable', array['diy','mls_protected','premium_full_service']::public.property_tier[], false),
('drone','Drone Service','Drone photography and footage.', 'flat', 25000, null, 'premium_only_creditable', array['mls_protected','premium_full_service']::public.property_tier[], false),
('photos','Professional Images','Professional listing photography.', 'flat', 50000, null, 'premium_only_creditable', array['mls_protected','premium_full_service']::public.property_tier[], false),
('open_house','Open House','Open house coordination and promotion.', 'informational', null, null, 'premium_only_creditable', array['premium_full_service']::public.property_tier[], false),
('ad_campaign_quarter','Quarterly Ad Campaign','Up to $250 ad campaign allocation for each 3-month term.', 'flat', 25000, null, 'never_creditable', array['mls_protected','premium_full_service']::public.property_tier[], false);

create table public.property_service_selections (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  service_code text not null references public.service_catalog(code) on delete restrict,
  selected boolean not null default false,
  amount_cents bigint,
  percent_value numeric(6,3),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, service_code)
);
create index property_service_selections_property_idx on public.property_service_selections(property_id);

-- listing terms and renewals
create table public.listing_terms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tier public.property_tier not null,
  term_number integer not null default 1,
  start_date date not null,
  end_date date not null,
  status public.listing_term_status not null default 'draft',
  auto_renew boolean not null default false,
  ad_campaign_allocation_cents bigint not null default 25000 check (ad_campaign_allocation_cents >= 0),
  created_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date = start_date + interval '3 months' - interval '1 day')
);
create index listing_terms_property_idx on public.listing_terms(property_id, start_date desc);

create table public.listing_renewals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  prior_term_id uuid references public.listing_terms(id) on delete set null,
  new_term_id uuid references public.listing_terms(id) on delete set null,
  requested_by_user_id uuid references public.profiles(id) on delete set null,
  approved_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- boardroom seller controls
create table public.boardroom_preferences (
  property_id uuid primary key references public.properties(id) on delete cascade,
  seller_managed_showings boolean not null default true,
  showing_notice_hours integer not null default 4,
  dual_agency_allowed boolean not null default false,
  buyer_agency_percent numeric(6,3) not null default 0.0,
  ad_campaign_auto_launch boolean not null default false,
  open_house_allowed boolean not null default false,
  listing_pause_requested boolean not null default false,
  allow_public_open_house_display boolean not null default false,
  last_updated_by_user_id uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text,
  public_url text,
  media_type text not null check (media_type in ('image', 'video', 'document', 'floorplan')),
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index property_media_property_idx on public.property_media(property_id, sort_order);

create table public.property_content_blocks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  block_type text not null,
  title text,
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index property_blocks_property_idx on public.property_content_blocks(property_id, sort_order);

create table public.property_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  metric_date date not null,
  page_views integer not null default 0,
  saves integer not null default 0,
  leads integer not null default 0,
  showing_requests integer not null default 0,
  unique (property_id, metric_date)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  submitted_by_user_id uuid references public.profiles(id) on delete set null,
  assigned_to_user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  message text,
  source text not null default 'property_page',
  status public.lead_status not null default 'new',
  interest_score integer,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_property_idx on public.leads(property_id);
create index leads_status_idx on public.leads(status);
