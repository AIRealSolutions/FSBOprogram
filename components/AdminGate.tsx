'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const supabase = getSupabaseBrowser();
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user ?? null;
        if (!user) {
          const next = `${window.location.pathname}${window.location.search || ''}`;
          window.location.href = `/login?next=${encodeURIComponent(next)}`;
          return;
        }

        const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (profileError) throw profileError;

        if (cancelled) return;
        const role = profile?.role ?? 'buyer';
        setAllowed(role === 'broker_admin');
        setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to check admin access');
          setReady(true);
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <main className="container grid">
        <div className="card panel">
          <span className="badge">Admin</span>
          <h1 style={{ margin: '10px 0 6px' }}>Loading...</h1>
          <p className="muted">Checking access.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container grid">
        <div className="card panel">
          <span className="badge">Admin</span>
          <h1 style={{ margin: '10px 0 6px' }}>Couldn't load</h1>
          <p className="muted">{error}</p>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="container grid">
        <div className="card panel">
          <span className="badge">Admin</span>
          <h1 style={{ margin: '10px 0 6px' }}>Access denied</h1>
          <p className="muted">Your account is signed in, but it is not marked as a broker admin.</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

