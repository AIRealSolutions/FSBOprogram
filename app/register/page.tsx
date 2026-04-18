import { Suspense } from 'react';
import RegisterClient from '@/app/register/RegisterClient';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="container grid">
          <div className="card panel">
            <span className="badge">Account</span>
            <h1 style={{ margin: '10px 0 6px' }}>Loading...</h1>
            <p className="muted">Preparing registration.</p>
          </div>
        </main>
      }
    >
      <RegisterClient />
    </Suspense>
  );
}

