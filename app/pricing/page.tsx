import PricingBuilder from '@/components/PricingBuilder';

export default function PricingPage() {
  return (
    <main className="container grid">
      <div>
        <span className="badge">Pricing</span>
        <h1 style={{ marginBottom: 8 }}>Choose your listing path</h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          Explore the plans and add-ons. When you&apos;re ready to save a strategy, create a listing and open pricing from your Boardroom.
        </p>
      </div>
      <PricingBuilder />
    </main>
  );
}

