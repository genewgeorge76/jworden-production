import legacyPortfolio from '../data/legacyPortfolio.json';

export const JWordenAIHero = () => {
  return (
    <div className="jwordenai-hub-container bg-industrial-black text-white p-10 relative">
      {/* Background Map Visualizer (LA, TX, MO, MI, VA) */}
      <div className="absolute inset-0 opacity-10 bg-national-map-pattern"></div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* The Heritage Anchor */}
        <div className="border-b border-gold pb-4 mb-8 inline-block">
          <h3 className="text-gold tracking-widest uppercase font-bold">
            {legacyPortfolio.heritage.title} | Est. {legacyPortfolio.heritage.established}
          </h3>
        </div>

        {/* The 22nd-Century Developer Pitch */}
        <h1 className="text-5xl font-extrabold mb-6 shadow-smoke">
          Autonomous Infrastructure & National Development
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          From multi-state General Contracting for the world's largest QSR franchises to
          executing 96% Marshall Density paving across Central Virginia. JWORDENAI is the
          ultimate fusion of a four-generation legacy and 22nd-century execution.
        </p>

        {/* Multi-State GC Proof */}
        <div className="grid grid-cols-4 gap-4 mt-12 border-t border-muted pt-8">
          <div className="stat-block">
            <h4 className="text-2xl text-gold">GC of Record</h4>
            <p className="text-sm">LA, TX, MO, MI</p>
          </div>
          <div className="stat-block">
            <h4 className="text-2xl text-gold">KBP Brands</h4>
            <p className="text-sm">Corporate Partner</p>
          </div>
          <div className="stat-block">
            <h4 className="text-2xl text-gold">41 Cities</h4>
            <p className="text-sm">Virginia Infrastructure Grid</p>
          </div>
          <div className="stat-block">
            <h4 className="text-2xl text-gold">1601 Ware Bottom Spring</h4>
            <p className="text-sm">National Command Center</p>
          </div>
        </div>
      </div>
    </div>
  );
};
