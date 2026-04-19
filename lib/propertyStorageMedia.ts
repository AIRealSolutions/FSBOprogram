import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const BUCKET = 'fsboprogram';
const SIGNED_URL_SECONDS = 60 * 60 * 6; // 6 hours

export type StorageMediaItem = {
  path: string;
  url: string;
  name: string;
};

function isLikelyHidden(name: string) {
  return name.startsWith('.') || name === 'intake.json';
}

export async function listPropertyPhotos(propertyId: string): Promise<StorageMediaItem[]> {
  const supabase = getSupabaseAdmin();
  const folder = `${propertyId}/photos`;

  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });
  if (error) throw error;

  const files = (data ?? [])
    .filter((f) => f && typeof f.name === 'string' && f.name.length > 0)
    .filter((f) => !isLikelyHidden(f.name))
    .filter((f) => !(f.metadata as any)?.is_folder);

  const results: StorageMediaItem[] = [];
  for (const f of files) {
    const path = `${folder}/${f.name}`;
    const { data: signed, error: signedError } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
    if (signedError || !signed?.signedUrl) continue;
    results.push({ path, url: signed.signedUrl, name: f.name });
  }

  return results;
}

export async function listPropertyVideos(propertyId: string): Promise<StorageMediaItem[]> {
  const supabase = getSupabaseAdmin();
  const folder = `${propertyId}/video`;

  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    limit: 20,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });
  if (error) throw error;

  const files = (data ?? [])
    .filter((f) => f && typeof f.name === 'string' && f.name.length > 0)
    .filter((f) => !isLikelyHidden(f.name))
    .filter((f) => !(f.metadata as any)?.is_folder);

  const results: StorageMediaItem[] = [];
  for (const f of files) {
    const path = `${folder}/${f.name}`;
    const { data: signed, error: signedError } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
    if (signedError || !signed?.signedUrl) continue;
    results.push({ path, url: signed.signedUrl, name: f.name });
  }

  return results;
}

