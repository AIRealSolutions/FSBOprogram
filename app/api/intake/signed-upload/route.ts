import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireCanManageProperty } from '@/lib/boardroomAuthz';

type FileDescriptor = {
  kind: 'photos' | 'documents' | 'video' | 'intake';
  name: string;
  contentType?: string | null;
};

type Body = {
  propertyId: string;
  files: FileDescriptor[];
};

function safeName(raw: string) {
  return (raw || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 140);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const propertyId = (body.propertyId ?? '').trim();
    if (!propertyId) return NextResponse.json({ ok: false, error: 'propertyId is required' }, { status: 400 });

    const files = Array.isArray(body.files) ? body.files : [];
    if (!files.length) return NextResponse.json({ ok: false, error: 'files is required' }, { status: 400 });

    // Only property managers (owner/broker/admin) can request signed uploads for this listing.
    await requireCanManageProperty(req, propertyId);

    const bucket = 'fsboprogram';
    const supabase = getSupabaseAdmin();

    const results: Array<{ kind: FileDescriptor['kind']; originalName: string; path: string; token: string; signedUrl: string }> = [];

    for (const f of files) {
      const kind = f.kind;
      const name = safeName(f.name);
      const isIntake = kind === 'intake';
      const prefix = isIntake ? '' : `${kind}/`;
      const filename = isIntake ? 'intake.json' : `${Date.now()}-${name}`;
      const path = `${propertyId}/${prefix}${filename}`;

      const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
      if (error || !data) {
        return NextResponse.json({ ok: false, error: error?.message || 'Failed to create signed upload URL' }, { status: 500 });
      }

      results.push({ kind, originalName: f.name, path: data.path, token: data.token, signedUrl: data.signedUrl });
    }

    return NextResponse.json({ ok: true, bucket, uploads: results });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status });
  }
}

