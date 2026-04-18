import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { optionalEnv } from '@/lib/env';
import { getSupabaseUserFromRequest } from '@/lib/supabaseAuthServer';
import { requireCanManageProperty } from '@/lib/boardroomAuthz';
import type { PricingSelection } from '@/lib/pricing';
import { savePropertyStrategy } from '@/lib/boardroom';

type Body = {
  propertyId: string;
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
  intakeAnswers?: Record<string, unknown> | null;
};

function dollarsToCents(raw: string) {
  const cleaned = raw.replace(/[$,]/g, '').trim();
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

function safeName(raw: string) {
  return (raw || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 140);
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? '';

    let body: Body;
    let photos: File[] = [];
    let documents: File[] = [];
    let videoFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const getString = (key: string) => (form.get(key) ?? '').toString();

      const selectionRaw = getString('selection').trim();
      const intakeRaw = getString('intakeAnswers').trim();

      body = {
        propertyId: getString('propertyId'),
        title: getString('title'),
        addressLine1: getString('addressLine1'),
        addressLine2: getString('addressLine2') || undefined,
        city: getString('city'),
        state: getString('state'),
        postalCode: getString('postalCode'),
        price: getString('price'),
        beds: getString('beds') || undefined,
        baths: getString('baths') || undefined,
        squareFeet: getString('squareFeet') || undefined,
        publishNow: getString('publishNow') !== 'false',
        selection: selectionRaw ? (JSON.parse(selectionRaw) as PricingSelection) : null,
        intakeAnswers: intakeRaw ? (JSON.parse(intakeRaw) as Record<string, unknown>) : null,
      };

      photos = form.getAll('photos').filter((v): v is File => v instanceof File);
      documents = form.getAll('documents').filter((v): v is File => v instanceof File);
      const maybeVideo = form.get('video');
      videoFile = maybeVideo instanceof File ? maybeVideo : null;
    } else {
      body = (await req.json()) as Body;
    }

    const propertyId = (body.propertyId ?? '').trim();
    if (!propertyId) return NextResponse.json({ ok: false, error: 'propertyId is required' }, { status: 400 });

    // Require auth (or allow a dev/demo fallback).
    const authedUser = await getSupabaseUserFromRequest(req);
    const fallbackOwner = optionalEnv('DEFAULT_OWNER_PROFILE_ID');
    const actingUserId = authedUser?.id ?? fallbackOwner;
    if (!actingUserId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Not authenticated. Log in, or set DEFAULT_OWNER_PROFILE_ID for demo listing updates.',
        },
        { status: 401 }
      );
    }

    // Enforce authz: only the owner/broker/admin can update.
    // If we're in demo fallback mode (no authed user), only allow editing properties owned by the fallback profile.
    const supabase = getSupabaseAdmin();
    if (authedUser) {
      await requireCanManageProperty(req, propertyId);
    } else {
      const { data: propertyOwner, error: ownerError } = await supabase
        .from('properties')
        .select('owner_user_id')
        .eq('id', propertyId)
        .maybeSingle();
      if (ownerError) throw ownerError;
      if (!propertyOwner || propertyOwner.owner_user_id !== actingUserId) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
      }
    }

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

    const nowIso = new Date().toISOString();

    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update({
        title,
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
      .eq('id', propertyId)
      .select('id, slug, status, title')
      .single();
    if (updateError) throw updateError;

    // Optionally re-apply pricing selections if the caller sent them.
    // (This is safe because it is authz-gated, but sellers can also change plans from the Boardroom pricing builder.)
    if (selection) {
      await savePropertyStrategy(propertyId, selection, authedUser?.id ?? actingUserId);
    }

    // Upload intake (photos/docs/video + a JSON answer sheet) to Supabase Storage.
    const warnings: string[] = [];
    if (contentType.includes('multipart/form-data') && (photos.length || documents.length || videoFile || body.intakeAnswers)) {
      const bucket = 'property-intake';
      const uploadPrefix = `${propertyId}`;

      async function uploadFile(prefix: string, file: File) {
        const bytes = Buffer.from(await file.arrayBuffer());
        const ext = safeName(file.name);
        const path = `${uploadPrefix}/${prefix}/${Date.now()}-${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
          contentType: file.type || 'application/octet-stream',
          upsert: true,
        });
        if (error) warnings.push(`Storage upload failed for ${prefix}/${file.name}: ${error.message}`);
      }

      try {
        const answers = body.intakeAnswers ?? {};
        const payload = Buffer.from(JSON.stringify({ ...answers, uploaded_at: nowIso }, null, 2));
        const { error: answersError } = await supabase.storage.from(bucket).upload(`${uploadPrefix}/intake.json`, payload, {
          contentType: 'application/json',
          upsert: true,
        });
        if (answersError) warnings.push(`Storage upload failed for intake.json: ${answersError.message}`);

        for (const photo of photos) await uploadFile('photos', photo);
        for (const doc of documents) await uploadFile('documents', doc);
        if (videoFile) await uploadFile('video', videoFile);
      } catch (e) {
        warnings.push(e instanceof Error ? e.message : 'Storage upload failed');
      }
    }

    return NextResponse.json({ ok: true, property: updatedProperty, warnings });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}
