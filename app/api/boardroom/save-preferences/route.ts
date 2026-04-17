import { NextRequest, NextResponse } from 'next/server';
import { saveBoardroomPreferences } from '@/lib/boardroom';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await saveBoardroomPreferences(body.propertyId, body.preferences);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
