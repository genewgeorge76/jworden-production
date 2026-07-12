import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, lazy, Suspense } from 'react';
import EstimatePricePanel from '@/components/EstimatePricePanel';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import {
  estimateFromPolygon,
  STATE_PRICE_MULTIPLIER,
  type LatLng,
  type MapEstimateResult,
  type EstimatorConfig,
  type ServiceType,
  DEFAULT_CONFIG,
} from '@/lib/estimator-engine';

// Heavy vendors — leaflet (~150kB gz) and three.js (~140kB gz). Code-split
// so the rest of the site never pays for them.
const MapEstimator = lazy(() => import('@/components/MapEstimator'));
const CrossSectionViewer = lazy(() => import('@/components/CrossSectionViewer'));

function LazyPanelFallback({ label }: { label: string }) {
  return (
    <div className="flex h-[420px] items-center justify-center border border-zinc-800 bg-zinc-950/40 text-xs font-bold uppercase tracking-[0.3em] text-zinc-300">
      Loading {label}…
    </div>
  );
}

const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'new-install', label: 'New Asphalt Installation' },
  { value: 'overlay', label: 'Asphalt Overlay (Resurface)' },
  { value: 'repair', label: 'Asphalt Repair / Patching' },
  { value: 'sealcoat-only', label: 'Sealcoating Only' },
];

const SURFACE_DEPTHS = [
  { value: 1.5, label: '1.5" — Light Residential' },
  { value: 2, label: '2" — Standard Residential' },
  { value: 2.5, label: '2.5" — Heavy Residential / Light Commercial' },
  { value: 3, label: '3" — Commercial / Industrial' },
];

const STATE_CODES = Object.keys(STATE_PRICE_MULTIPLIER).sort();

