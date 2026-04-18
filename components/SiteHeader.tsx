import Link from 'next/link';
import AuthButton from '@/components/AuthButton';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container row" style={{ justifyContent: 'space-between' }}>
        <Link className="brand" href="/">
          <img className="brand-logo" src="/brand/fsboprogram-logo.png" alt="FSBOprogram.com" />
          <span className="sr-only">FSBO Program</span>
        </Link>
        <nav className="row site-nav">
          <Link className="nav-link" href="/sell">
            Sell your home
          </Link>
          <Link className="nav-link" href="/pricing">
            Pricing
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
