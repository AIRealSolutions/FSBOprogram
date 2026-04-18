'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function AuthCallbackPage() {
  const sp = useSearchParams();
  const next = useMemo(() => sp.get('next') || '/sell', [sp]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const code = sp.get('code');
        if (!code) {
          // Some flows return an already-established session; just continue.
          window.location.href = next;
          return;
        }

        const supabase = getSupabaseBrowser();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        if (cancelled) return;
        window.location.href = next;
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Auth callback failed');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [sp, next]);

  return (
    <main className="container grid">
      <div className="card panel">
        <span className="badge">Account</span>
        <h1 style={{ margin: '10px 0 6px' }}>Finishing sign-in…</h1>
        <p className="muted">If this takes more than a few seconds, there may be a redirect URL mismatch in Supabase Auth settings.</p>
        {error && <p className="small">{error}</p>}
      </div>
    </main>
  );
}

