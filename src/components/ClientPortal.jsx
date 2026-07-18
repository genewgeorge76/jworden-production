import React, { useState, useEffect } from 'react';
import { 
  Box, Layers, Settings2, MessageSquare, Cpu, 
  Camera, Maximize2, ChevronRight, ShieldCheck, 
  CheckCircle2, Sparkles, RefreshCcw, Search,
  SlidersHorizontal, Sun, Moon, CloudRain, Droplets,
  X
} from 'lucide-react';

export default function ClientPortal() {
  const [activeTab, setActiveTab] = useState('visualizer');
  const [material, setMaterial] = useState('Premium Asphalt');
  const [lighting, setLighting] = useState('Daylight');
  const [chatOpen, setChatOpen] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Simulate scan progress
  useEffect(() => {
    const timer = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        return p + 1;
      });
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-amber-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Box className="w-5 h-5 text-black" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-white">J. Worden <span className="font-light text-zinc-500">| Client Portal</span></h1>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <button 
            onClick={() => setActiveTab('visualizer')} 
            className={`transition-colors ${activeTab === 'visualizer' ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'hover:text-white'}`}
          >
            4D Studio
          </button>
          <button 
            onClick={() => setActiveTab('scan')} 
            className={`transition-colors ${activeTab === 'scan' ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'hover:text-white'}`}
          >
            AI Scan Insights
          </button>
          <button 
            onClick={() => setActiveTab('documents')} 
            className={`transition-colors ${activeTab === 'documents' ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'hover:text-white'}`}
          >
            Project Files
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right">
              <p className="text-xs text-zinc-500">Welcome Home</p>
              <p className="text-sm text-zinc-200 group-hover:text-white transition-colors">The Smiths</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden group-hover:border-amber-500/50 transition-colors">
              <img src="https://i.pravatar.cc/150?u=homeowner" alt="Client" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-[1800px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 relative">
        
        {/* Left Column: Visualizer & Controls */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-3">
              Your Property Vision, <br />
              <span className="font-semibold bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">Realized.</span>
            </h2>
            <p className="text-zinc-400 text-base max-w-xl">
              Immerse yourself in a true 4D/AR preview of your upcoming project. Swap materials, explore lighting conditions, and see exactly what we're building before we break ground.
            </p>
          </div>

          {/* 4D Visualizer Viewport */}
          <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.8)] group bg-zinc-950">
            {/* Mock 3D Scene Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black">
              {/* Pseudo 3D Grid */}
              <div className="absolute inset-0 opacity-40" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
                transform: 'perspective(1000px) rotateX(60deg) translateY(200px) scale(3)',
                transformOrigin: 'bottom center'
              }} />
              
              {/* Center Object Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
              
              {/* Mock Property Graphic (Placeholder for WebGL) */}
              <div className="absolute inset-0 flex items-center justify-center flex-col z-10 transition-transform duration-[2000ms] group-hover:scale-105 ease-out">
                <Box className="w-40 h-40 text-amber-400/80 drop-shadow-[0_0_40px_rgba(245,158,11,0.6)] animate-pulse" strokeWidth={0.5} />
                <div className="mt-12 px-6 py-2.5 rounded-full border border-amber-500/20 bg-amber-500/10 backdrop-blur-md text-amber-300 text-xs tracking-[0.2em] font-medium flex items-center gap-3 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                  <RefreshCcw className="w-4 h-4 animate-spin opacity-70" />
                  RENDERING {lighting.toUpperCase()} ENGINE
                </div>
              </div>
            </div>

            {/* Overlays */}
            <div className="absolute top-6 left-6 flex gap-3">
              <div className="px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-xs font-semibold tracking-wide flex items-center gap-2 text-white">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" /> 
                LIVE 4D SYNC
              </div>
              <div className="px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-xs font-medium flex items-center gap-2 text-zinc-300">
                <Layers className="w-3.5 h-3.5 opacity-70" /> Phase 2: Driveway & Hardscape
              </div>
            </div>

            <div className="absolute bottom-6 right-6 flex gap-3">
              <button className="p-3.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 hover:scale-110 transition-all duration-300">
                <Camera className="w-5 h-5" />
              </button>
              <button className="p-3.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 hover:scale-110 transition-all duration-300">
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Configuration Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Material Selector */}
            <div className="p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 backdrop-blur-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <SlidersHorizontal className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Layers className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-medium text-white">Material Selection</h3>
                </div>
                
                <div className="flex flex-col gap-3">
                  {[
                    { name: 'Premium Asphalt', desc: 'Commercial-grade durability' },
                    { name: 'Stamped Concrete', desc: 'Elegant custom patterns' },
                    { name: 'Exposed Aggregate', desc: 'Textured modern finish' }
                  ].map(mat => (
                    <button 
                      key={mat.name}
                      onClick={() => setMaterial(mat.name)}
                      className={`group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
                        material === mat.name 
                          ? 'bg-amber-500/10 border-amber-500/30 border shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                          : 'bg-white/[0.02] border-transparent border hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="text-left">
                        <p className={`font-medium ${material === mat.name ? 'text-amber-400' : 'text-zinc-200 group-hover:text-white'}`}>
                          {mat.name}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">{mat.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${material === mat.name ? 'border-amber-500' : 'border-zinc-700'}`}>
                        {material === mat.name && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lighting / Environment */}
            <div className="p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 backdrop-blur-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sun className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <CloudRain className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-medium text-white">Environment Conditions</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'Morning', icon: Sun, color: 'text-amber-200' },
                    { id: 'Daylight', icon: Sun, color: 'text-amber-400' },
                    { id: 'Golden Hour', icon: Sun, color: 'text-orange-400' },
                    { id: 'Night', icon: Moon, color: 'text-indigo-400' },
                    { id: 'Rain', icon: CloudRain, color: 'text-blue-400' },
                    { id: 'Wet Surface', icon: Droplets, color: 'text-cyan-400' }
                  ].map(l => {
                    const Icon = l.icon;
                    return (
                      <button 
                        key={l.id}
                        onClick={() => setLighting(l.id)}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-300 ${
                          lighting === l.id 
                            ? 'bg-blue-500/10 border-blue-500/30 border shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                            : 'bg-white/[0.02] border-transparent border hover:bg-white/[0.06]'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${lighting === l.id ? l.color : 'text-zinc-500'}`} />
                        <span className={`text-xs font-medium ${lighting === l.id ? 'text-white' : 'text-zinc-400'}`}>
                          {l.id}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: AI Scan & Status */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Constructability Scan */}
          <div className="p-6 md:p-8 rounded-[2rem] bg-gradient-to-b from-[#0a1128] to-[#030303] border border-blue-500/20 relative overflow-hidden group shadow-[0_0_40px_rgba(29,78,216,0.1)]">
            <div className="absolute top-0 right-0 p-4 opacity-5 mix-blend-screen">
              <Cpu className="w-48 h-48 text-blue-400" />
            </div>
            
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-white">Constructability AI</h3>
                <p className="text-sm text-blue-300/70">Blueprint vs. Site Scan</p>
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-zinc-300 font-medium">Spatial Validation</span>
                  <span className="text-blue-400 font-mono tracking-widest">{scanProgress}%</span>
                </div>
                <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-400 transition-all duration-[400ms] ease-out relative shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                    style={{ width: `${scanProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-[pulse_1s_ease-in-out_infinite]" />
                  </div>
                </div>
                {scanProgress === 100 && (
                  <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Scan complete. No critical conflicts found.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Elevation Grade Match</p>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Site topography aligns perfectly with design specs. Drainage slope is optimal.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Material Quantity Check</p>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Dimensions verified for 450 sq ft coverage. Minimal waste projected.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">Utility Line Buffer</p>
                    <p className="text-xs text-amber-500/70 mt-1 leading-relaxed">Safe clearance detected near local water main. Pre-dig protocols verified.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Timeline */}
          <div className="p-6 md:p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-xl">
            <h3 className="text-xl font-medium mb-6 flex items-center gap-3 text-white">
              <Layers className="w-5 h-5 text-amber-500" /> Project Milestones
            </h3>
            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-amber-500 before:via-white/10 before:to-transparent">
              {[
                { label: 'Design Approval', date: 'Oct 12', status: 'done', desc: 'Homeowner signed off on 4D layout.' },
                { label: 'Permitting', date: 'In Progress', status: 'active', desc: 'Awaiting municipal approval.' },
                { label: 'Site Preparation', date: 'TBD', status: 'pending', desc: 'Grading and base foundation.' },
                { label: 'Paving & Finish', date: 'TBD', status: 'pending', desc: 'Final application and curing.' }
              ].map((step, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                  
                  {/* Marker */}
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-4 border-[#050505] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${
                    step.status === 'done' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 
                    step.status === 'active' ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse' : 
                    'bg-zinc-800'
                  }`} />
                  
                  {/* Content */}
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium ${
                        step.status === 'done' ? 'text-zinc-200' :
                        step.status === 'active' ? 'text-white' :
                        'text-zinc-500'
                      }`}>{step.label}</span>
                      <span className="text-xs font-mono text-zinc-500">{step.date}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      {/* Floating Angelic Chat Widget */}
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 flex flex-col items-end">
        
        {/* Chat Window */}
        <div className={`w-[90vw] sm:w-[400px] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] mb-4 overflow-hidden transition-all duration-500 origin-bottom-right ${
          chatOpen ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto' : 'scale-90 opacity-0 translate-y-8 pointer-events-none'
        }`}>
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-black border-2 border-amber-500/30 relative">
                <img src="https://i.pravatar.cc/150?u=angelic-ai" alt="Angelic AI" className="w-full h-full object-cover opacity-90" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black" />
              </div>
              <div>
                <h4 className="font-medium text-base text-zinc-100 flex items-center gap-1.5">
                  Angelic <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </h4>
                <p className="text-xs text-amber-500/70 tracking-wide">Client Concierge</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-zinc-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Messages */}
          <div className="h-72 p-5 overflow-y-auto space-y-5 bg-black/20">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex-shrink-0 flex items-center justify-center border border-black shadow-md">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm p-4 text-sm text-zinc-300 leading-relaxed shadow-lg backdrop-blur-md">
                Hi! I'm Angelic. I noticed you're exploring the <strong className="text-white">{material}</strong> option with <strong className="text-white">{lighting}</strong> conditions. <br/><br/>Did you know this material offers a 15-year durability guarantee in your climate?
              </div>
            </div>
            
            <div className="flex gap-3 max-w-[85%] ml-auto justify-end">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl rounded-tr-sm p-4 text-sm text-amber-100/90 leading-relaxed shadow-lg backdrop-blur-md">
                How does it handle winter salt?
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden border border-black shadow-md">
                <img src="https://i.pravatar.cc/150?u=homeowner" alt="You" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/5 bg-zinc-950">
            <div className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Ask Angelic anything..." 
                className="w-full bg-white/[0.03] border border-white/10 rounded-full py-3.5 pl-5 pr-12 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all shadow-inner"
              />
              <button className="absolute right-2 p-2 bg-amber-500 hover:bg-amber-400 text-black rounded-full transition-colors shadow-md">
                <ChevronRight className="w-4 h-4 font-bold" />
              </button>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(245,158,11,0.3)] z-50 ${
            chatOpen 
              ? 'bg-zinc-800 border border-white/10 text-white scale-90 hover:bg-zinc-700' 
              : 'bg-gradient-to-r from-amber-500 to-orange-600 text-black hover:scale-110 hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]'
          }`}
        >
          {chatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 fill-current" />}
        </button>
      </div>
    </div>
  );
}
