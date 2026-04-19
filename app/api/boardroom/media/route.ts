import { NextRequest, NextResponse } from 'next/server';
import { requireCanManageProperty } from '@/lib/boardroomAuthz';
import { listPropertyPhotos, listPropertyVideos } from '@/lib/propertyStorageMedia';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const propertyId = (url.searchParams.get('propertyId') ?? '').trim();
    if (!propertyId) return NextResponse.json({ ok: false, error: 'propertyId is required' }, { status: 400 });

    await requireCanManageProperty(req, propertyId);

    const [photos, videos] = await Promise.all([listPropertyPhotos(propertyId), listPropertyVideos(propertyId)]);
    return NextResponse.json({ ok: true, photos, videos });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status });
  }
}

