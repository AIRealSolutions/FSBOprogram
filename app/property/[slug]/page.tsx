export default function PropertyPage({ params }: { params: { slug: string } }) {
  return (
    <main className="container grid">
      <div className="hero card">
        <span className="badge">Single-property funnel</span>
        <h1 style={{ marginBottom: 6 }}>123 Coastal Drive, Southport, NC</h1>
        <div className="row"><strong>$425,000</strong><span>3 bed</span><span>2 bath</span><span>1,850 sqft</span></div>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn btn-primary">Request info</button>
          <button className="btn">Schedule showing</button>
        </div>
      </div>
      <div className="two-col">
        <div className="grid">
          <div className="card panel">
            <h2 className="section-title">Property story</h2>
            <p className="muted">AI-enhanced listing narrative goes here. Keep attention on this property only. No competing listings.</p>
          </div>
          <div className="card panel">
            <h2 className="section-title">Property details</h2>
            <div className="three-col">
              <div><strong>Beds</strong><div className="muted">3</div></div>
              <div><strong>Baths</strong><div className="muted">2</div></div>
              <div><strong>Lot</strong><div className="muted">0.35 acres</div></div>
            </div>
          </div>
          <div className="card panel">
            <h2 className="section-title">Mortgage + tax tools</h2>
            <div className="three-col">
              <div className="field"><label>Down payment</label><input defaultValue="20" /></div>
              <div className="field"><label>Rate</label><input defaultValue="6.50" /></div>
              <div className="field"><label>Term</label><select defaultValue="360"><option value="360">30 years</option><option value="180">15 years</option></select></div>
            </div>
            <p className="muted small">Use stored tax and insurance estimates from the property record to generate live monthly cost scenarios.</p>
          </div>
          <div className="card panel">
            <h2 className="section-title">Community info</h2>
            <p className="muted">Map, schools, nearby parks, commute times, and neighborhood highlights.</p>
          </div>
        </div>
        <div className="card panel sticky">
          <h2 className="section-title">Quick inquiry</h2>
          <div className="field"><label>Name</label><input /></div>
          <div className="field"><label>Email</label><input /></div>
          <div className="field"><label>Phone</label><input /></div>
          <div className="field"><label>Message</label><textarea rows={5} defaultValue={`Tell me more about ${params.slug}`} /></div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Send inquiry</button>
        </div>
      </div>
    </main>
  );
}
