'use client';

import { useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

type CreatePayload = {
  title: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  price: string;
  beds?: string;
  baths?: string;
  squareFeet?: string;
  publishNow: boolean;
};

function dollarsToCents(raw: string) {
  const cleaned = raw.replace(/[$,]/g, '').trim();
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export default function SellWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreatePayload>({
    title: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'NC',
    postalCode: '',
    price: '',
    beds: '',
    baths: '',
    squareFeet: '',
    publishNow: true,
  });

  const priceCents = useMemo(() => dollarsToCents(form.price), [form.price]);

  async function createListing() {
    setError(null);
    setSubmitting(true);
    try {
      // Forward the access token so the server can attach the real owner_user_id.
      const supabase = getSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? null;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) headers.authorization = `Bearer ${accessToken}`;

      const response = await fetch('/api/properties/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to create listing');
      window.location.href = `/boardroom/${data.property.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="two-col">
      <div className="grid">
        <div className="card panel">
          <span className="badge">Sell your home</span>
          <h1 style={{ margin: '10px 0 6px' }}>Create your listing</h1>
          <p className="muted" style={{ maxWidth: 760 }}>
            This is the first step of the all-in-one sales engine: get your public page live, start capturing leads, and manage everything from the Boardroom.
          </p>
        </div>

        <div className="card panel">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>Step {step} of 3</strong>
            <div className="row">
              <button className="btn" onClick={() => setStep(1)} disabled={step === 1}>
                Property
              </button>
              <button className="btn" onClick={() => setStep(2)} disabled={step === 2}>
                Basics
              </button>
              <button className="btn" onClick={() => setStep(3)} disabled={step === 3}>
                Publish
              </button>
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="card panel grid">
            <h2 className="section-title">Property location</h2>
            <div className="field">
              <label>Address line 1</label>
              <input value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} placeholder="123 Coastal Drive" />
            </div>
            <div className="field">
              <label>Address line 2 (optional)</label>
              <input value={form.addressLine2 ?? ''} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} placeholder="Unit 4B" />
            </div>
            <div className="three-col">
              <div className="field">
                <label>City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Southport" />
              </div>
              <div className="field">
                <label>State</label>
                <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} placeholder="NC" />
              </div>
              <div className="field">
                <label>ZIP</label>
                <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="28461" />
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card panel grid">
            <h2 className="section-title">Listing basics</h2>
            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Charming coastal cottage with a screened porch" />
            </div>
            <div className="three-col">
              <div className="field">
                <label>Price</label>
                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="$425,000" />
              </div>
              <div className="field">
                <label>Beds</label>
                <input value={form.beds ?? ''} onChange={(e) => setForm({ ...form, beds: e.target.value })} placeholder="3" />
              </div>
              <div className="field">
                <label>Baths</label>
                <input value={form.baths ?? ''} onChange={(e) => setForm({ ...form, baths: e.target.value })} placeholder="2" />
              </div>
            </div>
            <div className="field">
              <label>Square feet (optional)</label>
              <input value={form.squareFeet ?? ''} onChange={(e) => setForm({ ...form, squareFeet: e.target.value })} placeholder="1850" />
            </div>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <button className="btn" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(3)} disabled={!priceCents}>
                Continue
              </button>
            </div>
            {!priceCents && <p className="small muted">Enter a valid price to continue.</p>}
          </div>
        )}

        {step === 3 && (
          <div className="card panel grid">
            <h2 className="section-title">Publish</h2>
            <label className="option active">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>Publish now (demo)</strong>
                  <div className="muted small">Makes the property page visible immediately. Stripe activation will replace this in Phase 1.5.</div>
                </div>
                <input type="checkbox" checked={form.publishNow} onChange={(e) => setForm({ ...form, publishNow: e.target.checked })} />
              </div>
            </label>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <button className="btn" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={createListing} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create listing'}
              </button>
            </div>
            {error && <p className="small">{error}</p>}
          </div>
        )}
      </div>

      <div className="card panel sticky">
        <h2 className="section-title">Preview</h2>
        <div className="grid">
          <div className="option">
            <strong>{form.title || 'Listing title'}</strong>
            <div className="muted small">
              {form.addressLine1 || 'Address line 1'}
              {form.city ? `, ${form.city}` : ''} {form.state || ''} {form.postalCode || ''}
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>Price</span>
            <strong>{priceCents ? `$${(priceCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}</strong>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>Beds / Baths</span>
            <strong>{form.beds || '—'} / {form.baths || '—'}</strong>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>Status</span>
            <strong>{form.publishNow ? 'Active (demo)' : 'Draft'}</strong>
          </div>
          <p className="small muted">
            This wizard writes to your `properties` table via `/api/properties/create`.
          </p>
        </div>
      </div>
    </div>
  );
}
