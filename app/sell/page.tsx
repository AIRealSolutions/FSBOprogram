import SellWizard from '@/components/SellWizard';
import AuthGate from '@/components/AuthGate';
import { Suspense } from 'react';

export default function SellPage() {
  return (
    <Suspense
      fallback={
        <main className="container grid">
          <div className="card panel">
            <span className="badge">FSBO Program</span>
            <h1 style={{ margin: '10px 0 6px' }}>Loading...</h1>
            <p className="muted">Preparing the sell flow.</p>
          </div>
        </main>
      }
    >
      <AuthGate>
        <main className="container grid">
          <SellWizard />
        </main>
      </AuthGate>
    </Suspense>
  );
}
