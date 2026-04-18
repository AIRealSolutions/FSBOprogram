'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

type UserRow = {
  id: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  brokerage_name: string | null;
  created_at: string;
  updated_at: string;
};

export default function SuperAdminUsers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? null;
      const headers: Record<string, string> = {};
      if (accessToken) headers.authorization = `Bearer ${accessToken}`;

      const res = await fetch('/api/superadmin/users', { headers, method: 'GET' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load users');
      setUsers((data.users ?? []) as UserRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const hay = [u.id, u.role, u.full_name ?? '', u.phone ?? '', u.brokerage_name ?? ''].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [users, query]);

  async function saveUser(userId: string, patch: Partial<UserRow>) {
    setSavingId(userId);
    setSaveMsg(null);
    try {
      const supabase = getSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) headers.authorization = `Bearer ${accessToken}`;

      const res = await fetch('/api/superadmin/users', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ userId, role: patch.role, full_name: patch.full_name, phone: patch.phone, brokerage_name: patch.brokerage_name }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update user');
      setUsers((prev) => prev.map((u) => (u.id === userId ? (data.user as UserRow) : u)));
      setSaveMsg('Saved.');
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSavingId(null);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  }

  if (loading) {
    return (
      <div className="card panel">
        <span className="badge">Super Admin</span>
        <h1 style={{ margin: '10px 0 6px' }}>Loading...</h1>
        <p className="muted">Pulling users.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card panel">
        <span className="badge">Super Admin</span>
        <h1 style={{ margin: '10px 0 6px' }}>Couldn't load</h1>
        <p className="muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="card panel">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
          <div>
            <span className="badge">Super Admin</span>
            <h1 style={{ margin: '10px 0 6px' }}>Users & roles</h1>
            <p className="muted" style={{ maxWidth: 980 }}>
              Promote brokers, mark agents, and control access. (Database must include the `super_admin` role in `app_role`.)
            </p>
          </div>
          <div className="field" style={{ minWidth: 320 }}>
            <label>Search</label>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="name, role, brokerage, uuid..." />
          </div>
        </div>
        {saveMsg && <p className="small muted" style={{ marginTop: 10 }}>{saveMsg}</p>}
      </div>

      <div className="card panel">
        <div className="grid" style={{ gap: 10 }}>
          {filtered.slice(0, 100).map((u) => (
            <div key={u.id} className="option">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
                    <strong style={{ maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.full_name || u.id}</strong>
                    <span className="badge">{u.role}</span>
                  </div>
                  <div className="muted small" style={{ marginTop: 6 }}>
                    {u.phone ? u.phone : ''}{u.phone && u.brokerage_name ? ' | ' : ''}{u.brokerage_name ? u.brokerage_name : ''}
                  </div>
                  <div className="muted small" style={{ marginTop: 6 }}>
                    id: {u.id}
                  </div>
                </div>

                <div className="grid" style={{ gap: 8, minWidth: 340 }}>
                  <label className="option">
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span>Role</span>
                      <select
                        value={u.role}
                        onChange={(e) => setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: e.target.value } : x)))}
                      >
                        {['buyer', 'seller', 'connected_agent', 'broker_admin', 'super_admin'].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </label>
                  <label className="option">
                    <div className="grid" style={{ gap: 6 }}>
                      <span className="small muted">Brokerage name</span>
                      <input
                        value={u.brokerage_name ?? ''}
                        onChange={(e) => setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, brokerage_name: e.target.value } : x)))}
                        placeholder="Agency / brokerage"
                      />
                    </div>
                  </label>
                  <button className="btn btn-primary" type="button" onClick={() => saveUser(u.id, u)} disabled={savingId === u.id}>
                    {savingId === u.id ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="muted small">No users match that search.</p>}
        </div>
      </div>
    </div>
  );
}

