import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container grid">
      <div className="card hero">
        <span className="badge">FlipThisCrib Starter</span>
        <h1 style={{ margin: '12px 0 8px', fontSize: 42 }}>Every property deserves a funnel. Every seller gets a Boardroom.</h1>
        <p style={{ maxWidth: 720 }}>
          Residential-only starter for the Boardroom pricing model, single-property funnel, buyer value tools, and upgrade logic.
        </p>
        <div className="row">
          <Link className="btn btn-primary" href="/boardroom/pricing">Open pricing builder</Link>
          <Link className="btn" href="/property/demo-123-coastal-drive">View property funnel</Link>
        </div>
      </div>
      <div className="three-col">
        <div className="card kpi"><h3>Tier 1</h3><strong>$399</strong><div className="muted">DIY Boardroom</div></div>
        <div className="card kpi"><h3>Tier 2</h3><strong>2%</strong><div className="muted">MLS + Protected Closing</div></div>
        <div className="card kpi"><h3>Tier 3</h3><strong>3%</strong><div className="muted">Premium Full Service</div></div>
      </div>
    </main>
  );
}
