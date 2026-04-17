create extension if not exists pgcrypto;

-- enums (idempotent creation)
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('buyer', 'seller', 'broker_admin', 'connected_agent');
  end if;
  if not exists (select 1 from pg_type where typname = 'property_status') then
    create type public.property_status as enum ('draft', 'pending_review', 'active', 'under_contract', 'sold', 'expired', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'property_tier') then
    create type public.property_tier as enum ('diy', 'mls_protected', 'premium_full_service');
  end if;
  if not exists (select 1 from pg_type where typname = 'listing_term_status') then
    create type public.listing_term_status as enum ('draft', 'active', 'expiring', 'expired', 'renewed', 'cancelled', 'closed');
  end if;
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type public.lead_status as enum ('new', 'contacted', 'showing_scheduled', 'offer_discussion', 'under_contract', 'closed', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'boardroom_stage') then
    create type public.boardroom_stage as enum ('inquiry', 'contacted', 'showing', 'offer', 'under_contract', 'closed');
  end if;
  if not exists (select 1 from pg_type where typname = 'agent_connection_status') then
    create type public.agent_connection_status as enum ('requested', 'approved', 'revoked');
  end if;
  if not exists (select 1 from pg_type where typname = 'credit_rule') then
    create type public.credit_rule as enum ('always_creditable', 'premium_only_creditable', 'never_creditable');
  end if;
  if not exists (select 1 from pg_type where typname = 'approval_status') then
    create type public.approval_status as enum ('pending', 'approved', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'campaign_status') then
    create type public.campaign_status as enum ('available', 'pending_approval', 'scheduled', 'active', 'paused', 'completed', 'cancelled');
  end if;
end $$;

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'buyer',
  full_name text,
  phone text,
  brokerage_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- properties
