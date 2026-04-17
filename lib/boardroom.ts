import { Selection, calculatePricing } from '@/lib/pricing';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const TODAY = () => new Date();

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addMonthsMinusDay(start: Date, months: number) {
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  end.setDate(end.getDate() - 1);
  return end;
}

function selectedServiceRows(selection: Selection) {
  const rows: Array<{ service_code: string; selected: boolean; amount_cents: number | null; percent_value: number | null; metadata?: Record<string, unknown> }> = [];

  if (selection.tier === 'diy') {
    rows.push({ service_code: 'boardroom_diy', selected: true, amount_cents: 39900, percent_value: null });
  }
  if (selection.tier === 'mls_protected') {
    rows.push({ service_code: 'mls_exposure', selected: true, amount_cents: null, percent_value: 1.0 });
    rows.push({ service_code: 'protected_closing', selected: true, amount_cents: null, percent_value: 1.0 });
    if (!selection.sellerHandlesShowings || selection.showingAgentEnabled) {
      rows.push({ service_code: 'showing_agent', selected: true, amount_cents: null, percent_value: 1.0 });
    }
  }
  if (selection.tier === 'premium_full_service') {
    rows.push({ service_code: 'full_seller_representation', selected: true, amount_cents: null, percent_value: 3.0 });
    rows.push({ service_code: 'premium_marketing', selected: true, amount_cents: null, percent_value: 1.0 });
  }
  if (selection.tier !== 'diy' && selection.buyerAgencyPercent > 0) {
    rows.push({ service_code: 'buyer_agency_incentive', selected: true, amount_cents: null, percent_value: selection.buyerAgencyPercent });
  }
  if (selection.dualAgencyEnabled) {
    rows.push({ service_code: 'dual_agency', selected: true, amount_cents: null, percent_value: 1.0 });
  }
  if (selection.addOns.sign) rows.push({ service_code: 'sign_qr', selected: true, amount_cents: 10000, percent_value: null });
  if (selection.addOns.rider) rows.push({ service_code: 'rider_qr', selected: true, amount_cents: 2500, percent_value: null });
  if (selection.addOns.infoBox) rows.push({ service_code: 'info_box_qr', selected: true, amount_cents: 2500, percent_value: null });
  if (selection.addOns.drone) rows.push({ service_code: 'drone', selected: true, amount_cents: 25000, percent_value: null });
  if (selection.addOns.photos) rows.push({ service_code: 'photos', selected: true, amount_cents: 50000, percent_value: null });

  return rows;
}

export async function savePropertyStrategy(propertyId: string, selection: Selection) {
  const supabase = getSupabaseAdmin();
  const pricing = calculatePricing(selection);

  const { error: propertyError } = await supabase
    .from('properties')
    .update({ tier: selection.tier, updated_at: new Date().toISOString() })
    .eq('id', propertyId);
  if (propertyError) throw propertyError;

  const serviceRows = selectedServiceRows(selection).map((row) => ({
    property_id: propertyId,
    service_code: row.service_code,
    selected: row.selected,
    amount_cents: row.amount_cents,
    percent_value: row.percent_value,
    metadata: row.metadata ?? {},
  }));

  const { error: deleteServicesError } = await supabase
    .from('property_service_selections')
    .delete()
    .eq('property_id', propertyId);
  if (deleteServicesError) throw deleteServicesError;

  if (serviceRows.length) {
    const { error: insertServicesError } = await supabase
      .from('property_service_selections')
      .insert(serviceRows);
    if (insertServicesError) throw insertServicesError;
  }

  const { error: prefsError } = await supabase
    .from('boardroom_preferences')
    .upsert({
      property_id: propertyId,
      seller_managed_showings: selection.sellerHandlesShowings,
      dual_agency_allowed: selection.dualAgencyEnabled,
      buyer_agency_percent: selection.buyerAgencyPercent,
      open_house_allowed: selection.tier === 'premium_full_service',
      updated_at: new Date().toISOString(),
    });
  if (prefsError) throw prefsError;

  const { error: deleteLedgerError } = await supabase
    .from('property_payment_ledger')
    .delete()
    .eq('property_id', propertyId)
    .eq('notes', 'strategy_builder');
  if (deleteLedgerError) throw deleteLedgerError;

  const ledgerRows = [] as Array<{ property_id: string; service_code: string; amount_cents: number; credit_rule: 'always_creditable' | 'premium_only_creditable' | 'never_creditable'; notes: string }>;
  if (selection.tier === 'diy') ledgerRows.push({ property_id: propertyId, service_code: 'boardroom_diy', amount_cents: 39900, credit_rule: 'always_creditable', notes: 'strategy_builder' });
  if (selection.addOns.sign) ledgerRows.push({ property_id: propertyId, service_code: 'sign_qr', amount_cents: 10000, credit_rule: 'always_creditable', notes: 'strategy_builder' });
  if (selection.addOns.rider) ledgerRows.push({ property_id: propertyId, service_code: 'rider_qr', amount_cents: 2500, credit_rule: 'always_creditable', notes: 'strategy_builder' });
  if (selection.addOns.infoBox) ledgerRows.push({ property_id: propertyId, service_code: 'info_box_qr', amount_cents: 2500, credit_rule: 'always_creditable', notes: 'strategy_builder' });
  if (selection.addOns.drone) ledgerRows.push({ property_id: propertyId, service_code: 'drone', amount_cents: 25000, credit_rule: 'premium_only_creditable', notes: 'strategy_builder' });
  if (selection.addOns.photos) ledgerRows.push({ property_id: propertyId, service_code: 'photos', amount_cents: 50000, credit_rule: 'premium_only_creditable', notes: 'strategy_builder' });

  if (ledgerRows.length) {
    const { error: ledgerError } = await supabase.from('property_payment_ledger').insert(ledgerRows);
    if (ledgerError) throw ledgerError;
  }

  let activeTermId: string | null = null;
  if (selection.tier !== 'diy') {
    const { data: existingTerm, error: termLookupError } = await supabase
      .from('listing_terms')
      .select('id, term_number, status, start_date, end_date')
      .eq('property_id', propertyId)
      .in('status', ['draft', 'active', 'expiring'])
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (termLookupError) throw termLookupError;

    if (existingTerm) {
      activeTermId = existingTerm.id;
    } else {
      const startDate = TODAY();
      const endDate = addMonthsMinusDay(startDate, 3);
      const { data: newTerm, error: termError } = await supabase
        .from('listing_terms')
        .insert({
          property_id: propertyId,
          tier: selection.tier,
          term_number: 1,
          start_date: toISODate(startDate),
          end_date: toISODate(endDate),
          status: 'active',
          ad_campaign_allocation_cents: 25000,
        })
        .select('id')
        .single();
      if (termError) throw termError;
      activeTermId = newTerm.id;

      const { error: allocError } = await supabase.from('ad_campaign_allocations').insert({
        property_id: propertyId,
        listing_term_id: activeTermId,
        allocated_amount_cents: 25000,
        spent_amount_cents: 0,
        status: 'available',
      });
      if (allocError) throw allocError;
    }
  }

  return {
    ok: true,
    pricing,
    activeTermId,
  };
}

