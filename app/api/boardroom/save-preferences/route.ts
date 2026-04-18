import { NextRequest, NextResponse } from 'next/server';
import { saveBoardroomPreferences } from '@/lib/boardroom';
import { requireCanManageProperty } from '@/lib/boardroomAuthz';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const actor = await requireCanManageProperty(request, body.propertyId);
    const result = await saveBoardroomPreferences(body.propertyId, body.preferences, actor.userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    const status = typeof (error as any)?.status === 'number' ? (error as any).status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status });
  }
}
