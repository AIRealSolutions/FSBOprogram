'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BoardroomControls from '@/components/BoardroomControls';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import { DIY_FEE_AFTER_TRIAL_CENTS, DIY_TRIAL_DAYS } from '@/lib/pricing';

type Property = {
  id: string;
  owner_user_id: string;
  assigned_broker_user_id: string | null;
  created_at: string;
  title: string;
  slug: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  price_cents: number;
  status: string;
  tier: string;
};

type Term = {
  id: string;
  term_number: number;
  start_date: string;
  end_date: string;
  status: string;
  ad_campaign_allocation_cents: number;
};

type Lead = { id: string; name: string; message: string | null; status: string; created_at: string };

function money(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function BoardroomPage({ params }: { params: { propertyId: string } }) {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [term, setTerm] = useState<Term | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);

  const publicUrl = useMemo(() => (property ? `/property/${property.slug}` : '#'), [property]);
  const addressLine = useMemo(() => {
    if (!property) return '';
    return `${property.address_line_1}${property.address_line_2 ? `, ${property.address_line_2}` : ''}, ${property.city}, ${property.state} ${property.postal_code}`;
  }, [property]);

  const diyTrial = useMemo(() => {
    if (!property || property.tier !== 'diy') return null;
    const start = new Date(property.created_at);
    const end = new Date(start);
    end.setDate(end.getDate() + DIY_TRIAL_DAYS);

    const now = new Date();
    const msLeft = end.getTime() - now.getTime();
    const ended = msLeft <= 0;
    const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    const dayNumber = Math.min(DIY_TRIAL_DAYS, Math.max(1, DIY_TRIAL_DAYS - daysLeft + 1));

    return { ended, daysLeft, dayNumber };
  }, [property]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setForbidden(false);
      try {
        const supabase = getSupabaseBrowser();

        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!user) {
          window.location.href = `/login?next=${encodeURIComponent(`/boardroom/${params.propertyId}`)}`;
          return;
        }

        const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (profileError) throw profileError;

        const { data: propertyRow, error: propertyError } = await supabase
          .from('properties')
          .select('id, owner_user_id, assigned_broker_user_id, created_at, title, slug, address_line_1, address_line_2, city, state, postal_code, price_cents, status, tier')
          .eq('id', params.propertyId)
          .maybeSingle();
        if (propertyError) throw propertyError;
        if (!propertyRow) {
          setError('Property not found.');
          return;
        }

        const role = profile?.role ?? 'buyer';
        const allowed = role === 'broker_admin' || role === 'super_admin' || propertyRow.owner_user_id === user.id || propertyRow.assigned_broker_user_id === user.id;
        if (!allowed) {
          setForbidden(true);
          return;
        }

        if (cancelled) return;
        setProperty(propertyRow as Property);

        const { data: termRow, error: termError } = await supabase
          .from('listing_terms')
          .select('id, term_number, start_date, end_date, status, ad_campaign_allocation_cents')
          .eq('property_id', params.propertyId)
          .in('status', ['draft', 'active', 'expiring'])
          .order('start_date', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (termError) throw termError;
        if (!cancelled) setTerm((termRow as Term) ?? null);

        const { data: leadsRows, error: leadsError } = await supabase
          .from('leads')
          .select('id, name, message, status, created_at')
          .eq('property_id', params.propertyId)
          .order('created_at', { ascending: false })
          .limit(6);
        if (leadsError) throw leadsError;
        if (!cancelled) setRecentLeads((leadsRows as Lead[]) ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load Boardroom');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.propertyId]);

  if (loading) {
    return (
      <main className="container grid">
        <div className="card panel">
          <span className="badge">The Boardroom</span>
          <h1 style={{ margin: '10px 0 6px' }}>Loading...</h1>
          <p className="muted">Pulling your property, term, and lead data.</p>
        </div>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className="container grid">
        <div className="card panel">
          <span className="badge">The Boardroom</span>
          <h1 style={{ margin: '10px 0 6px' }}>Access denied</h1>
          <p className="muted">You're signed in, but you don't have permission to manage this property.</p>
          <div className="row">
            <Link className="btn" href="/">
              Go home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="container grid">
        <div className="card panel">
          <span className="badge">The Boardroom</span>
          <h1 style={{ margin: '10px 0 6px' }}>Couldn't load</h1>
          <p className="muted">{error || 'Unknown error'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container grid">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <span className="badge">The Boardroom</span>
          <h1 style={{ marginBottom: 6 }}>{property.title}</h1>
          <div className="muted">{addressLine}</div>
        </div>
        <div className="row">
          <Link className="btn" href={publicUrl} target="_blank">
            View public page
          </Link>
          <Link className="btn" href={`/boardroom/pricing?propertyId=${encodeURIComponent(property.id)}`}>
            Pricing builder
          </Link>
        </div>
      </div>

      {property.tier === 'diy' && diyTrial && (
        <div className="card panel" style={{ marginTop: 14 }}>
          <span className="badge">{diyTrial.ended ? 'DIY Trial Ended' : 'DIY Trial Active'}</span>
          <h2 className="section-title" style={{ marginTop: 10 }}>
            {diyTrial.ended ? 'Continue DIY or upgrade' : `Day ${diyTrial.dayNumber} of ${DIY_TRIAL_DAYS}`}
          </h2>
          <p className="muted" style={{ maxWidth: 860 }}>
            {diyTrial.ended
              ? `Your ${DIY_TRIAL_DAYS}-day trial is complete. To stay on DIY Boardroom, the $${(DIY_FEE_AFTER_TRIAL_CENTS / 100).toFixed(0)} fee is due now. Or upgrade to Hybrid / Full Service to avoid the upfront DIY fee.`
              : `You have ${diyTrial.daysLeft} day${diyTrial.daysLeft === 1 ? '' : 's'} left in your trial. Continue DIY for $${(DIY_FEE_AFTER_TRIAL_CENTS / 100).toFixed(0)} after the trial, or upgrade to avoid the upfront DIY fee.`}
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            {diyTrial.ended && (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => window.alert('DIY payments are not wired yet. For now, upgrade tiers or contact support to continue.')}
              >
                Continue DIY (${(DIY_FEE_AFTER_TRIAL_CENTS / 100).toFixed(0)})
              </button>
            )}
            <Link className="btn" href={`/boardroom/pricing?propertyId=${encodeURIComponent(property.id)}`}>
              Upgrade plan
            </Link>
          </div>
        </div>
      )}

      <div className="three-col">
        <div className="card kpi">
          <h3>Status</h3>
          <strong style={{ textTransform: 'capitalize' }}>{property.status.replace(/_/g, ' ')}</strong>
          <div className="muted small">{money(property.price_cents)}</div>
        </div>
        <div className="card kpi">
          <h3>Current term</h3>
          <strong>{term ? `Term ${term.term_number}` : '-'}</strong>
          <div className="muted small">{term ? `${term.start_date} -> ${term.end_date}` : 'No term yet'}</div>
        </div>
        <div className="card kpi">
          <h3>Campaign allocation</h3>
          <strong>{term ? money(term.ad_campaign_allocation_cents) : '$0'}</strong>
          <div className="muted small">{term ? term.status : '-'}</div>
        </div>
      </div>

      <div className="two-col">
        <div className="grid">
          <div className="card panel">
            <h2 className="section-title">The Table</h2>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Tier</span><strong style={{ textTransform: 'capitalize' }}>{property.tier.replace(/_/g, ' ')}</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Status</span><strong style={{ textTransform: 'capitalize' }}>{property.status.replace(/_/g, ' ')}</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Slug</span><strong>{property.slug}</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Public</span><strong>{['active', 'under_contract', 'sold'].includes(property.status) ? 'Visible' : 'Hidden'}</strong></div>
          </div>

          <div className="card panel">
            <h2 className="section-title">Marketing Wing</h2>
            <div className="row"><button className="btn" type="button">Edit property site</button><button className="btn" type="button">Approve social post</button><button className="btn" type="button">Request open house</button></div>
            <p className="muted small" style={{ marginTop: 10 }}>Seller controls creative approvals, featured photo order, ad approvals, and whether open house items appear publicly.</p>
          </div>

          <div className="card panel">
            <h2 className="section-title">Showing Center</h2>
            <div className="row"><button className="btn" type="button">Update preferences</button><button className="btn" type="button">View showing feedback</button></div>
            <p className="muted small" style={{ marginTop: 10 }}>Showings and agent-showing modules will be wired in Phase 3.</p>
          </div>

          <div className="card panel">
            <h2 className="section-title">Deal Room</h2>
            {recentLeads.length === 0 ? (
              <p className="muted small">No leads yet. Once your public page is live, inquiries will show up here.</p>
            ) : (
              <div className="grid" style={{ gap: 10 }}>
                {recentLeads.map((lead, idx) => (
                  <div key={lead.id} className={`option ${idx === 0 ? 'active' : ''}`}>
                    <strong>{lead.name}</strong>
                    <p className="muted small" style={{ margin: '6px 0 0' }}>
                      {lead.message?.slice(0, 160) || 'No message provided.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid sticky">
          <div className="card panel">
            <h2 className="section-title">Renewal & Term</h2>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Start</span><strong>{term?.start_date ?? '-'}</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>End</span><strong>{term?.end_date ?? '-'}</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Extension option</span><strong>+3 months</strong></div>
            <p className="muted small">Extending adds another quarter of service and preserves Boardroom history.</p>
          </div>

          <div className="card panel">
            <h2 className="section-title">Campaign Control</h2>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Campaign status</span><strong>Available</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Budget this term</span><strong>{term ? money(term.ad_campaign_allocation_cents) : '$0'}</strong></div>
            <div className="row"><button className="btn" type="button">Approve creative</button><button className="btn btn-primary" type="button">Launch campaign</button></div>
            <p className="muted small">Campaign money is used in-term and does not convert into closing credit.</p>
          </div>

          <BoardroomControls propertyId={params.propertyId} />

          <div className="card panel">
            <h2 className="section-title">Investment Summary</h2>
            <p className="muted small">Investment summary can be computed from `property_payment_ledger` once payments are wired.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
