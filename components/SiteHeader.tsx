import Link from 'next/link';
import AuthButton from '@/components/AuthButton';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container row" style={{ justifyContent: 'space-between' }}>
        <Link className="brand" href="/">
          <img src="/brand/fsboprogram-mark-v5-sales-engine.svg" alt="" width={36} height={36} />
          <span className="brand-name">FSBO Program</span>
        </Link>
        <nav className="row site-nav">
          <Link className="nav-link" href="/sell">
            Sell your home
          </Link>
          <Link className="nav-link" href="/boardroom/pricing">
            Pricing
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
