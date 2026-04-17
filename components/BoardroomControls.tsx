'use client';

import { useState } from 'react';

export default function BoardroomControls({ propertyId }: { propertyId: string }) {
  const [prefs, setPrefs] = useState({
    sellerManagedShowings: true,
    showingNoticeHours: 4,
    dualAgencyAllowed: false,
    buyerAgencyPercent: 2,
    adCampaignAutoLaunch: false,
    openHouseAllowed: true,
    listingPauseRequested: false,
    allowPublicOpenHouseDisplay: false,
  });
  const [message, setMessage] = useState('');
  const [renewalMessage, setRenewalMessage] = useState('');

  async function savePreferences() {
    setMessage('Saving seller controls...');
    const response = await fetch('/api/boardroom/save-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId, preferences: prefs }),
    });
    const data = await response.json();
    setMessage(response.ok && data.ok ? 'Seller controls saved.' : data.error || 'Failed to save seller controls');
  }

  async function renewTerm() {
    setRenewalMessage('Extending listing term...');
    const response = await fetch('/api/boardroom/renew-term', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId }),
    });
    const data = await response.json();
    setRenewalMessage(response.ok && data.ok ? `Renewed through ${data.newTerm.end_date}. Another $250 ad allocation was created.` : data.error || 'Failed to renew listing term');
  }

  return (
    <>
      <div className="card panel">
        <h2 className="section-title">Seller Control Center</h2>
        <div className="grid">
          <label className="row" style={{ justifyContent: 'space-between' }}><span>Seller-managed showings</span><input type="checkbox" checked={prefs.sellerManagedShowings} onChange={(e) => setPrefs({ ...prefs, sellerManagedShowings: e.target.checked })} /></label>
          <label className="row" style={{ justifyContent: 'space-between' }}><span>Showing notice (hours)</span><input type="number" min={1} max={72} value={prefs.showingNoticeHours} onChange={(e) => setPrefs({ ...prefs, showingNoticeHours: Number(e.target.value) })} /></label>
          <label className="row" style={{ justifyContent: 'space-between' }}><span>Buyer agency incentive</span><select value={prefs.buyerAgencyPercent} onChange={(e) => setPrefs({ ...prefs, buyerAgencyPercent: Number(e.target.value) })}>{[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}%</option>)}</select></label>
          <label className="row" style={{ justifyContent: 'space-between' }}><span>Dual agency allowed</span><input type="checkbox" checked={prefs.dualAgencyAllowed} onChange={(e) => setPrefs({ ...prefs, dualAgencyAllowed: e.target.checked })} /></label>
          <label className="row" style={{ justifyContent: 'space-between' }}><span>Open house allowed</span><input type="checkbox" checked={prefs.openHouseAllowed} onChange={(e) => setPrefs({ ...prefs, openHouseAllowed: e.target.checked })} /></label>
          <label className="row" style={{ justifyContent: 'space-between' }}><span>Show open house publicly</span><input type="checkbox" checked={prefs.allowPublicOpenHouseDisplay} onChange={(e) => setPrefs({ ...prefs, allowPublicOpenHouseDisplay: e.target.checked })} /></label>
          <label className="row" style={{ justifyContent: 'space-between' }}><span>Auto-launch approved ads</span><input type="checkbox" checked={prefs.adCampaignAutoLaunch} onChange={(e) => setPrefs({ ...prefs, adCampaignAutoLaunch: e.target.checked })} /></label>
          <label className="row" style={{ justifyContent: 'space-between' }}><span>Pause request</span><input type="checkbox" checked={prefs.listingPauseRequested} onChange={(e) => setPrefs({ ...prefs, listingPauseRequested: e.target.checked })} /></label>
          <div className="row">
            <button className="btn btn-primary" onClick={savePreferences}>Save seller controls</button>
            <button className="btn" onClick={renewTerm}>Extend 3 months</button>
          </div>
          {message && <p className="small muted">{message}</p>}
          {renewalMessage && <p className="small muted">{renewalMessage}</p>}
        </div>
      </div>
    </>
  );
}
