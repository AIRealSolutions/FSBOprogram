import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireBoardroomActor } from '@/lib/boardroomAuthz';

type Body = {
  propertyId: string;
  brokerUserId: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const actor = await requireBoardroomActor(req);
    if (actor.role !== 'super_admin') return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const body = (await req.json()) as Body;
    const propertyId = (body.propertyId ?? '').trim();
    const brokerUserId = body.brokerUserId ? body.brokerUserId.trim() : null;
    if (!propertyId) return NextResponse.json({ ok: false, error: 'propertyId is required' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('properties')
      .update({ assigned_broker_user_id: brokerUserId, updated_at: new Date().toISOString() })
      .eq('id', propertyId)
      .select('id, assigned_broker_user_id')
      .single();
    if (error) throw error;

    return NextResponse.json({ ok: true, property: data });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status });
  }
}

