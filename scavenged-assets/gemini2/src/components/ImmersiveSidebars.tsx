import { Link } from '@tanstack/react-router';

export function LeftSidebar() {
  return (
    <aside className="col-span-3 hidden xl:flex border-r border-slate-800/50 flex-col p-6 space-y-8 bg-slate-950/20 max-w-[320px]">
      <section>
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-4">Mission Heritage</h3>
        <div className="space-y-4">
          <div className="p-3 bg-slate-900/50 border-l-2 border-cyan-500">
            <div className="text-xs font-bold text-white mb-1">PROJECT GEMINI</div>
            <div className="text-[10px] leading-relaxed opacity-60 italic">Bridging the gap between Mercury and Apollo. Developing orbital maneuverability.</div>
          </div>
          <div className="p-3 bg-slate-900/50 border-l-2 border-slate-700 hover:border-cyan-700 transition-colors">
            <div className="text-xs font-bold text-white mb-1">APOLLO 15</div>
            <div className="text-[10px] leading-relaxed opacity-60">Command Module Pilot Alfred Worden. Record-breaking solo orbit.</div>
          </div>
        </div>
      </section>

      <section className="flex-1">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-4">Technical Parameters</h3>
        <div className="space-y-2 font-mono text-[10px]">
          <div className="flex justify-between border-b border-slate-800/30 pb-2">
            <span className="text-slate-500">VEHICLE ID</span>
            <span className="text-cyan-400">SPX-GEM-15</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/30 pb-2">
            <span className="text-slate-500">ORBITAL ALT</span>
            <span className="text-white">35,786 KM</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/30 pb-2">
            <span className="text-slate-500">VELOCITY</span>
            <span className="text-white">3,075 M/S</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/30 pb-2">
            <span className="text-slate-500">CABIN O2</span>
            <span className="text-green-400">NORMAL</span>
          </div>
        </div>
      </section>

      <div className="mt-auto">
        <div className="h-24 w-full bg-slate-900/80 rounded-lg p-2 border border-slate-800">
          <div className="flex h-full space-x-1 items-end">
            <div className="flex-1 bg-cyan-500/20 h-[40%] border-t border-cyan-500"></div>
            <div className="flex-1 bg-cyan-500/20 h-[65%] border-t border-cyan-500"></div>
            <div className="flex-1 bg-cyan-500/20 h-[45%] border-t border-cyan-500"></div>
            <div className="flex-1 bg-cyan-500/20 h-[80%] border-t border-cyan-500"></div>
            <div className="flex-1 bg-cyan-500/20 h-[55%] border-t border-cyan-500"></div>
            <div className="flex-1 bg-cyan-500/20 h-[90%] border-t border-cyan-500"></div>
            <div className="flex-1 bg-cyan-500/20 h-[30%] border-t border-cyan-500"></div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function RightSidebar() {
  return (
    <aside className="col-span-3 hidden xl:flex border-l border-slate-800/50 flex-col p-6 space-y-8 bg-slate-950/20 max-w-[320px]">
      <section>
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-4">Mission Log v2.4</h3>
        <div className="space-y-3 font-mono text-[9px]">
          <div className="flex space-x-2">
            <span className="text-cyan-500">[04:22]</span>
            <span className="opacity-80">TRANS-EARTH INJECTION BURN COMPLETE</span>
          </div>
          <div className="flex space-x-2">
            <span className="text-cyan-500">[05:40]</span>
            <span className="opacity-80 text-yellow-500">DEEP SPACE EVA INITIATED - WORDEN</span>
          </div>
          <div className="flex space-x-2">
            <span className="text-cyan-500">[06:15]</span>
            <span className="opacity-80">FILM CASSETTE RETRIEVED SUCCESSFULLY</span>
          </div>
          <div className="flex space-x-2">
            <span className="text-cyan-500">[08:00]</span>
            <span className="opacity-80">TRAJECTORY STABILIZED // END OF LOG</span>
          </div>
        </div>
      </section>

      <section className="flex-1 flex flex-col justify-center">
        <div className="space-y-4">
          <Link to="/mission-log" className="block text-center w-full py-4 border border-slate-700 bg-slate-900/50 text-[10px] uppercase tracking-[0.3em] font-bold text-white hover:bg-cyan-900/30 transition-all">Mission Log</Link>
          <Link to="/crew-roster" className="block text-center w-full py-4 border border-slate-700 bg-slate-900/50 text-[10px] uppercase tracking-[0.3em] font-bold text-white hover:bg-cyan-900/30 transition-all">Crew Roster</Link>
          <button className="w-full py-4 border border-cyan-500/50 bg-cyan-500/10 text-[10px] uppercase tracking-[0.3em] font-bold text-cyan-400">Archive Database</button>
        </div>
      </section>

      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Recording Data Stream...</span>
        </div>
      </div>
    </aside>
  );
}
