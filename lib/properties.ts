import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export type PropertyRow = {
  id: string;
  owner_user_id: string;
  title: string;
  slug: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  price_cents: number;
  beds: number | null;
  baths: number | null;
  square_feet: number | null;
  status: string;
  tier: string;
  headline: string | null;
  story: string | null;
  community_summary: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getPropertyBySlug(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('properties')
    .select(
      'id, owner_user_id, title, slug, address_line_1, address_line_2, city, state, postal_code, price_cents, beds, baths, square_feet, status, tier, headline, story, community_summary, published_at, created_at, updated_at'
    )
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as PropertyRow | null;
}

export async function getPropertyById(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('properties')
    .select(
      'id, owner_user_id, title, slug, address_line_1, address_line_2, city, state, postal_code, price_cents, beds, baths, square_feet, status, tier, headline, story, community_summary, published_at, created_at, updated_at'
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as PropertyRow | null;
}

export async function getActiveListingTerm(propertyId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('listing_terms')
    .select('id, term_number, start_date, end_date, status, tier, ad_campaign_allocation_cents')
    .eq('property_id', propertyId)
    .in('status', ['draft', 'active', 'expiring'])
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as null | {
    id: string;
    term_number: number;
    start_date: string;
    end_date: string;
    status: string;
    tier: string;
    ad_campaign_allocation_cents: number;
  };
}

export async function getRecentLeads(propertyId: string, limit = 5) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('leads')
    .select('id, name, message, status, created_at')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string; message: string | null; status: string; created_at: string }>;
}
