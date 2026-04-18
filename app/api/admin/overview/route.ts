import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireBoardroomActor } from '@/lib/boardroomAuthz';

export async function GET(req: NextRequest) {
  try {
    const actor = await requireBoardroomActor(req);
    if (actor.role !== 'broker_admin' && actor.role !== 'super_admin') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, created_at, updated_at, owner_user_id, assigned_broker_user_id, title, slug, city, state, postal_code, address_line_1, address_line_2, status, tier, price_cents')
      .order('created_at', { ascending: false })
      .limit(100);
    if (propertiesError) throw propertiesError;

    // Try to pull leads with a join to properties for context (relationship name depends on FK; this is the common default).
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, property_id, name, email, phone, message, status, created_at, properties ( slug, title )')
      .order('created_at', { ascending: false })
      .limit(50);
    if (leadsError) {
      // If the join fails, fall back to the base lead fields so the backoffice still works.
      const { data: leadsFallback, error: fallbackError } = await supabase
        .from('leads')
        .select('id, property_id, name, email, phone, message, status, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (fallbackError) throw fallbackError;
      return NextResponse.json({ ok: true, properties: properties ?? [], leads: leadsFallback ?? [], joinMode: 'fallback' });
    }

    return NextResponse.json({ ok: true, properties: properties ?? [], leads: leads ?? [], joinMode: 'properties_join' });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}
