import { useState } from 'react';
import { negotiationCloser } from '../logic/negotiationCloser';

export const NegotiationPanel = ({ activeLead }: { activeLead: any }) => {
  const [isCloserActive, setCloserActive] = useState(false);

  const stdPrice = activeLead.estimatedPrice;
  const bottomPrice = negotiationCloser.calculateBottomDollar(
    activeLead.tonnage,
    activeLead.projectDays,
  );
  const script = negotiationCloser.getClosingScript(activeLead.name, stdPrice, bottomPrice);

  return (
    <div className="bg-glass-heavy p-6 border-gold rounded-lg mt-4 animate-slide-up">
      <h3 className="text-gold font-bold text-xl mb-4">🔱 BOTTOM DOLLAR NEGOTIATOR</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-black p-3 border-gray">
          <p className="text-gray-200 text-sm">Standard Market Bid</p>
          <p className="text-2xl font-bold">${stdPrice.toLocaleString()}</p>
        </div>
        <div className="bg-black p-3 border-gold">
          <p className="text-gold text-sm">Sovereign Bottom Dollar</p>
          <p className="text-2xl font-bold text-green-400">${bottomPrice.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-gray-900 p-4 rounded text-sm italic text-gray-300 mb-4 border-l-4 border-gold">
        {script}
      </div>

      <button
        onClick={() => {
          setCloserActive(true);
          window.open(
            `mailto:${activeLead.email}?subject=Infrastructure Proposal Adjustment&body=${encodeURIComponent(script)}`,
          );
        }}
        className="w-full bg-gold text-black font-black py-3 rounded hover:bg-yellow-400 transition-all"
      >
        {isCloserActive
          ? 'NEGOTIATION SCRIPT DEPLOYED'
          : 'DEPLOY NEGOTIATION SCRIPT & CLOSE CONTRACT'}
      </button>
    </div>
  );
};
