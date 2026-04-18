import { Suspense } from 'react';
import AuthGate from '@/components/AuthGate';

export default function BoardroomLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="container grid">
          <div className="card panel">
            <span className="badge">FSBO Program</span>
            <h1 style={{ margin: '10px 0 6px' }}>Loading...</h1>
            <p className="muted">Preparing your Boardroom.</p>
          </div>
        </main>
      }
    >
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}
