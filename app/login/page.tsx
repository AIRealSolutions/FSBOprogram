import { Suspense } from 'react';
import LoginClient from '@/app/login/LoginClient';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="container grid">
          <div className="card panel">
            <span className="badge">Account</span>
            <h1 style={{ margin: '10px 0 6px' }}>Loading...</h1>
            <p className="muted">Preparing login.</p>
          </div>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}

