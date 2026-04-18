import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireBoardroomActor } from '@/lib/boardroomAuthz';

type PatchBody = {
  userId: string;
  role?: string;
  full_name?: string;
  phone?: string;
  brokerage_name?: string;
};

export async function GET(req: NextRequest) {
  try {
    const actor = await requireBoardroomActor(req);
    if (actor.role !== 'super_admin') return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, full_name, phone, brokerage_name, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ ok: true, users: data ?? [] });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireBoardroomActor(req);
    if (actor.role !== 'super_admin') return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const body = (await req.json()) as PatchBody;
    const userId = (body.userId ?? '').trim();
    if (!userId) return NextResponse.json({ ok: false, error: 'userId is required' }, { status: 400 });

    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof body.role === 'string') update.role = body.role;
    if (typeof body.full_name === 'string') update.full_name = body.full_name;
    if (typeof body.phone === 'string') update.phone = body.phone;
    if (typeof body.brokerage_name === 'string') update.brokerage_name = body.brokerage_name;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', userId)
      .select('id, role, full_name, phone, brokerage_name, created_at, updated_at')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, user: data });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status });
  }
}

