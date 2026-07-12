import { useState } from 'react';
import { autonomousVision } from '@/utils/autonomousVision';

export default function CustomerQuoteForm() {
  const [zip, setZip] = useState('');
  const [evidence, setEvidence] = useState<{ folder: string; message: string; images: string[] } | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (zip.trim()) {
      const result = autonomousVision.serveLocalEvidence(zip.trim());
      setEvidence(result);
    }
  };

  return (
    <section className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-xl mx-auto shadow-2xl">
      <h2 className="text-2xl font-black uppercase text-[#ffcc00] tracking-wider mb-2">
        JWORDENAI Vision™
      </h2>
      <p className="text-zinc-200 text-sm mb-6">
        Enter your ZIP code to see verified local paving projects near you.
      </p>

      <form onSubmit={handleLookup} className="flex gap-3 mb-6">
        <input
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Enter ZIP code (e.g. 23221)"
          maxLength={5}
          aria-label="ZIP code"
          className="flex-1 bg-zinc-800 border border-zinc-600 text-zinc-100 placeholder-zinc-500 rounded-lg px-4 py-3 focus:outline-none focus:border-[#ffcc00] transition-colors"
        />
        <button
          type="submit"
          className="bg-[#ffcc00] text-zinc-900 font-bold uppercase tracking-wide px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors"
        >
          Search
        </button>
      </form>

      {evidence && (
        <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-5 space-y-4">
          <p className="text-[#ffcc00] font-semibold text-sm uppercase tracking-widest">
            📍 {evidence.folder} Node Active
          </p>
          <p className="text-zinc-300 text-sm">{evidence.message}</p>
          <div className="grid grid-cols-1 gap-3">
            {evidence.images.map((src, i) => (
              <div
                key={i}
                className="bg-zinc-700 border-2 border-dashed border-zinc-500 rounded-lg h-40 flex items-center justify-center text-zinc-300 text-xs"
                aria-label={`${evidence.folder} project photo ${i + 1}`}
              >
                <span className="text-center px-4">
                  📷 {evidence.folder} verified project photo
                  <br />
                  <span className="text-zinc-200">{src}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
