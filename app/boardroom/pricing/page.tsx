import PricingBuilder from '@/components/PricingBuilder';

export default function BoardroomPricingPage() {
  return (
    <main className="container grid">
      <div>
        <span className="badge">The Boardroom</span>
        <h1 style={{ marginBottom: 8 }}>Build your listing strategy</h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          This screen is the service-selection and pricing layer that should feed property service selections, payment ledgers, and agreement triggers in Supabase.
        </p>
      </div>
      <PricingBuilder />
    </main>
  );
}
