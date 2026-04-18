'use client';

import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function LeadCaptureForm({ propertyId, defaultMessage }: { propertyId: string; defaultMessage: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: defaultMessage });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setState('sending');
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? null;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) headers.authorization = `Bearer ${accessToken}`;

      const res = await fetch('/api/leads/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({ propertyId, ...form }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to send inquiry');
      setState('sent');
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'Failed to send inquiry');
    }
  }

  return (
    <div className="grid">
      <div className="field"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="field"><label>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div className="field"><label>Message</label><textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={submit} disabled={state === 'sending' || state === 'sent' || !form.name.trim()}>
        {state === 'sending' ? 'Sending...' : state === 'sent' ? 'Sent' : 'Send inquiry'}
      </button>
      {error && <p className="small">{error}</p>}
      {state === 'sent' && <p className="small muted">Thanks. The seller has your message.</p>}
    </div>
  );
}
