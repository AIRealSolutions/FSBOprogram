'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function LoginClient() {
  const sp = useSearchParams();
  const next = useMemo(() => sp.get('next') || '/sell', [sp]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [state, setState] = useState<'idle' | 'working' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function loginWithPassword() {
    setState('working');
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      window.location.href = next;
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'Login failed');
    }
  }

  async function sendMagicLink() {
    setState('working');
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (otpError) throw otpError;
      setState('sent');
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'Failed to send link');
    }
  }

  return (
    <main className="container grid">
      <div className="card panel">
        <span className="badge">Account</span>
        <h1 style={{ margin: '10px 0 6px' }}>Log in</h1>
        <p className="muted">
          Use password login or a magic link. After login we&apos;ll send you to: <span style={{ fontWeight: 700 }}>{next}</span>
        </p>
      </div>

      <div className="card panel grid" style={{ maxWidth: 640 }}>
        <div className="row">
          <button className={`btn ${mode === 'password' ? 'btn-primary' : ''}`} type="button" onClick={() => setMode('password')}>
            Password
          </button>
          <button className={`btn ${mode === 'magic' ? 'btn-primary' : ''}`} type="button" onClick={() => setMode('magic')}>
            Magic link
          </button>
        </div>

        <div className="field">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>

        {mode === 'password' && (
          <div className="field">
            <label>Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </div>
        )}

        {mode === 'password' ? (
          <button className="btn btn-primary" type="button" onClick={loginWithPassword} disabled={state === 'working'}>
            {state === 'working' ? 'Signing in...' : 'Sign in'}
          </button>
        ) : (
          <button className="btn btn-primary" type="button" onClick={sendMagicLink} disabled={state === 'working' || state === 'sent'}>
            {state === 'sent' ? 'Link sent' : state === 'working' ? 'Sending...' : 'Send magic link'}
          </button>
        )}

        {error && <p className="small">{error}</p>}
        {state === 'sent' && <p className="small muted">Check your email and click the link to finish signing in.</p>}

        <p className="small muted">
          Need an account?{' '}
          <Link href={`/register?next=${encodeURIComponent(next)}`} style={{ fontWeight: 800 }}>
            Create one
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