function EstimatePage() {
  const [config, setConfig] = useState<EstimatorConfig>({ ...DEFAULT_CONFIG });
  const [result, setResult] = useState<MapEstimateResult | null>(null);
  const [polygonCoords, setPolygonCoords] = useState<LatLng[]>([]);

  const handlePolygonChange = useCallback(
    (coords: LatLng[]) => {
      setPolygonCoords(coords);
      const est = estimateFromPolygon(coords, config);
      setResult(est);
    },
    [config],
  );

  const handleClear = useCallback(() => {
    setPolygonCoords([]);
    setResult(null);
  }, []);

  // Re-calculate when config changes (if polygon exists)
  const updateConfig = useCallback(
    (partial: Partial<EstimatorConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...partial };
        if (polygonCoords.length >= 3) {
          const est = estimateFromPolygon(polygonCoords, next);
          setResult(est);
        }
        return next;
      });
    },
    [polygonCoords],
  );

  const serviceLabel =
    SERVICE_OPTIONS.find((s) => s.value === config.serviceType)?.label ?? 'Estimate';

  return (
    <main className="min-h-screen bg-premium-black grain text-white font-sans pt-28">
      {/* Hero */}
      <section className="relative py-20 px-6 bg-[#1a1a1a] border-b-[15px] border-[#ffcc00] overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <span className="bg-[#ffcc00] text-black px-6 py-1.5 font-black uppercase text-xs tracking-[0.4em] mb-6 inline-block shadow-2xl">
            Interactive 3D Estimator · Powered by JWORDENAI
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase text-[#ffcc00] leading-[0.9] tracking-tighter">
            Draw Your <br />
            <span className="text-white italic">Project</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 italic font-bold mt-8 max-w-3xl leading-snug">
            Draw your driveway, parking lot, or walkway on the map and watch the
            JWordenAI price calculate in real-time — backed by 40 years of 4th-generation
            paving expertise.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <span className="border border-[#ffcc00]/30 text-[#ffcc00] px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
              96% Marshall Compaction
            </span>
            <span className="border border-[#ffcc00]/30 text-[#ffcc00] px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
              VDOT Sec 315 Base
            </span>
            <span className="border border-[#ffcc00]/30 text-[#ffcc00] px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
              $9/Ton Oil Shield
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Config Panel */}
          <div className="bg-zinc-900 border border-zinc-700 p-6 mb-8">
            <h2 className="text-lg font-black uppercase text-white mb-4 tracking-wider">
              ⚙ Configure Your Project
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Service Type */}
              <div>
                <label htmlFor="est-service" className="block text-[10px] font-black uppercase tracking-widest text-[#ffcc00] mb-2">
                  Service Type
                </label>
                <select
                  id="est-service"
                  value={config.serviceType}
                  onChange={(e) => updateConfig({ serviceType: e.target.value as ServiceType })}
                  className="w-full bg-black border border-zinc-700 text-white p-3 text-sm focus:border-[#ffcc00] outline-none transition-colors appearance-none"
                >
                  {SERVICE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Surface Depth */}
              <div>
                <label htmlFor="est-depth" className="block text-[10px] font-black uppercase tracking-widest text-[#ffcc00] mb-2">
                  Surface Depth
                </label>
                <select
                  id="est-depth"
                  value={config.surfaceDepthIn}
                  onChange={(e) => updateConfig({ surfaceDepthIn: parseFloat(e.target.value) })}
                  className="w-full bg-black border border-zinc-700 text-white p-3 text-sm focus:border-[#ffcc00] outline-none transition-colors appearance-none"
                >
                  {SURFACE_DEPTHS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div>
                <label htmlFor="est-state" className="block text-[10px] font-black uppercase tracking-widest text-[#ffcc00] mb-2">
                  State
                </label>
                <select
                  id="est-state"
                  value={config.stateCode}
                  onChange={(e) => updateConfig({ stateCode: e.target.value })}
                  className="w-full bg-black border border-zinc-700 text-white p-3 text-sm focus:border-[#ffcc00] outline-none transition-colors appearance-none"
                >
                  {STATE_CODES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeBase}
                    onChange={(e) => updateConfig({ includeBase: e.target.checked })}
                    className="w-5 h-5 accent-[#ffcc00] flex-shrink-0"
                  />
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    6" Stone Base (Worden Std)
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeSeal}
                    onChange={(e) => updateConfig({ includeSeal: e.target.checked })}
                    className="w-5 h-5 accent-[#ffcc00] flex-shrink-0"
                  />
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Include Sealcoat
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Map + Estimate Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Map — takes 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              <h2 className="text-2xl font-black uppercase text-white tracking-tight">
                📍 Draw Your Project Area
              </h2>
              <Suspense fallback={<LazyPanelFallback label="map" />}>
                <MapEstimator
                  onPolygonChange={handlePolygonChange}
                  onClear={handleClear}
                />
              </Suspense>

              {/* Cross Section — live polygon extrusion from map */}
              <Suspense fallback={<LazyPanelFallback label="3D viewer" />}>
                <CrossSectionViewer
                  surfaceDepthIn={config.surfaceDepthIn}
                  includeBase={config.includeBase}
                  includeSeal={config.includeSeal}
                  polygonCoords={polygonCoords.length >= 3 ? polygonCoords : undefined}
                />
              </Suspense>
            </div>

            {/* Price Panel + Lead Capture — takes 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-black uppercase text-white tracking-tight">
                💰 Your Estimate
              </h2>
              <EstimatePricePanel result={result} serviceLabel={serviceLabel} />

              {/* Lead Capture — only show when estimate exists */}
              {result && (
                <LeadCaptureForm
                  result={result}
                  stateCode={config.stateCode}
                  serviceType={config.serviceType}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-16 px-6 bg-[#1a1a1a] border-t border-zinc-800">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-black uppercase text-white mb-4">
            The Worden <span className="text-[#ffcc00]">Promise</span>
          </h2>
          <p className="text-zinc-200 font-bold max-w-2xl mx-auto mb-10">
            Every estimate includes our non-negotiable standards — the same specs we use
            for KFC, Arby's, and VDOT projects.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { stat: '96%', label: 'Marshall Compaction', sub: 'AASHTO T245' },
              { stat: '6"', label: 'Stone Base Standard', sub: 'VDOT Sec 303' },
              { stat: '$9/ton', label: 'Oil Price Shield', sub: 'Built Into Every Bid' },
              { stat: '40yr', label: '4th Generation', sub: 'Since 1984' },
            ].map((item) => (
              <div key={item.label} className="bg-zinc-900 border border-zinc-700 p-6">
                <p className="text-3xl font-black text-[#ffcc00]">{item.stat}</p>
                <p className="text-white font-bold text-xs uppercase tracking-wider mt-2">{item.label}</p>
                <p className="text-zinc-200 text-[10px] uppercase tracking-wider mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-[#ffcc00]">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-black uppercase text-black mb-4">
            Ready for an On-Site Estimate?
          </h2>
          <p className="text-black/60 font-bold text-lg mb-8 max-w-2xl mx-auto">
            Our estimating team answers 7 days a week. Call now or submit through Kickserv.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:8044461296"
              className="inline-block bg-black text-[#ffcc00] font-black uppercase tracking-widest px-10 py-5 text-lg hover:bg-zinc-900 transition-colors"
            >
              📞 804-446-1296
            </a>
            <a
              href="https://app.kickserv.com/jwordenandsonspaving/self_service/requests/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-black text-[#ffcc00] font-black uppercase tracking-widest px-10 py-5 text-lg hover:bg-zinc-900 transition-colors"
            >
              ⚡ Kickserv Dispatch
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

export const Route = createFileRoute('/estimate')({
  component: EstimatePage,
});
