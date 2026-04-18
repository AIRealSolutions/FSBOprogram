import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container grid">
      <div className="card hero-home">
        {/* Hero image stays the same. */}
        <img className="hero-banner" src="/brand/fsboprogram-logo.png" alt="FSBOprogram.com - DIY / Hybrid / Full Service" />

        <h1 style={{ margin: '14px 0 8px', fontSize: 42 }}>Turn your home into a lead engine.</h1>
        <p className="muted" style={{ maxWidth: 980 }}>
          Launch a clean, conversion-focused listing page, capture every inquiry, and run your sale from one place. Add AI-generated marketing, social media support, and scheduling as
          your listing heats up. Start DIY, go Hybrid for MLS + protected closing, or upgrade to full service when you want the team behind you.
        </p>

        <div className="three-col" style={{ marginTop: 10 }}>
          <div className="option">
            <strong>Publish fast</strong>
            <div className="muted small">A premium-looking listing page that works on mobile.</div>
          </div>
          <div className="option">
            <strong>AI marketing + social (Coming next)</strong>
            <div className="muted small">Draft headlines, descriptions, ad copy, and social posts in minutes.</div>
          </div>
          <div className="option">
            <strong>Scheduling + sales tools (Coming next)</strong>
            <div className="muted small">Showings, follow-up, and seller tools that keep the deal moving.</div>
          </div>
        </div>

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
          <strong>$0 today</strong>
          <div className="muted">14-day trial, then $399 to stay DIY</div>
        </div>
        <div className="card kpi">
          <h3>Hybrid</h3>
          <strong>2%</strong>
          <div className="muted">MLS + protected closing support</div>
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
              <strong>"Everything stayed organized and moving."</strong>
              <p className="muted small" style={{ margin: '8px 0 0' }}>
                The Boardroom made it easy to keep track of inquiries and follow-up without losing momentum.
              </p>
            </div>
            <div className="option">
              <strong>"More inquiries. Less chaos."</strong>
              <p className="muted small" style={{ margin: '8px 0 0' }}>
                Buyers had one clear place to reach out, and we stopped missing messages across phone, email, and social.
              </p>
            </div>
            <div className="option">
              <strong>"We started DIY and scaled up when needed."</strong>
              <p className="muted small" style={{ margin: '8px 0 0' }}>
                The upgrade path was straightforward. We stayed in control, then brought in support at the right time.
              </p>
            </div>
          </div>
        </div>

        <div className="card panel">
          <h2 className="section-title">Services</h2>
          <p className="muted small" style={{ marginTop: -2 }}>
            Build your package like a real operator: start lean, add leverage where it matters, and keep control of the timeline.
          </p>
          <ul className="small" style={{ margin: '10px 0 0 18px' }}>
            <li>Public listing page + lead capture</li>
            <li>Boardroom dashboard for controls and decisions</li>
            <li>MLS exposure and syndication (Hybrid/Full service)</li>
            <li>Protected closing services (Hybrid)</li>
            <li>Professional photos + drone packages</li>
            <li>Yard sign + QR rider + info box</li>
            <li>
              <strong>AI-Generated Marketing</strong> (Coming next): listing descriptions, headlines, ad copy
            </li>
            <li>
              <strong>Social Media</strong> (Coming next): post drafts, approvals, and launch-ready content
            </li>
            <li>
              <strong>Scheduling Service</strong> (Coming next): showing requests, confirmations, and reminders
            </li>
            <li>
              <strong>Sales Tools</strong> (Coming next): calculators, scripts, and buyer follow-up helpers
            </li>
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
