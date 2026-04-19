import { notFound } from 'next/navigation';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import { getPropertyBySlug } from '@/lib/properties';
import { listPropertyPhotos } from '@/lib/propertyStorageMedia';

function money(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default async function PropertyPage({ params }: { params: { slug: string } }) {
  const property = await getPropertyBySlug(params.slug);

  if (!property) {
    // Make the landing-page "example listing" button work without needing a seeded DB row.
    if (params.slug.startsWith('demo-')) {
      const addressLine = '123 Coastal Drive, Southport, NC 28461';
      return (
        <main className="container grid">
          <div className="hero card">
            <span className="badge">Demo listing</span>
            <h1 style={{ marginBottom: 6 }}>{addressLine}</h1>
            <div className="row">
              <strong>$425,000</strong>
              <span>3 bed</span>
              <span>2 bath</span>
              <span>1,850 sqft</span>
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
                <p className="muted">Coastal comfort, a bright kitchen, and a screened porch for sunset evenings.</p>
              </div>

              <div className="card panel">
                <h2 className="section-title">Property story</h2>
                <p className="muted">This is a demo page to show the layout and lead capture experience. Your real listings pull from Supabase.</p>
              </div>

              <div className="card panel">
                <h2 className="section-title">Property details</h2>
                <div className="three-col">
                  <div>
                    <strong>Beds</strong>
                    <div className="muted">3</div>
                  </div>
                  <div>
                    <strong>Baths</strong>
                    <div className="muted">2</div>
                  </div>
                  <div>
                    <strong>Sqft</strong>
                    <div className="muted">1,850</div>
                  </div>
                </div>
              </div>

              <div className="card panel">
                <h2 className="section-title">Community</h2>
                <p className="muted">Minutes to waterfront dining, parks, and an easy drive to the beach.</p>
              </div>
            </div>

            <div id="inquiry" className="card panel sticky">
              <h2 className="section-title">Quick inquiry</h2>
              <p className="muted small">Demo mode: inquiry submission is disabled on this example listing.</p>
              <div className="grid">
                <div className="field">
                  <label>Name</label>
                  <input disabled />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input disabled />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input disabled />
                </div>
                <div className="field">
                  <label>Message</label>
                  <textarea rows={5} disabled defaultValue={`Tell me more about ${addressLine}.`} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled>
                  Send inquiry
                </button>
              </div>
            </div>
          </div>
        </main>
      );
    }

    return notFound();
  }

  // If you want strict "public-only" behavior, enforce status here.
  if (!['active', 'under_contract', 'sold'].includes(property.status)) return notFound();

  const addressLine = `${property.address_line_1}${property.address_line_2 ? `, ${property.address_line_2}` : ''}, ${property.city}, ${property.state} ${property.postal_code}`;
  const photos = await listPropertyPhotos(property.id).catch(() => []);

  return (
    <main className="container grid">
      <div className="hero card">
        <span className="badge">Listing</span>
        <h1 style={{ marginBottom: 6 }}>{addressLine}</h1>
        {photos.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <img
              src={photos[0].url}
              alt={property.headline || property.title}
              style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 14, border: '1px solid rgba(0,0,0,.08)' }}
            />
          </div>
        )}
        <div className="row">
          <strong>{money(property.price_cents)}</strong>
          <span>{property.beds ?? '-'} bed</span>
          <span>{property.baths ?? '-'} bath</span>
          <span>{property.square_feet ? `${property.square_feet.toLocaleString()} sqft` : '- sqft'}</span>
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
          {photos.length > 1 && (
            <div className="card panel">
              <h2 className="section-title">Photos</h2>
              <div className="three-col" style={{ gap: 10 }}>
                {photos.slice(0, 9).map((p) => (
                  <img
                    key={p.path}
                    src={p.url}
                    alt={property.headline || property.title}
                    style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(0,0,0,.08)' }}
                  />
                ))}
              </div>
              {photos.length > 9 && <p className="muted small" style={{ marginTop: 10 }}>Showing 9 of {photos.length} photos.</p>}
            </div>
          )}

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
              <div>
                <strong>Beds</strong>
                <div className="muted">{property.beds ?? '-'}</div>
              </div>
              <div>
                <strong>Baths</strong>
                <div className="muted">{property.baths ?? '-'}</div>
              </div>
              <div>
                <strong>Sqft</strong>
                <div className="muted">{property.square_feet ? property.square_feet.toLocaleString() : '-'}</div>
              </div>
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
