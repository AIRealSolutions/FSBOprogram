import { optionalEnv, requiredEnv } from '@/lib/env';

export type SupabaseAuthUser = {
  id: string;
  email?: string;
};

function getAccessTokenFromAuthHeader(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.toLowerCase().startsWith('bearer ')) return null;
  return trimmed.slice('bearer '.length).trim() || null;
}

export async function getSupabaseUserFromRequest(req: Request): Promise<SupabaseAuthUser | null> {
  const accessToken = getAccessTokenFromAuthHeader(req.headers.get('authorization'));
  if (!accessToken) return null;

  const url = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = optionalEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ?? optionalEnv('SUPABASE_ANON_KEY');
  if (!anonKey) {
    // Without an API key, Supabase auth endpoints will usually reject the request.
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)');
  }

  const resp = await fetch(`${url}/auth/v1/user`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
    // Avoid caching user lookups at the edge/runtime.
    cache: 'no-store',
  });

  if (!resp.ok) return null;
  const data = (await resp.json()) as { id: string; email?: string };
  if (!data?.id) return null;
  return { id: data.id, email: data.email };
}

