'use client';

import { useMemo, useState } from 'react';
import { calculatePricing, PricingSelection, Tier } from '@/lib/pricing';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import { savePricingSelection } from '@/lib/pricingHandoff';

function TierCard({
  tier,
  current,
  onClick,
  title,
  price,
  description,
}: {
  tier: Tier;
  current: Tier;
  onClick: (tier: Tier) => void;
  title: string;
  price: string;
  description: string;
}) {
  return (
    <button type="button" className={`option ${current === tier ? 'active' : ''}`} onClick={() => onClick(tier)}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <strong>{title}</strong>
          <p className="muted small">{description}</p>
        </div>
        <span className="badge">{price}</span>
      </div>
    </button>
  );
}

export default function PricingBuilder({ propertyId }: { propertyId?: string }) {
  const [selection, setSelection] = useState<PricingSelection>({
    tier: 'diy',
    buyerAgencyPercent: 0,
    sellerHandlesShowings: true,
    showingAgentEnabled: false,
    dualAgencyEnabled: false,
    extendTerm: false,
    addOns: {
      sign: false,
      rider: false,
      infoBox: false,
      drone: false,
      photos: false,
    },
  });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const isTier2 = selection.tier === 'mls_protected';
  const isTier3 = selection.tier === 'premium_full_service';

  // Premium always includes add-ons; keep state consistent even if a selection was loaded from storage.
  const effectiveSelection = useMemo(() => {
    if (!isTier3) return selection;
    return { ...selection, addOns: { sign: true, rider: true, infoBox: true, drone: true, photos: true } };
  }, [selection, isTier3]);

  const preview = useMemo(() => calculatePricing(effectiveSelection), [effectiveSelection]);

  async function onSave() {
    try {
      if (!propertyId) {
        // Pricing-first flow: store selections locally and send to onboarding.
        savePricingSelection(effectiveSelection);
        window.location.href = '/sell?fromPricing=1';
        return;
      }

      setSaveState('saving');
      setSaveMessage('Saving strategy...');
      const supabase = getSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) headers.authorization = `Bearer ${accessToken}`;

      const response = await fetch('/api/boardroom/save-strategy', {
        method: 'POST',
        headers,
        body: JSON.stringify({ propertyId, selection: effectiveSelection }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to save strategy');
      setSaveState('saved');
      setSaveMessage('Strategy saved. Services, ledger items, preferences, and listing term scaffolding were updated.');
    } catch (error) {
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'Failed to save strategy');
    }
  }

  return (
    <div className="two-col">
      <div className="grid">
        {!propertyId && (
          <div className="card panel">
            <span className="badge">Start with pricing</span>
            <p className="muted small" style={{ margin: '10px 0 0' }}>
              Choose your plan and add-ons, then continue to onboarding. We'll apply these selections after you sign in and create your listing.
            </p>
          </div>
        )}

        <div className="card panel">
          <h2 className="section-title">Choose your listing path</h2>
          <div className="grid">
            <TierCard
              tier="diy"
              current={selection.tier}
              onClick={(tier) =>
                setSelection({
                  ...selection,
                  tier,
                  sellerHandlesShowings: true,
                  showingAgentEnabled: false,
                  dualAgencyEnabled: false,
                  extendTerm: false,
                })
              }
              title="DIY Boardroom"
              price="$0 today"
              description="14-day trial. Build your listing, launch AI marketing, manage showings, and run your sale from one dashboard. Continue DIY for $399 after the trial, or upgrade to avoid the upfront DIY fee."
            />
            <TierCard
              tier="mls_protected"
              current={selection.tier}
              onClick={(tier) =>
                setSelection({
                  ...selection,
                  tier,
                  sellerHandlesShowings: true,
                  showingAgentEnabled: false,
                  dualAgencyEnabled: false,
                })
              }
              title="MLS + Protected Closing"
              price="2%"
              description="1% MLS syndication + 1% contracts and seller support through closing. Seller showings by default."
            />
            <TierCard
              tier="premium_full_service"
              current={selection.tier}
              onClick={(tier) =>
                setSelection({
                  ...selection,
                  tier,
                  sellerHandlesShowings: false,
                  showingAgentEnabled: false,
                  addOns: { sign: true, rider: true, infoBox: true, drone: true, photos: true },
                })
              }
              title="Premium Full Service"
              price="3%"
              description="Full seller representation with premium marketing. All add-ons included."
            />
          </div>
        </div>

        <div className="card panel">
          <h2 className="section-title">Quarterly listing term</h2>
          <div className="grid">
            <div className="option active">
              <strong>3-month agreement rhythm</strong>
              <p className="muted small">All brokerage-backed listing agreements run for 3 months. Clients can extend another 3 months at a time and unlock another $250 ad campaign allocation each quarter.</p>
            </div>
            {selection.tier !== 'diy' && (
              <label className="option">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span>Preview one 3-month extension</span>
                  <input type="checkbox" checked={selection.extendTerm} onChange={(e) => setSelection({ ...selection, extendTerm: e.target.checked })} />
                </div>
              </label>
            )}
          </div>
        </div>

        {isTier2 && (
          <div className="card panel">
            <h2 className="section-title">Showing path</h2>
            <div className="grid">
              <label className="option active">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span>Seller-managed showings</span>
                  <input type="radio" name="showing-path" checked={selection.sellerHandlesShowings && !selection.showingAgentEnabled} onChange={() => setSelection({ ...selection, sellerHandlesShowings: true, showingAgentEnabled: false })} />
                </div>
              </label>
              <label className="option">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span>Agent-performed showings (+1%)</span>
                  <input type="radio" name="showing-path" checked={selection.showingAgentEnabled} onChange={() => setSelection({ ...selection, sellerHandlesShowings: false, showingAgentEnabled: true })} />
                </div>
                <p className="muted small">Adds a licensed showing agent and creates a dual-agent path that should trigger disclosure workflow before offer handling.</p>
              </label>
            </div>
          </div>
        )}

        {(isTier2 || isTier3) && (
          <div className="card panel">
            <h2 className="section-title">Brokerage controls</h2>
            <div className="grid">
              <label className="option">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span>Buyer agency incentive</span>
                  <select value={selection.buyerAgencyPercent} onChange={(e) => setSelection({ ...selection, buyerAgencyPercent: Number(e.target.value) })}>
                    {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}%</option>)}
                  </select>
                </div>
              </label>

              {isTier3 && (
                <label className="option">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span>Dual agency option (+1%)</span>
                    <input type="checkbox" checked={selection.dualAgencyEnabled} onChange={(e) => setSelection({ ...selection, dualAgencyEnabled: e.target.checked })} />
                  </div>
                  <p className="muted small">Optional +1% when dual agency is properly disclosed and accepted by all required parties.</p>
                </label>
              )}
            </div>
          </div>
        )}

        <div className="card panel">
          <h2 className="section-title">Physical and premium add-ons</h2>
          <div className="three-col">
            {[
              ['sign', 'For Sale Sign + QR'],
              ['rider', 'Two-sided Rider'],
              ['infoBox', 'Info Box + QR'],
              ['drone', 'Drone'],
              ['photos', 'Professional Images'],
            ].map(([key, label]) => (
              <label key={key} className="option">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    disabled={isTier3}
                    checked={isTier3 ? true : (selection.addOns as Record<string, boolean>)[key]}
                    onChange={(e) => setSelection({ ...selection, addOns: { ...selection.addOns, [key]: e.target.checked } })}
                  />
                </div>
                {isTier3 && <p className="muted small" style={{ margin: '8px 0 0' }}>Included</p>}
              </label>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            Premium includes all add-ons at $0. In other tiers, Boardroom setup and signage are always creditable. Drone and professional images become premium-only credit when the listing qualifies for the higher premium package.
          </p>
        </div>
      </div>

      <div className="card panel sticky">
        <h2 className="section-title">Live summary</h2>
        <div className="grid">
          {preview.lines.map((line, idx) => (
            <div key={idx} className="row" style={{ justifyContent: 'space-between' }}>
              <span>{line.label}</span>
              <strong>{line.value}</strong>
            </div>
          ))}
          <hr />
          <div className="row" style={{ justifyContent: 'space-between' }}><span>Listing agreement</span><strong>{preview.listingAgreementMonths ? `${preview.listingAgreementMonths} months` : 'DIY only'}</strong></div>
          <div className="row" style={{ justifyContent: 'space-between' }}><span>Upfront today</span><strong>${(preview.upfrontNowCents / 100).toFixed(2)}</strong></div>
          {effectiveSelection.tier === 'diy' && (
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Due after trial</span><strong>${(preview.dueAfterTrialCents / 100).toFixed(2)}</strong></div>
          )}
          <div className="row" style={{ justifyContent: 'space-between' }}><span>Potential commission</span><strong>{preview.totalPotentialCommissionPercent}%</strong></div>
          <div className="row" style={{ justifyContent: 'space-between' }}><span>Always creditable</span><strong>${(preview.totalAlwaysCreditableCents / 100).toFixed(2)}</strong></div>
          <div className="row" style={{ justifyContent: 'space-between' }}><span>Premium-only credit</span><strong>${(preview.totalPremiumOnlyCreditableCents / 100).toFixed(2)}</strong></div>
          <div className="row" style={{ justifyContent: 'space-between' }}><span>Never creditable</span><strong>${(preview.totalNonCreditableCents / 100).toFixed(2)}</strong></div>
          <div className="option active">
            <strong>Seller control notes</strong>
            <ul className="small muted" style={{ margin: '8px 0 0 18px' }}>
              {preview.sellerControlNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
          <button className="btn btn-primary" onClick={onSave} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? 'Saving...' : propertyId ? 'Save strategy' : 'Continue to onboarding'}
          </button>
          {saveMessage && <p className={`small ${saveState === 'error' ? '' : 'muted'}`}>{saveMessage}</p>}
        </div>
      </div>
    </div>
  );
}
