import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSupabaseUserFromRequest } from '@/lib/supabaseAuthServer';

type Body = {
  propertyId: string;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  source?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const propertyId = (body.propertyId ?? '').trim();
    const name = (body.name ?? '').trim();
    const email = (body.email ?? '').trim();
    const phone = (body.phone ?? '').trim();
    const message = (body.message ?? '').trim();
    const source = (body.source ?? 'property_page').trim();

    if (!propertyId) return NextResponse.json({ ok: false, error: 'propertyId is required' }, { status: 400 });
    if (!name) return NextResponse.json({ ok: false, error: 'Name is required' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const authedUser = await getSupabaseUserFromRequest(req);
    const { data, error } = await supabase
      .from('leads')
      .insert({
        property_id: propertyId,
        submitted_by_user_id: authedUser?.id ?? null,
        name,
        email: email || null,
        phone: phone || null,
        message: message || null,
        source: source || 'property_page',
      })
      .select('id, created_at')
      .single();
    if (error) throw error;

    return NextResponse.json({ ok: true, lead: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
