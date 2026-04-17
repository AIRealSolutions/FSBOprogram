alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_service_selections enable row level security;
alter table public.listing_terms enable row level security;
alter table public.listing_renewals enable row level security;
alter table public.boardroom_preferences enable row level security;
alter table public.property_media enable row level security;
alter table public.property_content_blocks enable row level security;
alter table public.property_metrics_daily enable row level security;
alter table public.leads enable row level security;
alter table public.boardroom_pipeline enable row level security;
alter table public.ai_content_assets enable row level security;
alter table public.mortgage_scenarios enable row level security;
alter table public.community_points_of_interest enable row level security;
alter table public.property_payment_ledger enable row level security;
alter table public.marketing_approvals enable row level security;
alter table public.ad_campaign_allocations enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.connected_agents enable row level security;
alter table public.agent_permissions enable row level security;
alter table public.agent_activity_logs enable row level security;
alter table public.public_property_feeds enable row level security;

-- profiles
create policy "profiles self read" on public.profiles
for select using (id = auth.uid() or public.current_profile_role() = 'broker_admin');

create policy "profiles self update" on public.profiles
for update using (id = auth.uid() or public.current_profile_role() = 'broker_admin');

-- public property reads
create policy "public active properties read" on public.properties
for select using (status in ('active','under_contract','sold'));

create policy "owners brokers manage properties" on public.properties
for all using (public.can_manage_property(id))
with check (public.can_manage_property(id));

create policy "owners brokers manage services" on public.property_service_selections
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "owners brokers manage terms" on public.listing_terms
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "owners brokers manage renewals" on public.listing_renewals
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "owners brokers manage preferences" on public.boardroom_preferences
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "public property media read" on public.property_media
for select using (
  exists (
    select 1 from public.properties p where p.id = property_media.property_id and p.status in ('active','under_contract','sold')
  )
);
create policy "owners brokers manage media" on public.property_media
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "public property blocks read" on public.property_content_blocks
for select using (
  exists (
    select 1 from public.properties p where p.id = property_content_blocks.property_id and p.status in ('active','under_contract','sold')
  )
);
create policy "owners brokers manage blocks" on public.property_content_blocks
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "owners brokers metrics read" on public.property_metrics_daily
for select using (public.can_manage_property(property_id));
create policy "owners brokers metrics write" on public.property_metrics_daily
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "owners brokers leads read" on public.leads
for select using (public.can_manage_property(property_id));
create policy "public lead insert" on public.leads
for insert with check (true);
create policy "owners brokers leads update" on public.leads
for update using (public.can_manage_property(property_id));

create policy "owners brokers pipeline manage" on public.boardroom_pipeline
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "owners brokers ai assets manage" on public.ai_content_assets
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "public mortgage scenarios read" on public.mortgage_scenarios
for select using (
  exists (
    select 1 from public.properties p where p.id = mortgage_scenarios.property_id and p.status in ('active','under_contract','sold')
  )
);
create policy "owners brokers mortgage manage" on public.mortgage_scenarios
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "public community poi read" on public.community_points_of_interest
for select using (
  exists (
    select 1 from public.properties p where p.id = community_points_of_interest.property_id and p.status in ('active','under_contract','sold')
  )
);
create policy "owners brokers community poi manage" on public.community_points_of_interest
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "owners brokers payments manage" on public.property_payment_ledger
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "owners brokers approvals manage" on public.marketing_approvals
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "owners brokers campaign allocations manage" on public.ad_campaign_allocations
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "owners brokers campaigns manage" on public.ad_campaigns
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

create policy "owners manage connected agents" on public.connected_agents
for all using (owner_user_id = auth.uid() or public.current_profile_role() = 'broker_admin')
with check (owner_user_id = auth.uid() or public.current_profile_role() = 'broker_admin');

create policy "owners brokers agent permissions manage" on public.agent_permissions
for all using (
  public.current_profile_role() = 'broker_admin'
  or exists (select 1 from public.properties p where p.id = agent_permissions.property_id and p.owner_user_id = auth.uid())
)
with check (
  public.current_profile_role() = 'broker_admin'
  or exists (select 1 from public.properties p where p.id = agent_permissions.property_id and p.owner_user_id = auth.uid())
);

create policy "owners brokers agent logs read" on public.agent_activity_logs
for select using (
  public.current_profile_role() = 'broker_admin'
  or exists (select 1 from public.properties p where p.id = agent_activity_logs.property_id and p.owner_user_id = auth.uid())
);

create policy "public feeds read" on public.public_property_feeds
for select using (true);
create policy "owners brokers feeds manage" on public.public_property_feeds
for all using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));