export async function saveBoardroomPreferences(propertyId: string, payload: {
  sellerManagedShowings: boolean;
  showingNoticeHours: number;
  dualAgencyAllowed: boolean;
  buyerAgencyPercent: number;
  adCampaignAutoLaunch: boolean;
  openHouseAllowed: boolean;
  listingPauseRequested: boolean;
  allowPublicOpenHouseDisplay: boolean;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('boardroom_preferences').upsert({
    property_id: propertyId,
    seller_managed_showings: payload.sellerManagedShowings,
    showing_notice_hours: payload.showingNoticeHours,
    dual_agency_allowed: payload.dualAgencyAllowed,
    buyer_agency_percent: payload.buyerAgencyPercent,
    ad_campaign_auto_launch: payload.adCampaignAutoLaunch,
    open_house_allowed: payload.openHouseAllowed,
    listing_pause_requested: payload.listingPauseRequested,
    allow_public_open_house_display: payload.allowPublicOpenHouseDisplay,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return { ok: true };
}

export async function renewListingTerm(propertyId: string) {
  const supabase = getSupabaseAdmin();
  const { data: priorTerm, error: priorTermError } = await supabase
    .from('listing_terms')
    .select('id, term_number, end_date, tier')
    .eq('property_id', propertyId)
    .in('status', ['active', 'expiring'])
    .order('start_date', { ascending: false })
    .limit(1)
    .single();
  if (priorTermError) throw priorTermError;

  const startDate = new Date(priorTerm.end_date + 'T00:00:00Z');
  startDate.setDate(startDate.getDate() + 1);
  const endDate = addMonthsMinusDay(startDate, 3);

  const { data: newTerm, error: newTermError } = await supabase
    .from('listing_terms')
    .insert({
      property_id: propertyId,
      tier: priorTerm.tier,
      term_number: priorTerm.term_number + 1,
      start_date: toISODate(startDate),
      end_date: toISODate(endDate),
      status: 'active',
      ad_campaign_allocation_cents: 25000,
    })
    .select('id, start_date, end_date, term_number')
    .single();
  if (newTermError) throw newTermError;

  const { error: renewalError } = await supabase.from('listing_renewals').insert({
    property_id: propertyId,
    prior_term_id: priorTerm.id,
    new_term_id: newTerm.id,
  });
  if (renewalError) throw renewalError;

  const { error: allocError } = await supabase.from('ad_campaign_allocations').insert({
    property_id: propertyId,
    listing_term_id: newTerm.id,
    allocated_amount_cents: 25000,
    spent_amount_cents: 0,
    status: 'available',
  });
  if (allocError) throw allocError;

  const { error: closePriorError } = await supabase.from('listing_terms').update({ status: 'renewed', updated_at: new Date().toISOString() }).eq('id', priorTerm.id);
  if (closePriorError) throw closePriorError;

  return { ok: true, newTerm };
}
