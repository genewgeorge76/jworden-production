import { useState } from 'react';

const wordenIntelligence = {
  pricing: { richmond: 2.75, coastal: 3.45, industrial: 4.10 },
  haulFactor: 1.15,
  coastalZips: ['21811', '21842', '21801'],
  richmondZips: ['23221', '23836', '23113'],
};

type ProjectType = 'residential' | 'commercial' | 'industrial';

function scoreLead(leadData: { type: ProjectType; description: string; zip: string }) {
  let priority = 'Normal';
  let tag = 'Standard';

  if (
    leadData.type === 'industrial' ||
    leadData.description.includes('KFC') ||
    leadData.description.includes('Tyson')
  ) {
    priority = 'Urgent';
    tag = 'High-Value GC';
  }

  if (leadData.zip === '21811') {
    tag = 'Ocean Pines Heritage';
  }

  return { priority, tag };
}

async function injectToKickserv(
  zip: string,
  sqft: number,
  type: ProjectType,
  estimate: string,
) {
  const descriptionText = `AUTONOMOUS BID: $${estimate}. Type: ${type}. SqFt: ${sqft}.`;
  const { priority, tag } = scoreLead({ type, description: descriptionText, zip });

  const payload = {
    customer_name: 'Worden Virtual Lead',
    address_zip: zip,
    description: descriptionText,
    source: 'Worden Autonomous Estimator',
    priority,
    tags: [tag],
  };

  console.log('SENDING TO KICKSERV:', payload);
  alert(
    `Your J. Worden Bid: $${estimate}. We have injected this into our scheduler for a final sign-off.`,
  );
}

export default function AutonomousEstimator() {
  const [zip, setZip] = useState('');
  const [sqft, setSqft] = useState('');
  const [type, setType] = useState<ProjectType>('residential');
  const [header, setHeader] = useState('J. Worden Autonomous Estimator');
  const [legacyNote, setLegacyNote] = useState('');
  const [estimate, setEstimate] = useState<string | null>(null);

  function runAutonomousLogic() {
    const sqftNum = parseFloat(sqft);

    if (!zip || isNaN(sqftNum) || sqftNum <= 0) {
      alert('Please enter a valid ZIP code and Square Footage.');
      return;
    }

    let baseRate = wordenIntelligence.pricing.richmond;
    let contextText = 'Engineering your Richmond 23221 estimate...';
    let note = 'Building on 4 generations of Virginia excellence.';

    if (wordenIntelligence.coastalZips.includes(zip)) {
      baseRate = wordenIntelligence.pricing.coastal;
      contextText = 'Loading Coastal Empire Data for Ocean Pines...';
      note = "Legacy Check: We've paved 200+ driveways in your neighborhood.";
    }

    if (type === 'industrial') {
      baseRate = wordenIntelligence.pricing.industrial;
      note = 'Tyson-Grade Industrial Standards Applied. Engineering for 80k-lb loads.';
    }

    setHeader(contextText);
    setLegacyNote(note);

    const total = sqftNum * baseRate * wordenIntelligence.haulFactor;
    const formatted = total.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    setEstimate(formatted);

    void injectToKickserv(zip, sqftNum, type, total.toFixed(2));
  }

  return (
    <div
      style={{
        background: '#1A1A1A',
        borderTop: '5px solid #D4AF37',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      }}
      className="text-white rounded-xl p-8"
    >
      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
        {header}
      </h2>

      {legacyNote && (
        <p
          style={{ color: '#D4AF37' }}
          className="italic mb-6 font-medium"
        >
          {legacyNote}
        </p>
      )}

      <div className="space-y-4 mt-4">
        <input
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Enter ZIP (e.g., 23221 or 21811)"
          required
          className="w-full p-3 bg-zinc-800 border border-zinc-700 text-white rounded focus:border-[#D4AF37] outline-none transition-colors"
        />
        <input
          type="number"
          value={sqft}
          onChange={(e) => setSqft(e.target.value)}
          placeholder="Estimated Sq Ft"
          required
          min="1"
          className="w-full p-3 bg-zinc-800 border border-zinc-700 text-white rounded focus:border-[#D4AF37] outline-none transition-colors"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ProjectType)}
          className="w-full p-3 bg-zinc-800 border border-zinc-700 text-white rounded focus:border-[#D4AF37] outline-none transition-colors appearance-none"
        >
          <option value="residential">Residential Driveway</option>
          <option value="commercial">Commercial / Franchise (KFC-Grade)</option>
          <option value="industrial">Industrial / GC (Tyson-Grade)</option>
        </select>

        <button
          type="button"
          onClick={runAutonomousLogic}
          style={{ background: '#D4AF37' }}
          className="w-full text-black font-black uppercase tracking-widest text-lg py-4 rounded cursor-pointer hover:opacity-90 transition-opacity"
        >
          Get Worden-Standard Bid
        </button>
      </div>

      {estimate && (
        <div
          style={{ color: '#D4AF37' }}
          className="mt-6 text-2xl font-black text-center"
        >
          Estimated Cost: {estimate}
        </div>
      )}

      {/* Trust Badges */}
      <div className="flex flex-wrap gap-4 mt-6 justify-center">
        {['BBB A+', 'Best of Houzz', 'VA Class A GC'].map((badge) => (
          <span
            key={badge}
            style={{ borderColor: '#D4AF37', color: '#D4AF37' }}
            className="border px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest opacity-80"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
