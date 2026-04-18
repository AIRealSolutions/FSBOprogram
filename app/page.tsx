import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container grid">
      <div className="card hero-home">
        <img className="hero-banner" src="/brand/fsboprogram-logo.png" alt="FSBOprogram.com - DIY · Hybrid · Full Service" />
        <h1 style={{ margin: '14px 0 8px', fontSize: 42 }}>Tool to sell your own home. An all-in-one Sales Engine.</h1>
        <p className="muted" style={{ maxWidth: 860 }}>
          Build a clean public listing page, capture leads, and manage your process from the Boardroom. Choose DIY, Hybrid, or Full Service and upgrade when you need it.
        </p>
        <div className="row" style={{ marginTop: 6 }}>
          <Link className="btn btn-primary" href="/sell">
            Create your listing
          </Link>
          <Link className="btn" href="/pricing">
            View pricing
          </Link>
          <Link className="btn" href="/property/demo-123-coastal-drive-southport-nc-28461">
            View example listing
          </Link>
        </div>
      </div>

      <div className="three-col">
        <div className="card kpi">
          <h3>DIY</h3>
          <strong>$399</strong>
          <div className="muted">Boardroom + listing page</div>
        </div>
        <div className="card kpi">
          <h3>Hybrid</h3>
          <strong>2%</strong>
          <div className="muted">MLS + protected closing</div>
        </div>
        <div className="card kpi">
          <h3>Full service</h3>
          <strong>3%</strong>
          <div className="muted">Representation + premium marketing</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card panel">
          <h2 className="section-title">Testimonials</h2>
          <div className="grid" style={{ gap: 12 }}>
            <div className="option">
              <strong>"The Boardroom kept everything organized."</strong>
              <p className="muted small" style={{ margin: '8px 0 0' }}>
                We launched the listing page, tracked inquiries, and always knew the next step. It felt like a real sales system.
              </p>
            </div>
            <div className="option">
              <strong>"More leads, less chaos."</strong>
              <p className="muted small" style={{ margin: '8px 0 0' }}>
                The funnel made it easy for buyers to ask questions and schedule. No more missed messages.
              </p>
            </div>
            <div className="option">
              <strong>"DIY first, upgrade when you need it."</strong>
              <p className="muted small" style={{ margin: '8px 0 0' }}>
                We started simple and added help as we went. Super clear pricing and next steps.
              </p>
            </div>
          </div>
        </div>

        <div className="card panel">
          <h2 className="section-title">Services</h2>
          <p className="muted small" style={{ marginTop: -2 }}>
            Pick only what you need. Keep control. Add brokerage support when the situation calls for it.
          </p>
          <ul className="small" style={{ margin: '10px 0 0 18px' }}>
            <li>Public listing page + lead capture</li>
            <li>Boardroom dashboard (preferences, renewals, approvals)</li>
            <li>MLS exposure and syndication (Hybrid/Full service)</li>
            <li>Protected closing services (Hybrid)</li>
            <li>Professional photos + drone packages</li>
            <li>Yard sign + QR rider + info box</li>
            <li>
              <strong>Punch List Repairs</strong>
            </li>
            <li>
              <strong>Landscape curb appeal</strong>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
