import { Suspense } from 'react';
import CallbackClient from '@/app/auth/callback/CallbackClient';

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="container grid">
          <div className="card panel">
            <span className="badge">Account</span>
            <h1 style={{ margin: '10px 0 6px' }}>Loading...</h1>
            <p className="muted">Finishing sign-in.</p>
          </div>
        </main>
      }
    >
      <CallbackClient />
    </Suspense>
  );
}

