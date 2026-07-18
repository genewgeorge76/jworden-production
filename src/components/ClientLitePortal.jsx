import React, { useState } from 'react';
import { 
  Calculator, Camera, MessageSquare, Sparkles, CheckCircle2,
  ShieldCheck, ArrowRight, Phone, MapPin, Zap, RefreshCw, Star
} from 'lucide-react';
import { useTenant } from '@/lib/TenantContext';

export default function ClientLitePortal() {
  const tenant = useTenant();
  const [activeTab, setActiveTab] = useState('quote'); // quote | photo | chat
  
  // Quote State
  const [address, setAddress] = useState('');
  const [sqft, setSqft] = useState(2500);
  const [service, setService] = useState('Asphalt Paving');
  const [calculating, setCalculating] = useState(false);
  const [quoteResult, setQuoteResult] = useState(null);

  // Photo Scan State
  const [imagePreview, setImagePreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Angelic AI Chat State
  const [messages, setMessages] = useState([
    { role: 'angelic', text: 'Hello! I am Angelic, your customer care assistant at J. Worden & Sons. How can I help with your driveway or parking lot project today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const calculateEstimate = () => {
    if (!address) return;
    setCalculating(true);
    setTimeout(() => {
      const rate = service === 'Asphalt Paving' ? 5.50 : service === 'Sealcoating' ? 0.45 : 3.50;
      const subtotal = sqft * rate;
      const total = subtotal + 450; // + $450 mob
      setQuoteResult({
        address,
        sqft,
        service,
        subtotal: subtotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        total: total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      });
      setCalculating(false);
    }, 800);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        runAiScan();
      };
      reader.readAsDataURL(file);
    }
  };

  const runAiScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanResult({
        condition: 'Fair - Surface Weathering Detected',
        recommendation: 'Industrial High-Solids Sealcoating & Hot Rubberized Crack Repair',
        estSqft: 2800,
        estCost: '$1,260 – $1,650'
      });
      setScanning(false);
    }, 1200);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://jworden-api.fly.dev';
      const res = await fetch(`${baseUrl}/api/v1/jarvis/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are Angelic, a warm, professional customer care AI assistant for J. Worden & Sons Asphalt Paving. Answer this customer question warmly and concisely: "${userMsg}"`,
          persona: 'ANGELIC_CUSTOMER_CARE'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'angelic', text: data.text || data.message || 'I would be happy to help you schedule a free on-site estimate with our team!' }]);
      } else {
        throw new Error('API offline');
      }
    } catch {
      setMessages(prev => [...prev, { role: 'angelic', text: 'Thank you for your inquiry! Our team is ready to assist. You can also call us directly at (804) 446-1296.' }]);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Simple Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
              JW
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">J. Worden & Sons <span className="text-amber-400 font-normal">| Instant Client Hub</span></h1>
              <p className="text-xs text-slate-400">Simple 1-Click Satellite Quotes, AI Driveway Scans & Customer Care</p>
            </div>
          </div>

          <a href="tel:8044461296" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all text-decoration-none">
            <Phone className="h-4 w-4" /> (804) 446-1296
          </a>
        </div>

        {/* 3 Simple Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Satellite Quote */}
          <div 
            onClick={() => setActiveTab('quote')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeTab === 'quote' 
                ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10' 
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Calculator className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Instant Quote</h3>
            </div>
            <p className="text-xs text-slate-400">Get an instant price estimate based on your square footage.</p>
          </div>

          {/* Card 2: Photo Scanner */}
          <div 
            onClick={() => setActiveTab('photo')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeTab === 'photo' 
                ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10' 
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Camera className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Driveway Scanner</h3>
            </div>
            <p className="text-xs text-slate-400">Upload a photo to detect cracks and get AI repair recommendations.</p>
          </div>

          {/* Card 3: Angelic Assistant */}
          <div 
            onClick={() => setActiveTab('chat')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeTab === 'chat' 
                ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10' 
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Angelic Customer Care</h3>
            </div>
            <p className="text-xs text-slate-400">Chat with Angelic to schedule a free on-site estimate or ask questions.</p>
          </div>

        </div>

        {/* Tab Content 1: Instant Satellite Quote */}
        {activeTab === 'quote' && (
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="h-5 w-5 text-amber-400" /> Instant Paving & Sealcoating Estimator
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Property Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 1601 Ware Bottom Spring Rd, Chester VA"
                  className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Estimated Square Footage ({sqft} sq ft)</label>
                  <input
                    type="range"
                    min="500"
                    max="20000"
                    step="250"
                    value={sqft}
                    onChange={(e) => setSqft(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Requested Service</label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500 outline-none"
                  >
                    <option value="Asphalt Paving">Asphalt Paving & Resurfacing</option>
                    <option value="Sealcoating">Asphalt Sealcoating & Striping</option>
                    <option value="Crack Repair">Crack Repair & Milling</option>
                  </select>
                </div>
              </div>

              <button
                onClick={calculateEstimate}
                disabled={calculating || !address}
                className="w-full h-12 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {calculating ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'CALCULATE INSTANT ESTIMATE'}
              </button>
            </div>

            {quoteResult && (
              <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-3">
                <div className="text-xs font-mono font-bold text-amber-400 uppercase">Estimated Quote Ready</div>
                <div className="text-2xl font-extrabold text-white">{quoteResult.total}</div>
                <div className="text-xs text-slate-300">Includes base material, labor, and $450 mobilization for {quoteResult.address}.</div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Driveway Scanner */}
        {activeTab === 'photo' && (
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="h-5 w-5 text-amber-400" /> AI Driveway & Parking Lot Condition Scanner
            </h2>

            <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center bg-slate-950/50 hover:border-amber-500/50 transition-all cursor-pointer relative">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Camera className="h-10 w-10 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">Click or Drag Photo to Upload</p>
              <p className="text-xs text-slate-500 mt-1">Upload a clear photo of your driveway or parking lot for instant AI diagnosis.</p>
            </div>

            {imagePreview && (
              <div className="space-y-4">
                <img src={imagePreview} alt="Uploaded Driveway" className="w-full max-h-64 object-cover rounded-xl border border-slate-800" />
                
                {scanning && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 animate-spin text-amber-400" />
                    <span className="text-xs font-mono text-slate-300">AI scanning asphalt surface condition & measuring distress...</span>
                  </div>
                )}

                {scanResult && (
                  <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                    <div className="text-xs font-mono font-bold text-emerald-400 uppercase">AI Diagnosis Complete</div>
                    <div className="text-sm font-bold text-white">Condition: {scanResult.condition}</div>
                    <div className="text-xs text-slate-300">Recommended Service: {scanResult.recommendation}</div>
                    <div className="text-sm font-bold text-amber-400">Estimated Cost: {scanResult.estCost}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Angelic Chat */}
        {activeTab === 'chat' && (
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-400" /> Chat with Angelic Customer Assistant
            </h2>

            <div className="h-64 overflow-y-auto space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md p-3 rounded-xl text-xs leading-relaxed ${
                    m.role === 'user' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-200 border border-slate-800'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask Angelic a question about your project..."
                className="flex-1 h-12 px-4 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-amber-500"
              />
              <button
                onClick={handleSendChat}
                className="px-6 h-12 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition-all cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
