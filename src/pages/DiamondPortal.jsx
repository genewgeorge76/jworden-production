import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import DiamondMap from '../components/DiamondMap';
import JobScopeMap from '../components/JobScopeMap';
import { api } from '@/api/client';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  User, 
  HelpCircle, 
  LogOut, 
  Bell, 
  MapPin, 
  X,
  ArrowLeft,
  PenTool,
  Loader2,
  RefreshCw
} from 'lucide-react';

const fetchDiamondJobs = async () => {
  return await api.getDiamondJobs();
};

export default function DiamondPortal() {
  const [activeNav, setActiveNav] = useState('dashboard'); // 'dashboard' | 'available' | 'my-jobs' | 'profile'
  const [selectedJob, setSelectedJob] = useState(null); // null or job object
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'scope' | 'contacts' | 'schedule'
  const [servicesTab, setServicesTab] = useState('other'); // 'my' | 'other'
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['diamond-jobs'],
    queryFn: fetchDiamondJobs,
    refetchInterval: 30000
  });

  const activeJobs = useMemo(() => data?.active || [], [data]);
  const availableJobs = useMemo(() => data?.available || [], [data]);

  const totalActiveValue = useMemo(() => {
    return activeJobs.reduce((sum, j) => sum + (Number(j.price) || 0), 0);
  }, [activeJobs]);

  // Fallback sample job for Dollar Tree 8430 detailed view if user clicks a job
  const activeJobDetail = selectedJob || {
    id: '26544',
    job_number: '26544 - DOLLAR TREE 8430',
    title: '26544 - DOLLAR TREE 8430',
    site_address: '500 South Zane Highway Martins Ferry, OH 43935',
    status: 'ON HOLD',
    availability: 'AVAILABLE',
    total_amount: 67400,
    state: 'OH',
    services: [
      {
        name: '4" Mill & Pave',
        badge: 'APPLIED',
        desc: 'Mill asphalt at 4" depth. Grade and compact existing base. Install 4" over 2 lift(s) of asphalt and compact. (Additional costs will incur if base needs replacement)',
        est_area: '1 area',
        est_sqft: '15,374',
        status: 'AVAILABLE'
      },
      {
        name: '8" Base R&R',
        badge: 'APPLIED',
        desc: 'Excavate 8" and remove existing base material. Install 8" crushed concrete base. Grade and compact.',
        est_area: '1 area',
        est_sqft: '1,938',
        status: 'AVAILABLE'
      },
      {
        name: 'Striping',
        badge: 'APPLIED',
        desc: 'Re-stripe Entire Lot with 2 coats of Traffic Marking Paint. Includes Parking Stalls, Cross Hatches, Stencils.',
        est_area: '1 area',
        est_gallons: '6.75',
        status: 'AVAILABLE'
      }
    ],
    photos: [
      '/work/imported/KFC/IMG_9496.JPG',
      '/work/imported/KFC/IMG_9500.JPG',
      '/work/imported/KFC/IMG_9507.JPG',
      '/work/imported/KFC/IMG_9510.JPG'
    ]
  };

  const filteredAvailable = useMemo(() => {
    if (categoryFilter === 'all') return availableJobs;
    return availableJobs.filter(j => 
      (j.service_type || '').toLowerCase().includes(categoryFilter.toLowerCase())
    );
  }, [availableJobs, categoryFilter]);

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-800 flex flex-col md:flex-row font-sans antialiased">
      
      {/* ── LEFT DARK SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className="w-full md:w-64 bg-[#0a0f1d] text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 min-h-screen">
        {/* Logo Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <span className="font-black text-lg tracking-tighter">◇</span>
            </div>
            <div>
              <div className="font-black text-white text-sm tracking-widest leading-none uppercase">DIAMOND</div>
              <div className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase mt-0.5">SOLUTIONS</div>
            </div>
          </div>
        </div>

        {/* User Profile Info */}
        <div className="p-4 mx-3 my-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
            GG
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-white text-sm truncate">Gene George</div>
            <div className="text-xs text-slate-400 truncate">Diamond Solutions</div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="px-3 py-2 space-y-1 flex-1">
          <button
            onClick={() => { setActiveNav('dashboard'); setSelectedJob(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeNav === 'dashboard' && !selectedJob
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveNav('available'); setSelectedJob(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeNav === 'available' && !selectedJob
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Available Jobs</span>
            {availableJobs.length > 0 && (
              <span className="ml-auto bg-cyan-400/20 text-cyan-300 text-xs px-2 py-0.5 rounded-full font-bold">
                {availableJobs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveNav('my-jobs'); setSelectedJob(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeNav === 'my-jobs' && !selectedJob
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>My Jobs</span>
            {activeJobs.length > 0 && (
              <span className="ml-auto bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                {activeJobs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveNav('profile'); setSelectedJob(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeNav === 'profile' && !selectedJob
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </nav>

        {/* Footer Navigation */}
        <div className="p-3 border-t border-slate-800/60 space-y-1 text-xs text-slate-500">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:text-slate-300 hover:bg-slate-800/40 transition-colors">
            <HelpCircle className="w-4 h-4" />
            <span>Help</span>
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:text-slate-300 hover:bg-slate-800/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
          <div className="pt-2 px-4 text-[10px] text-slate-600 font-mono">
            Build: 1.0.8 12-07-2026 17:01
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ───────────────────────────────────────────────── */}
      <main className="flex-1 overflow-x-hidden flex flex-col min-h-screen">
        
        {/* If a specific job detail is open */}
        {selectedJob ? (
          <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
            
            {/* Back to Dashboard Button */}
            <button
              onClick={() => setSelectedJob(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-cyan-600 transition-colors uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Jobs Dashboard</span>
            </button>

            {/* Job Banner Header */}
            <div className="bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-transparent p-4 rounded-2xl border border-cyan-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 font-display uppercase tracking-tight">
                  {activeJobDetail.job_number || activeJobDetail.title}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                    ON HOLD
                  </span>
                  <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
                    AVAILABLE
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Bell notification */}
                <div className="relative w-9 h-9 rounded-full bg-cyan-500/10 text-cyan-600 flex items-center justify-center border border-cyan-200 shrink-0">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    9+
                  </span>
                </div>

                {/* Address Box */}
                <div className="bg-cyan-50/80 border border-cyan-100 px-4 py-2 rounded-xl text-right">
                  <div className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">Address</div>
                  <div className="text-xs font-semibold text-slate-800 truncate max-w-xs">
                    {activeJobDetail.site_address || '500 South Zane Highway Martins Ferry, OH 43935'}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Grid: Interactive Satellite Map (Left) + Photos Grid (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Interactive Job Scope Map */}
              <div className="lg:col-span-2 relative h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
                <JobScopeMap job={activeJobDetail} />
              </div>

              {/* Photo Gallery Grid */}
              <div className="grid grid-cols-2 gap-3 h-80">
                <div className="rounded-xl overflow-hidden bg-slate-200 border border-slate-200 relative group">
                  <img src="/work/imported/KFC/IMG_9496.JPG" alt="Site photo 1" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="rounded-xl overflow-hidden bg-slate-200 border border-slate-200 relative group">
                  <img src="/work/imported/KFC/IMG_9500.JPG" alt="Site photo 2" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="rounded-xl overflow-hidden bg-slate-200 border border-slate-200 relative group">
                  <img src="/work/imported/KFC/IMG_9507.JPG" alt="Site photo 3" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div 
                  onClick={() => setPhotoModalOpen(true)}
                  className="rounded-xl overflow-hidden bg-slate-200 border border-slate-200 relative group cursor-pointer"
                >
                  <img src="/work/imported/KFC/IMG_9510.JPG" alt="Site photo 4" className="w-full h-full object-cover brightness-75 transition-transform duration-300 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xs gap-1">
                    <span>See all photos (36)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Main Tabs Section + Services Right Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              
              {/* Left 2 Columns: Overview / Scope / Contacts / Schedule Tabs */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                
                {/* Navigation Tabs Bar */}
                <div className="border-b border-slate-200 bg-slate-50/50 px-6 flex items-center gap-8">
                  {['overview', 'scope', 'contacts', 'schedule'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 font-bold text-sm capitalize transition-all relative ${
                        activeTab === tab 
                          ? 'text-cyan-600 border-b-2 border-cyan-500' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Contents */}
                <div className="p-6 flex-1">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="text-xs text-slate-400 italic">No notes available</div>

                      <div className="grid grid-cols-2 gap-4 max-w-sm">
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center mb-2 font-bold text-xs">
                            $
                          </div>
                          <div className="text-xl font-black text-cyan-600 font-display">
                            ${(activeJobDetail.total_amount || 67400).toLocaleString()}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">Job Total</div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                          <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center mb-2 font-bold text-xs">
                            ☉
                          </div>
                          <div className="text-xl font-black text-slate-800 font-display">
                            {activeJobDetail.state || 'OH'}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">State</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'scope' && (
                    <div className="space-y-4">
                      {/* Scope Dropdown Selector & Sign Button Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <select className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 flex-1">
                          <option>Dollar Tree 8430 - 4" Mill & Pave, 8" Base R&R, Striping</option>
                          <option>Subcontractor Terms & Scope Overview</option>
                        </select>
                        <button className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs px-6 py-2 rounded-lg shadow transition-transform active:scale-95 uppercase tracking-wider flex items-center gap-2 justify-center">
                          <PenTool className="w-3.5 h-3.5" />
                          <span>Sign</span>
                        </button>
                      </div>

                      {/* Embedded Contract Document Viewer Frame */}
                      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-inner overflow-hidden">
                        <div className="bg-white rounded-lg p-6 max-h-[450px] overflow-y-auto font-serif text-slate-800 text-xs leading-relaxed border border-slate-200 shadow-md">
                          
                          <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <div className="font-sans font-black text-slate-900 text-base flex items-center gap-2">
                              <span className="text-cyan-500">◇</span> DIAMOND SOLUTIONS
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">Page 2 of 7</div>
                          </div>

                          <h3 className="font-bold font-sans text-sm text-slate-900 mb-2">2. Terms and Conditions of Work</h3>
                          <ol className="list-alpha pl-5 space-y-2 text-[11px]">
                            <li>
                              <strong>Scope of Work Performance:</strong> Subcontractor agrees to furnish all materials (unless provided by Contractor) and perform all work for project ("The Project") as described more specifically in attached Scope of Work.
                            </li>
                            <li>
                              <strong>Incorporation of Project Documents:</strong> The details of the Project, including but not limited to diagrams, drawings, plans, maps, specifications, and any other specifications, may be more specifically described and are hereby incorporated as part of this Agreement.
                            </li>
                            <li>
                              <strong>Changes to Work:</strong> Subcontractor will not alter any work or materials shown or described in Scope of Work unless pursuant to a separate written agreement from Contractor.
                            </li>
                            <li>
                              <strong>Provision of Materials and Equipment:</strong> Subcontractor agrees to furnish all materials and equipment for The Project, unless otherwise provided by Contractor.
                            </li>
                            <li>
                              <strong>Quality and Suitability of Materials:</strong> Subcontractor agrees that all materials and equipment furnished shall be of a quality satisfactory to Contractor, suitable for their intended purpose.
                            </li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'contacts' && (
                    <div className="space-y-4">
                      <div className="font-bold text-slate-800 text-sm">Project Contacts</div>
                      <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Gene George</div>
                          <div className="text-xs text-slate-500">Lead Project Superintendent</div>
                        </div>
                        <a href="tel:8044461296" className="text-xs font-bold text-cyan-600 bg-cyan-50 border border-cyan-200 px-3 py-1.5 rounded-lg">Call Manager</a>
                      </div>
                    </div>
                  )}

                  {activeTab === 'schedule' && (
                    <div className="space-y-4">
                      <div className="font-bold text-slate-800 text-sm">Project Schedule</div>
                      <div className="text-xs text-slate-600">Scheduled Start: June 2026 • Duration: 3 Days</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right 1 Column: Services Breakdown Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
                
                {/* Services Sub-Tabs */}
                <div className="flex border-b border-slate-200 pb-3 mb-4">
                  <button
                    onClick={() => setServicesTab('my')}
                    className={`flex-1 text-center font-bold text-xs pb-2 transition-colors ${
                      servicesTab === 'my' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400'
                    }`}
                  >
                    My Services
                  </button>
                  <button
                    onClick={() => setServicesTab('other')}
                    className={`flex-1 text-center font-bold text-xs pb-2 transition-colors ${
                      servicesTab === 'other' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400'
                    }`}
                  >
                    Other Services
                  </button>
                </div>

                {/* Service Items Cards */}
                <div className="space-y-4 flex-1">
                  {(activeJobDetail.services || [
                    { name: '4" Mill & Pave', badge: 'APPLIED', desc: 'Mill asphalt at 4" depth. Grade and compact existing base.', est_area: '1 area', est_sqft: '15,374', status: 'AVAILABLE' },
                    { name: '8" Base R&R', badge: 'APPLIED', desc: 'Excavate 8" and remove existing base material.', est_area: '1 area', est_sqft: '1,938', status: 'AVAILABLE' },
                    { name: 'Striping', badge: 'APPLIED', desc: 'Re-stripe Entire Lot with 2 coats of Traffic Marking Paint.', est_area: '1 area', est_gallons: '6.75', status: 'AVAILABLE' }
                  ]).map((svc, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 text-sm">{svc.name}</div>
                        <span className="bg-cyan-700 text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                          {svc.badge || 'APPLIED'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-normal line-clamp-3">
                        {svc.desc}
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 text-[11px] text-slate-500 font-mono">
                        <div>Est. {svc.est_area || '1 area'}</div>
                        <div>Est. {svc.est_sqft ? `sq.ft: ${svc.est_sqft}` : `Gallons: ${svc.est_gallons}`}</div>
                        <span className="bg-amber-100 text-amber-800 font-bold text-[9px] px-2 py-0.5 rounded uppercase">
                          {svc.status || 'AVAILABLE'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>

          </div>
        ) : (
          /* ── MAIN DASHBOARD VIEW (Matching Screenshot 3) ────────────────────── */
          <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
            
            {/* Dashboard Header Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 font-display uppercase tracking-tight">
                  DASHBOARD
                </h1>
                <button
                  onClick={async () => {
                    setSyncing(true);
                    try {
                      await api.syncDiamondJobs();
                      alert("Automated Diamond Solutions sync scraper started successfully in the background! Please check back in a few seconds.");
                    } catch (err) {
                      console.error(err);
                      alert("Failed to start sync: " + (err.message || String(err)));
                    } finally {
                      setSyncing(false);
                    }
                  }}
                  disabled={syncing}
                  className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-300 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all active:scale-95 uppercase tracking-wider"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing Bids...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync Live Jobs</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative w-9 h-9 rounded-full bg-cyan-500/10 text-cyan-600 flex items-center justify-center border border-cyan-200 shrink-0">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  9+
                </span>
              </div>
            </div>

            <DiamondMap jobs={activeJobs} onJobClick={setSelectedJob} />

            {/* Top Grid Cards: Setup + My Jobs KPI + Available Jobs KPI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Complete Your Setup Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-4">
                  COMPLETE YOUR SETUP
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Sign up and sign in</div>
                      <div className="text-[11px] text-slate-500">Securely sign in with your partner credentials..</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Complete Business Profile</div>
                      <div className="text-[11px] text-slate-500">Ensure your address and list of services are accurate.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* My Jobs KPI Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">
                    MY JOBS
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 font-display">{activeJobs.length || 7}</span>
                    <span className="text-xs text-slate-500 font-semibold">Active</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="text-2xl font-black text-slate-900 font-display">
                    ${(totalActiveValue || 156200).toLocaleString('.2f')}
                  </div>
                  <div className="text-[11px] text-slate-400 font-semibold">Total Amount</div>
                </div>
              </div>

              {/* Available Jobs KPI Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                      AVAILABLE JOBS
                    </div>
                    <button 
                      onClick={() => setActiveNav('available')}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow transition-all"
                    >
                      View all
                    </button>
                  </div>

                  <div className="text-3xl font-black text-slate-900 font-display mb-3">
                    {availableJobs.length || 14}
                  </div>

                  {/* Filter Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {['all', 'Asphalt', 'Base', 'Concrete', 'Maintenance', 'Other'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors capitalize ${
                          categoryFilter === cat
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 italic pt-3">
                  ℹ Jobs can appear in multiple categories if they include services from different types.
                </div>
              </div>

            </div>

            {/* Bottom Section: My Pipeline Columns (Pending / Contracted / Executing) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              
              <div className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                MY PIPELINE
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Column 1: Pending */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                    <span className="font-bold text-xs text-slate-800">Pending</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center text-xs text-slate-400 border border-slate-200/80">
                    No pending jobs
                  </div>
                </div>

                {/* Column 2: Contracted */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="font-bold text-xs text-slate-800">Contracted</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center text-xs text-emerald-600 font-semibold border border-slate-200/80 flex items-center justify-center gap-2">
                    <span>✓</span>
                    <span>All Started</span>
                  </div>
                </div>

                {/* Column 3: Executing */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-xs text-slate-800">Executing</span>
                    <span className="bg-cyan-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {activeJobs.length || 2}
                    </span>
                  </div>

                  {/* Job Cards List */}
                  <div className="space-y-3">
                    {activeJobs.length === 0 ? (
                      <div className="bg-slate-50 rounded-xl p-4 text-center text-xs text-slate-400 border border-slate-200/80">
                        No active jobs
                      </div>
                    ) : (
                      activeJobs.map((job, idx) => (
                        <div 
                          key={job.id || idx}
                          onClick={() => setSelectedJob(job)}
                          className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer flex gap-3 group"
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 shrink-0 relative flex items-center justify-center text-slate-500 font-bold text-xs uppercase text-center p-1">
                            {job.photos && job.photos[0] ? (
                              <img src={job.photos[0]} alt="Job thumb" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            ) : (
                              <span>No<br/>Photo</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="font-bold text-xs text-slate-900 truncate group-hover:text-cyan-600 transition-colors">
                              {job.title || job.job_number}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{job.site_address || job.address || 'No address'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="bg-cyan-100 text-cyan-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                {job.service_type || 'General'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                              <span>Deadline - {job.deadline || job.scheduled_date || 'TBD'}</span>
                              <span className="font-bold text-slate-900">${(Number(job.price) || Number(job.total_amount) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* ── PHOTO LIGHTBOX MODAL ────────────────────────────────────────────── */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-4 text-white relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm">Site Inspection Photos (36 Total)</h3>
              <button onClick={() => setPhotoModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto p-1">
              {[
                '/work/imported/KFC/IMG_9496.JPG',
                '/work/imported/KFC/IMG_9499.JPG',
                '/work/imported/KFC/IMG_9500.JPG',
                '/work/imported/KFC/IMG_9507.JPG',
                '/work/imported/KFC/IMG_9509.JPG',
                '/work/imported/KFC/IMG_9510.JPG',
                '/work/imported/KFC/IMG_9512.JPG',
                '/work/imported/KFC/IMG_9514.JPG',
                '/work/imported/KFC/IMG_9518.JPG',
                '/work/imported/KFC/IMG_9519.JPG'
              ].map((src, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                  <img src={src} alt={`Photo ${i}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
