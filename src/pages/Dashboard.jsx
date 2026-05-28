import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, Title, Text, Metric, AreaChart, BadgeDelta, Flex, Grid } from "@tremor/react";
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/api/client";

// ── Hub section definitions ───────────────────────────────────────────────────

const HUB_SECTIONS = [
  {
    title: 'Operations',
    icon: '⚙️',
    color: 'border-l-green-500',
    links: [
      { to: '/revenue',     icon: '💰', label: 'Revenue Dashboard',  sub: 'Invoices · P&L · pipeline',        badge: null },
      { to: '/leads',       icon: '📬', label: 'Lead Inbox',         sub: 'Quotes · follow-ups · new leads',  badge: 'HOT' },
      { to: '/voice-calls', icon: '📞', label: 'Voice Calls',        sub: 'VAPI call log · AI answered calls', badge: null },
      { to: '/portal',      icon: '🏠', label: 'Customer Portal',    sub: 'Projects · invoices · client comms', badge: null },
      { to: '/job',         icon: '📋', label: 'Job Detail',         sub: 'Active job view · notes · status',  badge: null },
      { to: '/consultant',  icon: '🧑‍💼', label: 'Lead Consultant',   sub: 'Lead scoring · outreach assist',   badge: null },
    ],
  },
  {
    title: 'Staff & Field',
    icon: '👷',
    color: 'border-l-orange-500',
    links: [
      { to: '/staff',          icon: '👷', label: 'Staff Portal',      sub: 'Check-in · roster · doc compliance', badge: 'STAFF' },
      { to: '/crew-eta',       icon: '📍', label: 'Crew ETA',          sub: 'Live crew arrival tracking',         badge: null },
      { to: '/crew-mode',      icon: '📱', label: 'Crew Field App',    sub: 'Mobile field check-in + photos',     badge: null },
      { to: '/crew-reporting', icon: '📊', label: 'Crew Reporting',    sub: 'Daily reports · progress logs',      badge: null },
    ],
  },
  {
    title: 'Intelligence & AI',
    icon: '🤖',
    color: 'border-l-cyan-500',
    links: [
      { to: '/jwordenai',       icon: '🤖', label: 'JWordenAI',              sub: 'Construction intelligence suite',     badge: 'AI' },
      { to: '/command-center',  icon: '🦾', label: "Tony Stark's Dashboard", sub: 'Command Center · system keys · API health',  badge: 'PREMIUM' },
      { to: '/autonomy',        icon: '⚡', label: 'Autonomy Dashboard',     sub: 'Automated task status',               badge: null },
      { to: '/contractor-ai',   icon: '🏗️', label: 'Contractor AI Platform', sub: 'Bid analysis · scope generation',    badge: null },
      { to: '/virginia-statewide', icon: '🗺️', label: 'Virginia Statewide', sub: 'Market coverage + region metrics',   badge: null },
    ],
  },
  {
    title: 'Legal & Tax Advisory',
    icon: '⚖️',
    color: 'border-l-indigo-500',
    links: [
      { to: '/advisory',                  icon: '⚖️', label: 'Advisory Board',       sub: 'All 50 states · full library',          badge: null },
      { to: '/advisory/tax-compliance',   icon: '🧾', label: 'Tax Compliance',        sub: 'Fed · VA state · BPOL by county',       badge: 'NEW' },
      { to: '/advisory/legal-strategy',   icon: '🤝', label: 'Legal Strategy',        sub: 'Dispute scoring · negotiation rank',    badge: null },
      { to: '/advisory/contractor-ranker',icon: '🏆', label: 'Contractor Ranker',     sub: 'Bid scoring · license optimizer',       badge: null },
      { to: '/advisory/compare',          icon: '↔️', label: 'Compare States',        sub: 'Side-by-side 2–3 states',               badge: null },
      { to: '/advisory/utilities',        icon: '🔌', label: 'Utilities & 811',        sub: 'One-call rules · dig depths',           badge: null },
      { to: '/advisory/licensing',        icon: '📋', label: 'Contractor Licensing',  sub: 'All 50 states · reciprocity',           badge: null },
      { to: '/advisory/construction-law', icon: '📜', label: 'Construction Law',      sub: 'Liens · prompt pay · repose',           badge: null },
      { to: '/advisory/safety',           icon: '🦺', label: 'Safety & OSHA',         sub: 'State OSHA · trenching · fall protect', badge: null },
      { to: '/advisory/prevailing-wage',  icon: '💵', label: 'Prevailing Wage',       sub: 'Coverage · certified payroll',          badge: null },
      { to: '/advisory/environmental',    icon: '🌱', label: 'Environmental Permits', sub: 'NPDES · SWPPP · wetland setbacks',      badge: null },
      { to: '/advisory/building-codes',   icon: '🏗️', label: 'Building Codes',       sub: 'IBC / NEC edition years by state',      badge: null },
      { to: '/advisory/roads-paving',     icon: '🛣️', label: 'Roads & Paving Regs',  sub: 'DOT specs · Superpave · compaction',    badge: null },
      { to: '/advisory/contracts',        icon: '📝', label: 'Contract Law',          sub: 'Arbitration · anti-indemnity',          badge: null },
    ],
  },
  {
    title: 'Admin & System',
    icon: '🔧',
    color: 'border-l-stone-500',
    links: [
      { to: '/admin/documents', icon: '📁', label: 'Document Vault',   sub: 'Contract storage · file manager',    badge: null },
      { to: '/admin/slack',     icon: '💬', label: 'Slack Settings',   sub: 'Notification routing · channels',    badge: null },
      { to: '/dns-migration',   icon: '🌐', label: 'DNS Migration',    sub: 'Domain · redirect management',       badge: null },
    ],
  },
];

