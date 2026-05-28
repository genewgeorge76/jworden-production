import React, { useState, useEffect, useCallback } from 'react';
import { Camera, MapPin, Clock, CheckCircle2, AlertCircle, LogOut, User, HardHat, FileText, Thermometer, Zap, ShieldAlert, Truck, Navigation, Package, Settings, Eye, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/client';

const LS_TOKEN = 'jworden_staff_token';
const LS_USER = 'jworden_staff_user';

export default function CrewFieldApp() {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem(LS_TOKEN) || ''; } catch { return ''; }
  });
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_USER) || 'null'); } catch { return null; }
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle', 'clocked_in', 'working', 'break', 'transit'
  const [photos, setPhotos] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [submitState, setSubmitState] = useState('idle'); // 'idle', 'submitting', 'submitted', 'error'
  const [submitError, setSubmitError] = useState('');
  const isLoggedIn = Boolean(token && user);
  
  // Logistics State
  const [logistics, setLogistics] = useState({
    activeVehicle: null, // 'dump_truck', 'hauler'
    loadType: null,
    loadCount: 0,
    origin: null,
    destination: 'Job Site',
    startTime: null
  });

  // Biometric & Location State
  const [location, setLocation] = useState(null);
  const [biometrics, setBiometrics] = useState({
    heartRate: 72,
    bodyTemp: 98.6,
    ambientTemp: 84,
    safetyStatus: 'optimal'
  });

  // GPS Tracking Logic
  useEffect(() => {
    if (isLoggedIn && status !== 'idle') {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
          // In a real app, we would POST this to /api/workforce/location
        },
        (err) => console.error('GPS Error:', err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isLoggedIn, status]);

  // Wearable biometric sync — only runs when VITE_WEARABLE_FEED_URL is
  // configured and points at a real device gateway. Without a real feed we
  // do NOT fire backend safety alerts (false positives create real noise).
  useEffect(() => {
    if (status !== 'working') return;
    const feedUrl = import.meta.env.VITE_WEARABLE_FEED_URL;
    if (!feedUrl) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(feedUrl, { headers: { Accept: 'application/json' } });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!data || cancelled) return;
        const hRate = Number(data.heart_rate || data.heartRate || 0);
        const bTemp = Number(data.body_temp_f || data.bodyTemp || 0);
        const aTemp = Number(data.ambient_temp_f || data.ambientTemp || 84);
        const isWarning = bTemp > 100 || hRate > 120;
        setBiometrics(prev => ({
          ...prev,
          heartRate: hRate || prev.heartRate,
          bodyTemp: bTemp || prev.bodyTemp,
          ambientTemp: aTemp || prev.ambientTemp,
          safetyStatus: isWarning ? 'warning' : 'optimal',
        }));
      } catch {
        /* ignore — wearable feed unreachable */
      }
    };
    tick();
    const interval = setInterval(tick, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [status]);

  // Real backend authentication via /api/v1/staff/login
  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!username || !password) {
      setLoginError('Enter your crew username and password.');
      return;
    }
    setLoginLoading(true);
    try {
      const data = await api.staffLogin(username, password);
      const nextUser = { username: data.username, role: data.role };
      try {
        localStorage.setItem(LS_TOKEN, data.token);
        localStorage.setItem(LS_USER, JSON.stringify(nextUser));
      } catch { /* private mode — keep session in memory */ }
      setToken(data.token);
      setUser(nextUser);
      setPassword('');
    } catch (ex) {
      setLoginError(ex.message || 'Login failed. Check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  }, [username, password]);

  const handleLogout = useCallback(() => {
    try { localStorage.removeItem(LS_TOKEN); localStorage.removeItem(LS_USER); } catch { /* ignore */ }
    setToken(''); setUser(null); setStatus('idle');
  }, []);

  // Submit shift report (clock-in + photos + GPS) to backend
  const submitShiftReport = useCallback(async () => {
    if (!token) return;
    setSubmitState('submitting');
    setSubmitError('');
    try {
      const fd = new FormData();
      fd.append('status', status);
      if (location?.lat) fd.append('lat', String(location.lat));
      if (location?.lng) fd.append('lng', String(location.lng));
      if (currentJob?.id) fd.append('job_id', String(currentJob.id));
      if (logistics.activeVehicle) fd.append('vehicle', String(logistics.activeVehicle));
      if (logistics.startTime) fd.append('vehicle_start', String(logistics.startTime));
      photos.forEach((photo, idx) => {
        if (photo instanceof File) fd.append(`photo_${idx}`, photo);
      });
      await api.staffCheckin(token, fd);
      setSubmitState('submitted');
      setTimeout(() => setSubmitState('idle'), 3000);
    } catch (ex) {
      setSubmitState('error');
      setSubmitError(ex.message || 'Submit failed. Try again.');
    }
  }, [token, status, location, currentJob, logistics, photos]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 to-black">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-brand-amber rounded-full flex items-center justify-center mb-4 shadow-lg shadow-brand-amber/20">
              <HardHat className="w-10 h-10 text-brand-navy" />
            </div>
            <h1 className="text-white font-display font-black text-2xl uppercase tracking-tight">Crew Login</h1>
            <p className="text-white/50 text-xs uppercase tracking-widest mt-1">Field Intelligence Link</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="text-red-300 text-xs bg-red-500/10 border border-red-400/30 rounded-lg p-2 text-center">{loginError}</div>
            )}
            <div>
              <label className="block text-white/60 text-[10px] uppercase font-black tracking-widest mb-2 ml-1">Username</label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="crew.username"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:ring-2 focus:ring-brand-amber focus:border-transparent transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-white/60 text-[10px] uppercase font-black tracking-widest mb-2 ml-1">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:ring-2 focus:ring-brand-amber focus:border-transparent transition-all outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-brand-amber hover:bg-brand-amber/90 text-brand-navy font-black py-4 rounded-2xl uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand-amber/10 disabled:opacity-60"
            >
              {loginLoading ? 'Signing in…' : 'Enter Field Mode'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Mobile Top Bar */}
      <div className="sticky top-0 bg-brand-navy text-white px-6 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-amber rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-brand-navy" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-white/50 leading-none">{user?.role || 'Crew'}</p>
            <p className="text-xs font-bold leading-none mt-1">{user?.username || 'Field'}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Status Dashboard */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Work Engagement</h2>
              <p className="text-brand-navy font-display font-black text-xl uppercase mt-1">
                {status === 'idle' ? 'Ready for Deployment' : status === 'clocked_in' ? 'On Site / Prep' : 'Active Ops'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
              status === 'idle' ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700 animate-pulse'
            }`}>
              {status === 'idle' ? 'Offline' : 'Live Tracking'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setStatus('clocked_in')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                status === 'clocked_in' ? 'bg-brand-navy border-brand-navy text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-brand-navy/20'
              }`}
            >
              <Clock className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-widest">Clock In</span>
            </button>
            <button 
              onClick={() => setStatus('working')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                status === 'working' ? 'bg-brand-amber border-brand-amber text-brand-navy shadow-lg shadow-brand-amber/20' : 'bg-white border-slate-100 text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-widest">Start Pave</span>
            </button>
          </div>
        </section>

        {/* Logistics & Equipment Hauling */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-2 bg-brand-navy rounded-lg">
               <Truck className="w-4 h-4 text-white" />
             </div>
             <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Logistics Control</h3>
                <p className="font-bold text-brand-navy text-sm">Transport & Hauling</p>
             </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => setLogistics(prev => ({ ...prev, activeVehicle: 'dump_truck' }))}
                 className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                   logistics.activeVehicle === 'dump_truck' ? 'bg-brand-navy border-brand-navy text-white' : 'bg-slate-50 border-slate-100 text-slate-400'
                 }`}
               >
                 <Package className="w-4 h-4" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Dump Truck</span>
               </button>
               <button 
                 onClick={() => setLogistics(prev => ({ ...prev, activeVehicle: 'hauler' }))}
                 className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                   logistics.activeVehicle === 'hauler' ? 'bg-brand-navy border-brand-navy text-white' : 'bg-slate-50 border-slate-100 text-slate-400'
                 }`}
               >
                 <Settings className="w-4 h-4" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Eq. Hauler</span>
               </button>
            </div>

            {logistics.activeVehicle && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-slate-900 rounded-2xl space-y-4"
              >
                <div className="flex justify-between items-center text-white">
                  <div>
                    <p className="text-[8px] font-black uppercase text-white/50">Current Transit</p>
                    <p className="text-xs font-bold">{logistics.activeVehicle === 'dump_truck' ? 'Asphalt Mix / Millings' : 'Roller / Paver'}</p>
                  </div>
                  <Navigation className="w-4 h-4 text-brand-amber animate-pulse" />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setStatus('transit');
                      setLogistics(prev => ({ ...prev, startTime: new Date().toLocaleTimeString() }));
                      // In real app, POST to /api/operations/logistics/start
                    }}
                    className="flex-1 bg-brand-amber text-brand-navy font-black text-[10px] py-2 rounded-lg uppercase tracking-widest"
                  >
                    Set Origin
                  </button>
                  <button 
                    className="flex-1 border border-white/20 text-white font-black text-[10px] py-2 rounded-lg uppercase tracking-widest"
                  >
                    Mark Arrival
                  </button>
                </div>

                {status === 'transit' && (
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-[8px] font-black uppercase text-brand-amber text-center tracking-[0.2em]">En Route to Job Site</p>
                    <p className="text-[10px] text-white/60 text-center mt-1 italic">Started: {logistics.startTime}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </section>

        {/* Biometric & Environment Monitoring (Wearable Link) */}
        {status !== 'idle' && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-3xl p-6 border transition-colors ${
              biometrics.safetyStatus === 'warning' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${biometrics.safetyStatus === 'warning' ? 'text-red-600' : 'text-blue-600'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Wearable Vital Link</span>
              </div>
              {biometrics.safetyStatus === 'warning' && (
                <div className="flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded-full">
                  <ShieldAlert className="w-3 h-3 text-white" />
                  <span className="text-[8px] font-black text-white uppercase">Heat Advisory</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase">Heart Rate</p>
                <p className={`text-xl font-display font-black ${biometrics.safetyStatus === 'warning' ? 'text-red-700' : 'text-brand-navy'}`}>
                  {biometrics.heartRate}<span className="text-[10px] ml-0.5">BPM</span>
                </p>
              </div>
              <div className="text-center border-x border-slate-200">
                <p className="text-[8px] font-black text-slate-400 uppercase">Body Temp</p>
                <p className="text-xl font-display font-black text-brand-navy">
                  {biometrics.bodyTemp}<span className="text-[10px] ml-0.5">°F</span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase">Environment</p>
                <div className="flex items-center justify-center gap-1">
                  <Thermometer className="w-3 h-3 text-orange-500" />
                  <p className="text-xl font-display font-black text-brand-navy">
                    {biometrics.ambientTemp}<span className="text-[10px] ml-0.5">°F</span>
                  </p>
                </div>
              </div>
            </div>

            {biometrics.safetyStatus === 'warning' && (
              <p className="mt-4 text-[9px] font-bold text-red-600 uppercase text-center animate-pulse">
                Action Required: Personnel exceeding thermal threshold. Break Recommended.
              </p>
            )}
          </motion.section>
        )}

        {/* Current Job Info */}
        <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assigned Target</span>
             <MapPin className="w-3 h-3 text-brand-amber" />
          </div>
          <div className="p-6">
            <h3 className="font-display font-black text-brand-navy text-lg leading-tight uppercase">Residential Overlay</h3>
            <p className="text-slate-500 text-sm mt-1">1284 Westbury Lane, Richmond VA</p>
            <div className="mt-4 flex gap-2">
              <span className="bg-brand-navy/5 text-brand-navy text-[10px] font-bold px-2 py-1 rounded uppercase">3,200 SQ FT</span>
              <span className="bg-brand-navy/5 text-brand-navy text-[10px] font-bold px-2 py-1 rounded uppercase">PG 64-22</span>
            </div>
          </div>
        </section>

        {/* Field Media Upload */}
        <section className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Site Intelligence Media</h3>
            <span className="text-[10px] font-bold text-brand-navy">{photos.length} Captured</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <button 
              onClick={() => {
                setIsAnalyzing(true);
                // Simulate AI inspection of asphalt joint
                setTimeout(() => {
                  setIsAnalyzing(false);
                  setAiAnalysis({
                    type: 'joint_check',
                    status: 'warning',
                    message: 'Cold Joint Deviation: 0.5" Gap Detected. Recommend Re-Roll.',
                    confidence: 0.94
                  });
                }, 2500);
              }}
              disabled={isAnalyzing}
              className="aspect-square bg-brand-navy rounded-3xl flex flex-col items-center justify-center gap-3 text-white active:scale-95 transition-all shadow-lg shadow-brand-navy/20 disabled:opacity-70"
            >
              {isAnalyzing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Eye className="w-8 h-8" />}
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isAnalyzing ? 'Analyzing...' : 'AI Pave Scan'}
              </span>
            </button>
             <button className="aspect-square bg-white border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-400 active:scale-95 transition-all">
              <Camera className="w-8 h-8" />
              <span className="text-[10px] font-black uppercase tracking-widest">Capture Photo</span>
            </button>
          </div>

          <AnimatePresence>
            {aiAnalysis && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-2xl border flex gap-3 items-center ${
                  aiAnalysis.status === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-green-50 border-green-200 text-green-800'
                }`}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-orange-600">Vision Analysis</p>
                   <p className="text-xs font-bold leading-tight">{aiAnalysis.message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Requirements / Safety Check */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
           <AlertCircle className="w-6 h-6 text-brand-amber mx-auto mb-3" />
           <p className="text-xs font-bold text-brand-navy uppercase mb-4">Site Safety Verified?</p>
           <button className="w-full py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">
             Sign Off Safety Log
           </button>
        </section>
      </div>

      {/* Persistent Mobile Action Button */}
      {status !== 'idle' && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-6 right-6 z-50"
        >
          <button
            onClick={submitShiftReport}
            disabled={submitState === 'submitting'}
            className={`w-full font-black py-5 rounded-2xl uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all ${
              submitState === 'submitted' ? 'bg-emerald-600 text-white shadow-emerald-200'
              : submitState === 'error' ? 'bg-red-600 text-white shadow-red-200'
              : 'bg-green-600 text-white shadow-green-200 disabled:opacity-70'
            }`}
          >
            {submitState === 'submitting' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            {submitState === 'submitting' ? 'Submitting…'
              : submitState === 'submitted' ? 'Shift Logged'
              : submitState === 'error' ? (submitError || 'Retry Submit')
              : 'Submit Shift Report'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
