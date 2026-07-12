import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/mission-log')({
  component: MissionLog,
});

interface Mission {
  id: string;
  name: string;
  date: string;
  successful: boolean;
  manifest: string;
}

function MissionLog() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [successful, setSuccessful] = useState(true);
  const [manifest, setManifest] = useState('');

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('spacex_gemini_missions');
    if (saved) {
      try {
        setMissions(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse missions', e);
      }
    } else {
      // Default initial data
      const defaultMissions: Mission[] = [
        {
          id: 'gemini-3',
          name: 'Gemini 3',
          date: '1965-03-23',
          successful: true,
          manifest: 'Gus Grissom, John Young'
        },
        {
          id: 'gemini-4',
          name: 'Gemini 4',
          date: '1965-06-03',
          successful: true,
          manifest: 'James McDivitt, Ed White'
        }
      ];
      setMissions(defaultMissions);
      localStorage.setItem('spacex_gemini_missions', JSON.stringify(defaultMissions));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !manifest) return;

    const newMission: Mission = {
      id: Date.now().toString(),
      name,
      date,
      successful,
      manifest
    };

    const updated = [newMission, ...missions];
    setMissions(updated);
    localStorage.setItem('spacex_gemini_missions', JSON.stringify(updated));

    // Reset form
    setName('');
    setDate('');
    setSuccessful(true);
    setManifest('');
  };

  const deleteMission = (id: string) => {
    const updated = missions.filter(m => m.id !== id);
    setMissions(updated);
    localStorage.setItem('spacex_gemini_missions', JSON.stringify(updated));
  }

  if (!isClient) return null;

  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto w-full font-sans">
      <div className="mb-12 border-b border-slate-800/50 pb-6">
        <h1 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-2">Mission Log</h1>
        <p className="text-sm font-mono text-cyan-500 uppercase tracking-widest">Flight Records & Telemetry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-5">
          <div className="bg-slate-900/30 border border-slate-800/50 p-6 rounded-sm">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-6 border-b border-slate-800 pb-2">Record New Mission</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Mission Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 p-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="e.g. Apollo 15"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Launch Date</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 p-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Crew Manifest</label>
                <textarea 
                  value={manifest}
                  onChange={e => setManifest(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 p-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors min-h-[80px]"
                  placeholder="Astronaut names..."
                  required
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input 
                  type="checkbox" 
                  id="successful"
                  checked={successful}
                  onChange={e => setSuccessful(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 bg-slate-950 border-slate-700"
                />
                <label htmlFor="successful" className="text-sm text-slate-300 pointer-events-none">Mission Successful</label>
              </div>

              <button 
                type="submit"
                className="w-full mt-6 py-3 border border-cyan-500/50 bg-cyan-500/10 text-[10px] uppercase tracking-[0.3em] font-bold text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all"
              >
                Log Mission
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-7">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-6 border-b border-slate-800 pb-2">Archived Records</h2>
          
          <div className="space-y-4">
            {missions.length === 0 ? (
              <p className="text-sm text-slate-500 font-mono">No missions recorded. Awaiting telemetry...</p>
            ) : (
              missions.map((mission) => (
                <div key={mission.id} className="border border-slate-800/50 bg-slate-950/40 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white tracking-tight">{mission.name}</h3>
                      <span className={`text-[9px] px-2 py-0.5 border rounded-sm font-mono uppercase tracking-wider ${mission.successful ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {mission.successful ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">{mission.date}</p>
                    <p className="text-sm text-slate-400 mt-2"><span className="text-slate-600 font-mono text-[10px] uppercase mr-2">CREW:</span>{mission.manifest}</p>
                  </div>
                  
                  <button 
                    onClick={() => deleteMission(mission.id)}
                    className="self-start text-[10px] uppercase tracking-widest font-bold text-slate-600 hover:text-red-400 border border-transparent hover:border-red-400/30 px-3 py-1 transition-all"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
