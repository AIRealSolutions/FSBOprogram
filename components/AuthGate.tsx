'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      const isAuthed = !!data.session?.user;
      setAuthed(isAuthed);
      setReady(true);

      if (!isAuthed) {
        const next = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);

  if (!ready || !authed) {
    return (
      <main className="container grid">
        <div className="card panel">
          <span className="badge">FSBO Program</span>
          <h1 style={{ margin: '10px 0 6px' }}>Checking your session...</h1>
          <p className="muted">If you are not signed in, we'll send you to the login screen.</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
