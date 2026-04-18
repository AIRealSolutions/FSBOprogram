'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import { DIY_FEE_AFTER_TRIAL_CENTS, DIY_TRIAL_DAYS, type PricingSelection } from '@/lib/pricing';
import { clearPricingSelection, loadPricingSelection } from '@/lib/pricingHandoff';

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

type IntakeAnswers = {
  videoUrl: string;
  ownerNotes: string;
  deedAvailable: 'yes' | 'no' | 'unsure';
  taxRecordAvailable: 'yes' | 'no' | 'unsure';
  hoa: 'yes' | 'no' | 'unsure';
  hoaMonthlyDues: string;
  occupancy: 'owner' | 'tenant' | 'vacant' | 'unsure';
  keyFeatures: string;
  recentUpgrades: string;
  disclosuresReady: 'yes' | 'no' | 'unsure';
  preferredShowingNotes: string;
  anythingElse: string;
};

function dollarsToCents(raw: string) {
  const cleaned = raw.replace(/[$,]/g, '').trim();
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export default function SellWizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPricing, setSavedPricing] = useState<PricingSelection | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [intake, setIntake] = useState<IntakeAnswers>({
    videoUrl: '',
    ownerNotes: '',
    deedAvailable: 'unsure',
    taxRecordAvailable: 'unsure',
    hoa: 'unsure',
    hoaMonthlyDues: '',
    occupancy: 'unsure',
    keyFeatures: '',
    recentUpgrades: '',
    disclosuresReady: 'unsure',
    preferredShowingNotes: '',
    anythingElse: '',
  });

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

  useEffect(() => {
    setSavedPricing(loadPricingSelection());
  }, []);

  const savedPricingSummary = useMemo(() => {
    if (!savedPricing) return null;
    const tierLabel =
      savedPricing.tier === 'diy'
        ? 'DIY'
        : savedPricing.tier === 'mls_protected'
          ? 'Hybrid (MLS + protected closing)'
          : 'Full service';
    const addOnsCount = Object.values(savedPricing.addOns).filter(Boolean).length;
    return { tierLabel, addOnsCount, buyerAgency: savedPricing.buyerAgencyPercent };
  }, [savedPricing]);

  async function createListing() {
    setError(null);
    setSubmitting(true);
    try {
      // Forward the access token so the server can attach the real owner_user_id.
      const supabase = getSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? null;

      const headers: Record<string, string> = {};
      if (accessToken) headers.authorization = `Bearer ${accessToken}`;

      // Use multipart so we can ship media/docs in the same request as listing creation.
      const formData = new FormData();
      formData.set('title', form.title);
      formData.set('addressLine1', form.addressLine1);
      formData.set('addressLine2', form.addressLine2 ?? '');
      formData.set('city', form.city);
      formData.set('state', form.state);
      formData.set('postalCode', form.postalCode);
      formData.set('price', form.price);
      formData.set('beds', form.beds ?? '');
      formData.set('baths', form.baths ?? '');
      formData.set('squareFeet', form.squareFeet ?? '');
      formData.set('publishNow', String(form.publishNow));
      if (savedPricing) formData.set('selection', JSON.stringify(savedPricing));
      formData.set('intakeAnswers', JSON.stringify(intake));
      photos.forEach((file) => formData.append('photos', file, file.name));
      documents.forEach((file) => formData.append('documents', file, file.name));
      if (videoFile) formData.set('video', videoFile, videoFile.name);

      const response = await fetch('/api/properties/create', {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to create listing');

      // Pricing is now applied; clear it so it doesn't bleed into the next listing.
      clearPricingSelection();
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
            Get your public page live, start capturing leads, and manage everything from the Boardroom. During onboarding we run a listing interview to collect photos, video, documents, and the details that power strong marketing.
          </p>
        </div>

        <div className="card panel">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>Step {step} of 4</strong>
            <div className="row">
              <button className="btn" type="button" onClick={() => setStep(1)} disabled={step === 1}>
                Property
              </button>
              <button className="btn" type="button" onClick={() => setStep(2)} disabled={step === 2}>
                Basics
              </button>
              <button className="btn" type="button" onClick={() => setStep(3)} disabled={step === 3}>
                Interview
              </button>
              <button className="btn" type="button" onClick={() => setStep(4)} disabled={step === 4}>
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
              <button className="btn btn-primary" type="button" onClick={() => setStep(2)}>
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
              <button className="btn" type="button" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn btn-primary" type="button" onClick={() => setStep(3)} disabled={!priceCents}>
                Continue
              </button>
            </div>
            {!priceCents && <p className="small muted">Enter a valid price to continue.</p>}
          </div>
        )}

        {step === 3 && (
          <div className="card panel grid">
            <h2 className="section-title">Listing interview (recommended)</h2>
            <p className="muted" style={{ maxWidth: 860 }}>
              This is your listing interview. You can skip anything for now, but the more you share here, the stronger your marketing platform becomes for the public listing page.
            </p>

            <div className="two-col">
              <div className="card panel">
                <h3 style={{ marginTop: 0 }}>Photos and video</h3>
                <div className="field">
                  <label>Property photos (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
                  />
                  <div className="muted small" style={{ marginTop: 6 }}>
                    {photos.length ? `${photos.length} photo(s) selected` : 'No photos selected yet.'}
                  </div>
                </div>

                <div className="field">
                  <label>Walkthrough video file (optional)</label>
                  <input type="file" accept="video/*" onChange={(e) => setVideoFile((e.target.files?.[0] as File | undefined) ?? null)} />
                  <div className="muted small" style={{ marginTop: 6 }}>
                    {videoFile ? `Video selected: ${videoFile.name}` : 'No video file selected.'}
                  </div>
                </div>

                <div className="field">
                  <label>Or video link (optional)</label>
                  <input
                    value={intake.videoUrl}
                    onChange={(e) => setIntake({ ...intake, videoUrl: e.target.value })}
                    placeholder="YouTube, Vimeo, Dropbox link, etc."
                  />
                </div>
              </div>

              <div className="card panel">
                <h3 style={{ marginTop: 0 }}>Documents</h3>
                <div className="field">
                  <label>Deed / tax records / surveys / HOA docs (optional)</label>
                  <input type="file" multiple onChange={(e) => setDocuments(Array.from(e.target.files ?? []))} />
                  <div className="muted small" style={{ marginTop: 6 }}>
                    {documents.length ? `${documents.length} document(s) selected` : 'No documents selected yet.'}
                  </div>
                </div>

                <div className="field">
                  <label>Seller notes (optional)</label>
                  <textarea
                    rows={5}
                    value={intake.ownerNotes}
                    onChange={(e) => setIntake({ ...intake, ownerNotes: e.target.value })}
                    placeholder="Anything you'd tell a listing agent in the first meeting: story of the home, upgrades, neighborhood, what buyers should notice, etc."
                  />
                </div>
              </div>
            </div>

            <div className="card panel">
              <h3 style={{ marginTop: 0 }}>Quick questions (optional)</h3>
              <div className="three-col">
                <label className="option">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span>Deed available?</span>
                    <select value={intake.deedAvailable} onChange={(e) => setIntake({ ...intake, deedAvailable: e.target.value as IntakeAnswers['deedAvailable'] })}>
                      <option value="unsure">Unsure</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </label>
                <label className="option">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span>Tax record available?</span>
                    <select value={intake.taxRecordAvailable} onChange={(e) => setIntake({ ...intake, taxRecordAvailable: e.target.value as IntakeAnswers['taxRecordAvailable'] })}>
                      <option value="unsure">Unsure</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </label>
                <label className="option">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span>HOA?</span>
                    <select value={intake.hoa} onChange={(e) => setIntake({ ...intake, hoa: e.target.value as IntakeAnswers['hoa'] })}>
                      <option value="unsure">Unsure</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  {intake.hoa === 'yes' && (
                    <div className="muted small" style={{ marginTop: 8 }}>
                      <label>Monthly dues (optional)</label>
                      <input value={intake.hoaMonthlyDues} onChange={(e) => setIntake({ ...intake, hoaMonthlyDues: e.target.value })} placeholder="$150" />
                    </div>
                  )}
                </label>
              </div>

              <div className="two-col" style={{ marginTop: 10 }}>
                <div className="field">
                  <label>Key features buyers should notice (optional)</label>
                  <textarea rows={4} value={intake.keyFeatures} onChange={(e) => setIntake({ ...intake, keyFeatures: e.target.value })} placeholder="Top 5 features, layout wins, location benefits, views, schools, etc." />
                </div>
                <div className="field">
                  <label>Recent upgrades / improvements (optional)</label>
                  <textarea rows={4} value={intake.recentUpgrades} onChange={(e) => setIntake({ ...intake, recentUpgrades: e.target.value })} placeholder="Roof, HVAC, kitchen, bathrooms, paint, flooring, landscaping, etc." />
                </div>
              </div>

              <div className="two-col">
                <label className="option">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span>Disclosures ready?</span>
                    <select value={intake.disclosuresReady} onChange={(e) => setIntake({ ...intake, disclosuresReady: e.target.value as IntakeAnswers['disclosuresReady'] })}>
                      <option value="unsure">Unsure</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </label>
                <label className="option">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span>Occupancy</span>
                    <select value={intake.occupancy} onChange={(e) => setIntake({ ...intake, occupancy: e.target.value as IntakeAnswers['occupancy'] })}>
                      <option value="unsure">Unsure</option>
                      <option value="owner">Owner occupied</option>
                      <option value="tenant">Tenant occupied</option>
                      <option value="vacant">Vacant</option>
                    </select>
                  </div>
                </label>
              </div>

              <div className="field">
                <label>Preferred showing notes (optional)</label>
                <input value={intake.preferredShowingNotes} onChange={(e) => setIntake({ ...intake, preferredShowingNotes: e.target.value })} placeholder="Notice needed, pets, lockbox, times to avoid, etc." />
              </div>
              <div className="field">
                <label>Anything else (optional)</label>
                <textarea rows={3} value={intake.anythingElse} onChange={(e) => setIntake({ ...intake, anythingElse: e.target.value })} placeholder="Any context that helps us market and sell better." />
              </div>
            </div>

            <div className="row" style={{ justifyContent: 'space-between' }}>
              <button className="btn" type="button" onClick={() => setStep(2)}>
                Back
              </button>
              <div className="row">
                <button className="btn" type="button" onClick={() => setStep(4)}>
                  Skip for now
                </button>
                <button className="btn btn-primary" type="button" onClick={() => setStep(4)}>
                  Continue
                </button>
              </div>
            </div>
            <p className="small muted">You can change or add to this later in The Boardroom during your trial.</p>
          </div>
        )}

        {step === 4 && (
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
              <button className="btn" type="button" onClick={() => setStep(3)}>
                Back
              </button>
              <button className="btn btn-primary" type="button" onClick={createListing} disabled={submitting}>
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
          {savedPricingSummary && (
            <div className="option active">
              <strong>Pricing selected</strong>
              <div className="muted small" style={{ marginTop: 6 }}>
                {savedPricingSummary.tierLabel}
                {savedPricingSummary.buyerAgency ? ` | Buyer agent: ${savedPricingSummary.buyerAgency}%` : ''}
                {savedPricingSummary.addOnsCount ? ` | Add-ons: ${savedPricingSummary.addOnsCount}` : ''}
              </div>
              <div className="muted small">
                {savedPricing?.tier === 'diy'
                  ? `DIY starts with a ${DIY_TRIAL_DAYS}-day trial. After that, continue DIY for $${(DIY_FEE_AFTER_TRIAL_CENTS / 100).toFixed(0)} or upgrade to tier 2/3 to avoid the upfront DIY fee.`
                  : "We'll apply this after your listing is created."}
              </div>
            </div>
          )}

          <div className="option">
            <strong>{form.title || 'Listing title'}</strong>
            <div className="muted small">
              {form.addressLine1 || 'Address line 1'}
              {form.city ? `, ${form.city}` : ''} {form.state || ''} {form.postalCode || ''}
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>Price</span>
            <strong>{priceCents ? `$${(priceCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-'}</strong>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>Beds / Baths</span>
            <strong>
              {form.beds || '-'} / {form.baths || '-'}
            </strong>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>Status</span>
            <strong>{form.publishNow ? 'Active (demo)' : 'Draft'}</strong>
          </div>
          <p className="small muted">This wizard writes to your `properties` table via `/api/properties/create`.</p>
        </div>
      </div>
    </div>
  );
}
