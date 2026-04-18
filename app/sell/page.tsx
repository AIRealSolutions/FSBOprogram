import SellWizard from '@/components/SellWizard';
import AuthGate from '@/components/AuthGate';

export default function SellPage() {
  return (
    <AuthGate>
      <main className="container grid">
        <SellWizard />
      </main>
    </AuthGate>
  );
}
