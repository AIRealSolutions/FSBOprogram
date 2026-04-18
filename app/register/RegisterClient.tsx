'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function RegisterClient() {
  const sp = useSearchParams();
  const next = useMemo(() => sp.get('next') || '/sell', [sp]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<'idle' | 'working' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function register() {
    setState('working');
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (signUpError) throw signUpError;
      setState('sent');
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'Registration failed');
    }
  }

  return (
    <main className="container grid">
      <div className="card panel">
        <span className="badge">Account</span>
        <h1 style={{ margin: '10px 0 6px' }}>Create your account</h1>
        <p className="muted">
          After signup/confirmation we&apos;ll send you to: <span style={{ fontWeight: 700 }}>{next}</span>
        </p>
      </div>

      <div className="card panel grid" style={{ maxWidth: 640 }}>
        <div className="field">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        </div>

        <button className="btn btn-primary" type="button" onClick={register} disabled={state === 'working' || state === 'sent'}>
          {state === 'sent' ? 'Check your email' : state === 'working' ? 'Creating...' : 'Create account'}
        </button>

        {error && <p className="small">{error}</p>}
        {state === 'sent' && <p className="small muted">If email confirmation is enabled in Supabase, check your inbox to confirm and finish signing in.</p>}

        <p className="small muted">
          Already have an account?{' '}
          <Link href={`/login?next=${encodeURIComponent(next)}`} style={{ fontWeight: 800 }}>
            Log in
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

