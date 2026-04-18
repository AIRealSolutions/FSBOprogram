import { notFound } from 'next/navigation';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import { getPropertyBySlug } from '@/lib/properties';

function money(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default async function PropertyPage({ params }: { params: { slug: string } }) {
  const property = await getPropertyBySlug(params.slug);
  if (!property) return notFound();

  // If you want strict "public-only" behavior, enforce status here.
  // The DB also has RLS policies for public reads when using an anon client.
  if (!['active', 'under_contract', 'sold'].includes(property.status)) return notFound();

  const addressLine = `${property.address_line_1}${property.address_line_2 ? `, ${property.address_line_2}` : ''}, ${property.city}, ${property.state} ${property.postal_code}`;

  return (
    <main className="container grid">
      <div className="hero card">
        <span className="badge">Listing</span>
        <h1 style={{ marginBottom: 6 }}>{addressLine}</h1>
        <div className="row">
          <strong>{money(property.price_cents)}</strong>
          <span>{property.beds ?? '—'} bed</span>
          <span>{property.baths ?? '—'} bath</span>
          <span>{property.square_feet ? `${property.square_feet.toLocaleString()} sqft` : '— sqft'}</span>
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <a className="btn btn-primary" href="#inquiry">
            Request info
          </a>
          <a className="btn" href="#inquiry">
            Schedule showing
          </a>
        </div>
      </div>

      <div className="two-col">
        <div className="grid">
          <div className="card panel">
            <h2 className="section-title">Headline</h2>
            <p className="muted">{property.headline || property.title}</p>
          </div>

          <div className="card panel">
            <h2 className="section-title">Property story</h2>
            <p className="muted">{property.story || 'Add a story in the Boardroom to explain why this home is special.'}</p>
          </div>

          <div className="card panel">
            <h2 className="section-title">Property details</h2>
            <div className="three-col">
              <div><strong>Beds</strong><div className="muted">{property.beds ?? '—'}</div></div>
              <div><strong>Baths</strong><div className="muted">{property.baths ?? '—'}</div></div>
              <div><strong>Sqft</strong><div className="muted">{property.square_feet ? property.square_feet.toLocaleString() : '—'}</div></div>
            </div>
          </div>

          <div className="card panel">
            <h2 className="section-title">Community</h2>
            <p className="muted">{property.community_summary || 'Add community highlights (schools, parks, commute, neighborhood notes) in the Boardroom.'}</p>
          </div>
        </div>

        <div id="inquiry" className="card panel sticky">
          <h2 className="section-title">Quick inquiry</h2>
          <LeadCaptureForm propertyId={property.id} defaultMessage={`Tell me more about ${addressLine}.`} />
        </div>
      </div>
    </main>
  );
}
