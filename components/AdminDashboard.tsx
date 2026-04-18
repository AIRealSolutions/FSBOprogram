'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

type PropertyRow = {
  id: string;
  created_at: string;
  updated_at: string;
  owner_user_id: string;
  assigned_broker_user_id: string | null;
  title: string;
  slug: string;
  city: string;
  state: string;
  postal_code: string;
  address_line_1: string;
  address_line_2: string | null;
  status: string;
  tier: string;
  price_cents: number;
};

type LeadRow = {
  id: string;
  property_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
  properties?: { slug: string; title: string } | null;
};

function money(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = getSupabaseBrowser();
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token ?? null;
        const headers: Record<string, string> = {};
        if (accessToken) headers.authorization = `Bearer ${accessToken}`;

        const res = await fetch('/api/admin/overview', { headers, method: 'GET' });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load admin overview');
        if (cancelled) return;
        setProperties((data.properties ?? []) as PropertyRow[]);
        setLeads((data.leads ?? []) as LeadRow[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load admin overview');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((p) => {
      const hay = [
        p.title,
        p.slug,
        p.address_line_1,
        p.address_line_2 ?? '',
        p.city,
        p.state,
        p.postal_code,
        p.status,
        p.tier,
        p.owner_user_id,
        p.assigned_broker_user_id ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [properties, query]);

  if (loading) {
    return (
      <div className="card panel">
        <span className="badge">Admin</span>
        <h2 className="section-title" style={{ marginTop: 10 }}>Loading...</h2>
        <p className="muted">Pulling properties and recent leads.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card panel">
        <span className="badge">Admin</span>
        <h2 className="section-title" style={{ marginTop: 10 }}>Couldn't load</h2>
        <p className="muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="card panel">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
          <div>
            <span className="badge">Backoffice</span>
            <h1 style={{ margin: '10px 0 6px' }}>Admin dashboard</h1>
            <p className="muted" style={{ maxWidth: 920 }}>
              Manage the portfolio, triage leads, and jump into any seller Boardroom.
            </p>
          </div>
          <div className="row">
            <Link className="btn" href="/sell?new=1">
              Create listing (seller)
            </Link>
          </div>
        </div>
      </div>

      <div className="three-col">
        <div className="card kpi">
          <h3>Properties</h3>
          <strong>{properties.length}</strong>
          <div className="muted">Tracked listings</div>
        </div>
        <div className="card kpi">
          <h3>Recent leads</h3>
          <strong>{leads.length}</strong>
          <div className="muted">Last 50 inquiries</div>
        </div>
        <div className="card kpi">
          <h3>Health</h3>
          <strong>OK</strong>
          <div className="muted">API-backed</div>
        </div>
      </div>

      <div className="card panel">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
          <div>
            <h2 className="section-title">Properties</h2>
            <p className="muted small" style={{ marginTop: 6 }}>Search by address, slug, tier, status, owner id, or broker id.</p>
          </div>
          <div className="field" style={{ minWidth: 320 }}>
            <label>Search</label>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try: southport, diy, active, owner id..." />
          </div>
        </div>

        <div className="grid" style={{ gap: 10, marginTop: 10 }}>
          {filtered.slice(0, 50).map((p) => (
            <div key={p.id} className="option">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <strong>{p.title}</strong>
                  <div className="muted small" style={{ marginTop: 6 }}>
                    {p.address_line_1}{p.address_line_2 ? `, ${p.address_line_2}` : ''}, {p.city}, {p.state} {p.postal_code} | {money(p.price_cents)}
                  </div>
                  <div className="muted small" style={{ marginTop: 6 }}>
                    {p.status} | {p.tier} | owner: {p.owner_user_id.slice(0, 8)}... {p.assigned_broker_user_id ? `| broker: ${p.assigned_broker_user_id.slice(0, 8)}...` : ''}
                  </div>
                </div>
                <div className="row">
                  <Link className="btn" href={`/property/${p.slug}`} target="_blank">
                    Public
                  </Link>
                  <Link className="btn btn-primary" href={`/boardroom/${p.id}`}>
                    Boardroom
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="muted small">No properties match that search.</p>}
        </div>
      </div>

      <div className="card panel">
        <h2 className="section-title">Recent leads</h2>
        <p className="muted small" style={{ marginTop: 6 }}>Newest inquiries across all properties.</p>
        {leads.length === 0 ? (
          <p className="muted small" style={{ marginTop: 10 }}>No leads yet.</p>
        ) : (
          <div className="grid" style={{ gap: 10, marginTop: 10 }}>
            {leads.slice(0, 20).map((l, idx) => (
              <div key={l.id} className={`option ${idx === 0 ? 'active' : ''}`}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <strong>{l.name}</strong>
                    <div className="muted small" style={{ marginTop: 6 }}>
                      {l.email ? l.email : ''}{l.email && l.phone ? ' | ' : ''}{l.phone ? l.phone : ''}{(l.email || l.phone) ? ' | ' : ''}{new Date(l.created_at).toLocaleString()}
                    </div>
                    <div className="muted small" style={{ marginTop: 6 }}>
                      {l.properties?.slug ? `/${l.properties.slug}` : `property: ${l.property_id.slice(0, 8)}...`} {l.properties?.title ? `| ${l.properties.title}` : ''}
                    </div>
                    {l.message && <p className="muted small" style={{ marginTop: 8 }}>{l.message.slice(0, 240)}</p>}
                  </div>
                  <div className="row">
                    <Link className="btn btn-primary" href={`/boardroom/${l.property_id}`}>
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

