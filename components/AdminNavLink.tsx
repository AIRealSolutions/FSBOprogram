'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function AdminNavLink() {
  const [allowed, setAllowed] = useState(false);
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = getSupabaseBrowser();
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user ?? null;
        if (!user) return;
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (cancelled) return;
        const role = profile?.role ?? '';
        setAllowed(role === 'broker_admin' || role === 'super_admin');
        setIsSuper(role === 'super_admin');
      } catch {
        // ignore
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!allowed) return null;

  return (
    <>
      <Link className="nav-link" href="/admin">
        Admin
      </Link>
      {isSuper && (
        <Link className="nav-link" href="/superadmin/users">
          Super
        </Link>
      )}
    </>
  );
}