const BADGE_COLORS = {
  HOT:   'bg-red-100 text-red-700 border-red-200',
  NEW:   'bg-green-100 text-green-700 border-green-200',
  AI:    'bg-cyan-100 text-cyan-700 border-cyan-200',
  STAFF: 'bg-orange-100 text-orange-700 border-orange-200',
  PREMIUM: 'bg-violet-100 text-violet-700 border-violet-200',
};

const BASE = import.meta.env.VITE_API_BASE_URL || '';

const STATIC_FALLBACK = [
  { month: "Jan", "Regional Compliance": 82, "Ad ROI": 2.4 },
  { month: "Feb", "Regional Compliance": 88, "Ad ROI": 2.7 },
  { month: "Mar", "Regional Compliance": 95, "Ad ROI": 3.1 },
];

// Directly mutates the existing <meta name="robots"> tag so it overrides any
// static value from index.html (react-helmet-async adds a second tag otherwise).
function NoindexMeta() {
  useEffect(() => {
    const el = document.querySelector('meta[name="robots"]');
    const prev = el ? el.getAttribute('content') : null;
    if (el) el.setAttribute('content', 'noindex, nofollow');
    return () => { if (el && prev !== null) el.setAttribute('content', prev); };
  }, []);
  return null;
}

const Dashboard = () => {
  const [chartData, setChartData] = useState(STATIC_FALLBACK);
  const [liveData, setLiveData] = useState({ trucks: [], compaction: [] });
  const [sseStatus, setSseStatus] = useState('connecting');
  const [openSections, setOpenSections] = useState(() => HUB_SECTIONS.map(() => true));
  const [postStatus, setPostStatus] = useState(null);
  const [tweetError, setTweetError] = useState(null);
  const esRef = useRef(null);

  useEffect(() => {
    api.getSiteMetrics()
      .then((json) => { if (Array.isArray(json) && json.length > 0) setChartData(json); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const es = new EventSource(`${BASE}/api/v1/live/site-stream`);
    esRef.current = es;
    es.onopen = () => setSseStatus('live');
    es.onmessage = (e) => { try { setLiveData(JSON.parse(e.data)); } catch {} };
    es.onerror = () => setSseStatus('error');
    return () => es.close();
  }, []);

  const toggleSection = (i) => setOpenSections(prev => prev.map((v, idx) => idx === i ? !v : v));

  const postTweet = async () => {
    setPostStatus('posting');
    setTweetError(null);
    try {
      const res = await fetch('/.netlify/functions/auto-post-tweet', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPostStatus('success');
      } else {
        setPostStatus('error');
        setTweetError(data.details || data.error || `HTTP ${res.status}`);
      }
    } catch (err) {
      setPostStatus('error');
      setTweetError(err.message);
    }
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* noindex — owner-only page, must not be crawled */}
      <NoindexMeta />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-brand-navy text-white px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">JWordenAI Command Center</h1>
            <p className="text-white/60 text-sm mt-1">Owner dashboard · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-violet-300/50 bg-violet-500/15 px-3 py-1 text-xs font-semibold tracking-wide text-violet-100 uppercase">
              Stark Mode Premium
            </span>
            <span className={`h-2.5 w-2.5 rounded-full ${sseStatus === 'live' ? 'bg-green-400 animate-pulse' : sseStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'}`} />
            <span className="text-sm text-white/70">{sseStatus === 'live' ? 'Live stream active' : sseStatus === 'error' ? 'Stream offline' : 'Connecting…'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* ── Live metrics strip ──────────────────────────────────────────── */}
        <Grid numColsMd={2} numColsLg={3} className="gap-4">
          <ShadcnCard>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Regional Base Status</CardTitle></CardHeader>
            <CardContent>
              <Metric>{chartData.length > 0 ? `${chartData[chartData.length - 1]["Regional Compliance"]}%` : "—"}</Metric>
              <Text>Evaluated for proper base standards</Text>
            </CardContent>
          </ShadcnCard>
          <ShadcnCard>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Google Ads ROI</CardTitle></CardHeader>
            <CardContent>
              <Metric>{chartData.length > 0 ? `${chartData[chartData.length - 1]["Ad ROI"]}x` : "—"}</Metric>
              <Flex className="mt-2"><Text>Target: 2.5x</Text><BadgeDelta deltaType="increase" size="xs">+12%</BadgeDelta></Flex>
            </CardContent>
          </ShadcnCard>
          <ShadcnCard className="md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Backend Status</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" /><Text>FastAPI Active (Railway)</Text></div>
              <Text className="mt-1 text-xs text-gray-500">Last build check: 2 mins ago</Text>
            </CardContent>
          </ShadcnCard>
        </Grid>

        {/* ── Trend chart ─────────────────────────────────────────────────── */}
        <Card>
          <Title>Nationwide Growth Performance</Title>
          <Text>Compliance &amp; ROI trends by month</Text>
          <AreaChart className="h-64 mt-4" data={chartData} index="month"
            categories={["Regional Compliance", "Ad ROI"]} colors={["indigo", "cyan"]}
            valueFormatter={(n) => `${n}${n > 10 ? "%" : "x"}`} />
        </Card>

        {/* ── Live fleet + compaction ─────────────────────────────────────── */}
        <Grid numColsMd={2} className="gap-4">
          <ShadcnCard>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Fleet Status
                <span className={`h-2 w-2 rounded-full ${sseStatus === 'live' ? 'bg-green-500 animate-pulse' : sseStatus === 'error' ? 'bg-red-500' : 'bg-yellow-400'}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liveData.trucks.length === 0 ? <Text className="text-gray-400">No active trucks</Text> : (
                <div className="space-y-2">
                  {liveData.trucks.map((t) => (
                    <div key={t.truck_id} className="flex justify-between text-sm">
                      <span className="font-medium">{t.truck_id}</span>
                      <span className="text-gray-500">{t.asphalt_temp_f ? `${t.asphalt_temp_f}°F` : '—'}</span>
                      <span className={`capitalize ${t.status === 'on_site' ? 'text-green-600' : t.status === 'en_route' ? 'text-blue-600' : 'text-gray-400'}`}>{t.status?.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ShadcnCard>
          <ShadcnCard>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Live Compaction (last 30 min)</CardTitle></CardHeader>
            <CardContent>
              {liveData.compaction.length === 0 ? <Text className="text-gray-400">No recent pings</Text> : (
                <div className="space-y-2">
                  {liveData.compaction.slice(0, 8).map((c, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="font-medium">{c.roller_id}</span>
                      <span className="text-gray-500">Pass {c.pass_number ?? '—'}</span>
                      <span className={`font-semibold ${c.density_pct >= 92 ? 'text-green-600' : c.density_pct >= 85 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {c.density_pct != null ? `${c.density_pct}%` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ShadcnCard>
        </Grid>

        {/* ── Social Media ────────────────────────────────────────────────── */}
        <ShadcnCard>
          <CardHeader><CardTitle>Social Media</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Text>Generate and post AI-powered tweets to @JWordenandSons</Text>
              <button
                onClick={postTweet}
                disabled={postStatus === 'posting'}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {postStatus === 'posting' ? 'Generating & Posting...' : 'Generate & Post AI Tweet'}
              </button>
              {postStatus === 'success' && <Text className="text-green-600">Tweet posted successfully!</Text>}
              {postStatus === 'error' && <Text className="text-red-600">Failed to post tweet.{tweetError ? ` Error: ${tweetError}` : ''}</Text>}
            </div>
          </CardContent>
        </ShadcnCard>

        {/* ── Mega Navigation Hub ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-gray-900">All Tools & Modules</h2>
            <button
              onClick={() => setOpenSections(prev => { const allOpen = prev.every(Boolean); return prev.map(() => !allOpen); })}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline"
            >
              {openSections.every(Boolean) ? 'Collapse all' : 'Expand all'}
            </button>
          </div>

          <div className="space-y-4">
            {HUB_SECTIONS.map((section, si) => (
              <div key={section.title} className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${section.color} overflow-hidden`}>
                {/* Section header */}
                <button
                  onClick={() => toggleSection(si)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{section.icon}</span>
                    <span className="font-bold text-gray-800 text-base">{section.title}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{section.links.length}</span>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${openSections[si] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Links grid */}
                {openSections[si] && (
                  <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 border-t border-gray-50">
                    {section.links.map(({ to, icon, label, sub, badge }) => (
                      <Link
                        key={to}
                        to={to}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
                      >
                        <span className="text-xl mt-0.5 shrink-0">{icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-800 text-sm group-hover:text-brand-navy leading-tight">{label}</span>
                            {badge && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${BADGE_COLORS[badge] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                {badge}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 leading-snug block mt-0.5 truncate">{sub}</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0 mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
};

export default Dashboard;

