import { Suspense } from 'react';
import SuperAdminGate from '@/components/SuperAdminGate';
import SuperAdminUsers from '@/components/SuperAdminUsers';

export default function SuperAdminUsersPage() {
  return (
    <Suspense
      fallback={
        <main className="container grid">
          <div className="card panel">
            <span className="badge">Super Admin</span>
            <h1 style={{ margin: '10px 0 6px' }}>Loading...</h1>
            <p className="muted">Preparing user management.</p>
          </div>
        </main>
      }
    >
      <SuperAdminGate>
        <main className="container grid">
          <SuperAdminUsers />
        </main>
      </SuperAdminGate>
    </Suspense>
  );
}

