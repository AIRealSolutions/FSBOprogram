import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container grid">
      <div className="card hero">
        <span className="badge">FSBO Program</span>
        <h1 style={{ margin: '12px 0 8px', fontSize: 42 }}>Sell your own home with an all-in-one Sales Engine.</h1>
        <p style={{ maxWidth: 760 }}>
          Launch a clean public listing page, capture leads, and manage your entire process from the Boardroom. Start DIY, then upgrade when you want broker support.
        </p>
        <div className="row">
          <Link className="btn btn-primary" href="/sell">Create your listing</Link>
          <Link className="btn" href="/boardroom/pricing">View pricing</Link>
          <Link className="btn" href="/property/demo-123-coastal-drive-southport-nc-28461">View example listing</Link>
        </div>
      </div>
      <div className="three-col">
        <div className="card kpi"><h3>DIY</h3><strong>$399</strong><div className="muted">Boardroom + listing page</div></div>
        <div className="card kpi"><h3>Hybrid</h3><strong>2%</strong><div className="muted">MLS + protected closing</div></div>
        <div className="card kpi"><h3>Premium</h3><strong>3%</strong><div className="muted">Full service representation</div></div>
      </div>
    </main>
  );
}
