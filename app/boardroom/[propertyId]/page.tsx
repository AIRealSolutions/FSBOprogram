import BoardroomControls from '@/components/BoardroomControls';

export default function BoardroomPage({ params }: { params: { propertyId: string } }) {
  return (
    <main className="container grid">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <span className="badge">The Boardroom</span>
          <h1 style={{ marginBottom: 6 }}>123 Coastal Drive</h1>
          <div className="muted">Property ID: {params.propertyId}</div>
        </div>
      </div>

      <div className="three-col">
        <div className="card kpi"><h3>Current term</h3><strong>Month 2 of 3</strong></div>
        <div className="card kpi"><h3>Quarterly ad funds</h3><strong>$250 available</strong></div>
        <div className="card kpi"><h3>Next renewal</h3><strong>June 30</strong></div>
      </div>

      <div className="two-col">
        <div className="grid">
          <div className="card panel">
            <h2 className="section-title">The Table</h2>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Plan</span><strong>MLS + Protected Closing</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Status</span><strong>Active</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Buyer agency incentive</span><strong>2%</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Showings</span><strong>Seller-managed</strong></div>
          </div>

          <div className="card panel">
            <h2 className="section-title">Marketing Wing</h2>
            <div className="row"><button className="btn">Edit property site</button><button className="btn">Approve social post</button><button className="btn">Request open house</button></div>
            <p className="muted small" style={{ marginTop: 10 }}>Seller controls creative approvals, featured photo order, ad approvals, and whether open house items appear publicly.</p>
          </div>

          <div className="card panel">
            <h2 className="section-title">Showing Center</h2>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Notice required</span><strong>4 hours</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Agent showings</span><strong>Off</strong></div>
            <div className="row"><button className="btn">Update preferences</button><button className="btn">View showing feedback</button></div>
            <p className="muted small" style={{ marginTop: 10 }}>If the seller turns on agent showings in Tier 2, the system should surface the 1% showing module and required dual-agent disclosures before offer handling.</p>
          </div>

          <div className="card panel">
            <h2 className="section-title">Deal Room</h2>
            <div className="option active"><strong>John Smith</strong><p className="muted small">Asked to schedule a Saturday showing.</p></div>
            <div className="option"><strong>Sarah Jones</strong><p className="muted small">Requested disclosure packet.</p></div>
          </div>
        </div>

        <div className="grid sticky">
          <div className="card panel">
            <h2 className="section-title">Renewal & Term</h2>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Start</span><strong>April 1</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>End</span><strong>June 30</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Extension option</span><strong>+3 months</strong></div>
            <p className="muted small">Extending adds another quarter of service, preserves Boardroom history, and unlocks another $250 ad campaign allocation.</p>
          </div>

          <div className="card panel">
            <h2 className="section-title">Campaign Control</h2>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Campaign status</span><strong>Available</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Budget this term</span><strong>$250</strong></div>
            <div className="row"><button className="btn">Approve creative</button><button className="btn btn-primary">Launch campaign</button></div>
            <p className="muted small">Each active 3-month brokerage term carries its own $250 campaign allocation. Campaign money is used in-term and does not convert into closing credit.</p>
          </div>

          <BoardroomControls propertyId={params.propertyId} />

          <div className="card panel">
            <h2 className="section-title">Investment Summary</h2>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Always creditable</span><strong>$524.00</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Premium-only credit</span><strong>$750.00</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span>Non-creditable spend</span><strong>$250.00</strong></div>
          </div>
        </div>
      </div>
    </main>
  );
}
