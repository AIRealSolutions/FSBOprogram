import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { makePropertySlug } from '@/lib/slug';
import { optionalEnv } from '@/lib/env';
import { getSupabaseUserFromRequest } from '@/lib/supabaseAuthServer';
import { savePropertyStrategy } from '@/lib/boardroom';
import type { PricingSelection } from '@/lib/pricing';

type Body = {
  title: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  price: string;
  beds?: string;
  baths?: string;
  squareFeet?: string;
  publishNow?: boolean;
  selection?: PricingSelection | null;
};

function dollarsToCents(raw: string) {
  const cleaned = raw.replace(/[$,]/g, '').trim();
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    const title = (body.title ?? '').trim();
    const addressLine1 = (body.addressLine1 ?? '').trim();
    const addressLine2 = (body.addressLine2 ?? '').trim();
    const city = (body.city ?? '').trim();
    const state = (body.state ?? '').trim().toUpperCase();
    const postalCode = (body.postalCode ?? '').trim();
    const priceCents = dollarsToCents(body.price ?? '');
    const beds = body.beds ? Number(body.beds) : null;
    const baths = body.baths ? Number(body.baths) : null;
    const squareFeet = body.squareFeet ? Number(body.squareFeet) : null;
    const publishNow = body.publishNow !== false;
    const selection = (body.selection ?? null) as PricingSelection | null;

    if (!title) return NextResponse.json({ ok: false, error: 'Title is required' }, { status: 400 });
    if (!addressLine1 || !city || !state || !postalCode) return NextResponse.json({ ok: false, error: 'Address, city, state, and ZIP are required' }, { status: 400 });
    if (priceCents === null) return NextResponse.json({ ok: false, error: 'Price is required' }, { status: 400 });

    if (beds !== null && (!Number.isFinite(beds) || beds < 0)) return NextResponse.json({ ok: false, error: 'Beds must be a number' }, { status: 400 });
    if (baths !== null && (!Number.isFinite(baths) || baths < 0)) return NextResponse.json({ ok: false, error: 'Baths must be a number' }, { status: 400 });
    if (squareFeet !== null && (!Number.isFinite(squareFeet) || squareFeet < 0)) return NextResponse.json({ ok: false, error: 'Square feet must be a number' }, { status: 400 });

    // Prefer the logged-in user, but allow a dev/demo fallback.
    const authedUser = await getSupabaseUserFromRequest(req);
    const fallbackOwner = optionalEnv('DEFAULT_OWNER_PROFILE_ID');
    const ownerUserId = authedUser?.id ?? fallbackOwner;
    if (!ownerUserId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Not authenticated. Log in, or set DEFAULT_OWNER_PROFILE_ID for demo listing creation.',
        },
        { status: 401 }
      );
    }

    const baseSlug = makePropertySlug({ addressLine1, city, state, postalCode });
    const supabase = getSupabaseAdmin();

    const nowIso = new Date().toISOString();
    async function insertWithSlug(slug: string) {
      return supabase
        .from('properties')
        .insert({
          owner_user_id: ownerUserId,
          title,
          slug,
          address_line_1: addressLine1,
          address_line_2: addressLine2 || null,
          city,
          state,
          postal_code: postalCode,
          price_cents: priceCents,
          beds: beds === null ? null : beds,
          baths: baths === null ? null : baths,
          square_feet: squareFeet === null ? null : squareFeet,
          status: publishNow ? 'active' : 'draft',
          published_at: publishNow ? nowIso : null,
          updated_at: nowIso,
        })
        .select('id, slug, status, title')
        .single();
    }

    let propertySlug = baseSlug;
    let inserted = await insertWithSlug(propertySlug);
    if (inserted.error && (inserted.error as { code?: string }).code === '23505') {
      // Unique violation, likely slug collision.
      const suffix = Math.random().toString(36).slice(2, 6);
      propertySlug = `${baseSlug}-${suffix}`;
      inserted = await insertWithSlug(propertySlug);
    }
    if (inserted.error) throw inserted.error;
    const property = inserted.data;

    // Create an initial preferences row for the Boardroom.
    await supabase.from('boardroom_preferences').upsert({
      property_id: property.id,
      last_updated_by_user_id: authedUser?.id ?? null,
      updated_at: nowIso,
    });

    // If onboarding included a pricing selection, apply it now that identity is known and property exists.
    if (selection) {
      await savePropertyStrategy(property.id, selection, authedUser?.id ?? ownerUserId);
    }

    return NextResponse.json({ ok: true, property, ownerMode: authedUser ? 'auth' : 'default' });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
