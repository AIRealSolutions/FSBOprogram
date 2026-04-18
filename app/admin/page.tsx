import { Suspense } from 'react';
import AdminGate from '@/components/AdminGate';
import AdminDashboard from '@/components/AdminDashboard';

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="container grid">
          <div className="card panel">
            <span className="badge">Admin</span>
            <h1 style={{ margin: '10px 0 6px' }}>Loading...</h1>
            <p className="muted">Preparing backoffice.</p>
          </div>
        </main>
      }
    >
      <AdminGate>
        <main className="container grid">
          <AdminDashboard />
        </main>
      </AdminGate>
    </Suspense>
  );
}