create table if not exists public.properties (
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
create index if not exists properties_owner_idx on public.properties(owner_user_id);
create index if not exists properties_slug_idx on public.properties(slug);
create index if not exists properties_status_idx on public.properties(status);

-- service catalog and selections
create table if not exists public.service_catalog (
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
('ad_campaign_quarter','Quarterly Ad Campaign','Up to $250 ad campaign allocation for each 3-month term.', 'flat', 25000, null, 'never_creditable', array['mls_protected','premium_full_service']::public.property_tier[], false)
on conflict (code) do update set
  label = excluded.label,
  description = excluded.description,
  fee_type = excluded.fee_type,
  default_amount_cents = excluded.default_amount_cents,
  default_percent = excluded.default_percent,
  credit_rule = excluded.credit_rule,
  available_in_tiers = excluded.available_in_tiers,
  is_core_service = excluded.is_core_service;

create table if not exists public.property_service_selections (
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
create index if not exists property_service_selections_property_idx on public.property_service_selections(property_id);

-- listing terms and renewals
create table if not exists public.listing_terms (
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
create index if not exists listing_terms_property_idx on public.listing_terms(property_id, start_date desc);

create table if not exists public.listing_renewals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  prior_term_id uuid references public.listing_terms(id) on delete set null,
  new_term_id uuid references public.listing_terms(id) on delete set null,
  requested_by_user_id uuid references public.profiles(id) on delete set null,
  approved_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- boardroom seller controls
create table if not exists public.boardroom_preferences (
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

create table if not exists public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text,
  public_url text,
  media_type text not null check (media_type in ('image', 'video', 'document', 'floorplan')),
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists property_media_property_idx on public.property_media(property_id, sort_order);

create table if not exists public.property_content_blocks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  block_type text not null,
  title text,
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists property_blocks_property_idx on public.property_content_blocks(property_id, sort_order);

create table if not exists public.property_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  metric_date date not null,
  page_views integer not null default 0,
  saves integer not null default 0,
  leads integer not null default 0,
  showing_requests integer not null default 0,
  unique (property_id, metric_date)
);

create table if not exists public.leads (
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
create index if not exists leads_property_idx on public.leads(property_id, status);

create table if not exists public.boardroom_pipeline (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  stage public.boardroom_stage not null,
  note text,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_content_assets (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  asset_type text not null check (asset_type in ('headline', 'description_short', 'description_long', 'social_post', 'flyer_copy', 'community_summary', 'mortgage_blurb', 'ad_copy')),
  prompt_version text,
  content text not null,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.mortgage_scenarios (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  down_payment_percent numeric(5,2) not null,
  interest_rate numeric(5,3) not null,
  term_months integer not null,
  estimated_monthly_principal_interest_cents bigint,
  estimated_total_monthly_cents bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.community_points_of_interest (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  poi_type text not null,
  name text not null,
  distance_miles numeric(8,2),
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

-- payments and credits
create table if not exists public.property_payment_ledger (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  listing_term_id uuid references public.listing_terms(id) on delete set null,
  service_code text references public.service_catalog(code) on delete set null,
  amount_cents bigint not null check (amount_cents >= 0),
  credit_rule public.credit_rule not null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists property_payment_ledger_property_idx on public.property_payment_ledger(property_id, created_at desc);

create or replace view public.property_credit_summary as
select
  p.id as property_id,
  coalesce(sum(case when l.credit_rule = 'always_creditable' then l.amount_cents else 0 end), 0) as total_always_creditable_cents,
  coalesce(sum(case when l.credit_rule = 'premium_only_creditable' then l.amount_cents else 0 end), 0) as total_premium_only_creditable_cents,
  coalesce(sum(case when l.credit_rule = 'never_creditable' then l.amount_cents else 0 end), 0) as total_non_creditable_cents
from public.properties p
left join public.property_payment_ledger l on l.property_id = p.id
group by p.id;

-- approvals and campaigns
create table if not exists public.marketing_approvals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  item_type text not null check (item_type in ('headline', 'description', 'social_post', 'ad_campaign', 'open_house', 'photo_order', 'site_publish')),
  item_reference text,
  status public.approval_status not null default 'pending',
  requested_by_user_id uuid references public.profiles(id) on delete set null,
  approved_by_user_id uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ad_campaign_allocations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  listing_term_id uuid not null references public.listing_terms(id) on delete cascade,
  allocated_amount_cents bigint not null default 25000,
  spent_amount_cents bigint not null default 0,
  status public.campaign_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (spent_amount_cents <= allocated_amount_cents)
);
create index if not exists ad_campaign_allocations_term_idx on public.ad_campaign_allocations(listing_term_id);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  listing_term_id uuid not null references public.listing_terms(id) on delete cascade,
  allocation_id uuid references public.ad_campaign_allocations(id) on delete set null,
  name text not null,
  platform text not null,
  budget_cents bigint not null check (budget_cents >= 0),
  status public.campaign_status not null default 'pending_approval',
  targeting_summary text,
  creative_summary text,
  clicks integer not null default 0,
  leads integer not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- future connected-agent groundwork
create table if not exists public.connected_agents (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  organization_name text,
  contact_email text,
  agent_type text not null,
  verification_status text not null default 'unverified',
  created_at timestamptz not null default now()
);

create table if not exists public.agent_permissions (
  id uuid primary key default gen_random_uuid(),
  connected_agent_id uuid not null references public.connected_agents(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  scope text not null,
  status public.agent_connection_status not null default 'requested',
  granted_by_user_id uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_activity_logs (
  id uuid primary key default gen_random_uuid(),
  connected_agent_id uuid not null references public.connected_agents(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  action_type text not null,
  action_summary text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.public_property_feeds (
  property_id uuid primary key references public.properties(id) on delete cascade,
  schema_version text not null default 'v1',
  public_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- helper functions
create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.can_manage_property(p_property_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.properties p
    where p.id = p_property_id
      and (
        p.owner_user_id = auth.uid()
        or p.assigned_broker_user_id = auth.uid()
        or public.current_profile_role() = 'broker_admin'
      )
  )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'buyer')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop trigger if exists before creating it
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
