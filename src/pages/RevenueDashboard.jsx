import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import { DollarSign, TrendingUp, Target, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const SOURCE_LABELS = {
  google_ads: 'Google Ads',
  google_organic: 'Google Organic',
  referral: 'Referral',
  direct: 'Direct',
  gmail_inbound: 'Gmail Inbound',
  voice_ai: 'Voice AI',
  facebook: 'Facebook',
  houzz: 'Houzz',
  other: 'Other',
};

const SOURCE_COLORS = {
  google_ads: '#FFBF00',
  google_organic: '#4ade80',
  referral: '#8b5cf6',
  direct: '#94a3b8',
  gmail_inbound: '#60a5fa',
  voice_ai: '#f472b6',
  facebook: '#3b82f6',
  houzz: '#a3e635',
  other: '#78716c',
};

export default function RevenueDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.entities.Lead.list('-created_date', 1000).then((d) => {
      setLeads(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  const metrics = useMemo(() => {
    const bySource = {};
    let totalLeads = 0;
    let totalClosed = 0;
    let totalRevenue = 0;
    let totalPipelineValue = 0;

    leads.forEach((l) => {
      totalLeads++;
      const src = l.conversion_source || 'other';
      if (!bySource[src]) bySource[src] = { source: src, leads: 0, won: 0, revenue: 0, pipeline: 0 };
      bySource[src].leads++;
      if (l.status === 'won') {
        bySource[src].won++;
        const val = l.closed_value || l.estimated_value || 0;
        bySource[src].revenue += val;
        totalRevenue += val;
        totalClosed++;
      } else if (l.status !== 'lost' && l.estimated_value) {
        bySource[src].pipeline += l.estimated_value;
        totalPipelineValue += l.estimated_value;
      }
    });

    const sourceArr = Object.values(bySource)
      .map((s) => ({
        ...s,
        label: SOURCE_LABELS[s.source] || s.source,
        color: SOURCE_COLORS[s.source] || '#78716c',
        closeRate: s.leads ? Math.round((s.won / s.leads) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const overallCloseRate = totalLeads ? Math.round((totalClosed / totalLeads) * 100) : 0;
    const avgDealSize = totalClosed ? Math.round(totalRevenue / totalClosed) : 0;

    return { sourceArr, totalLeads, totalClosed, totalRevenue, totalPipelineValue, overallCloseRate, avgDealSize };
  }, [leads]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">Revenue Attribution</p>
          </div>
          <h1 className="font-display font-black text-foreground text-3xl uppercase tracking-tight">
            Where The Money Comes From
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Closed revenue + active pipeline broken down by marketing channel. Turn off what doesn't pay.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Closed Revenue" value={`$${metrics.totalRevenue.toLocaleString()}`} icon={DollarSign} highlight />
          <KPI label="Active Pipeline" value={`$${metrics.totalPipelineValue.toLocaleString()}`} icon={Target} />
          <KPI label="Close Rate" value={`${metrics.overallCloseRate}%`} />
          <KPI label="Avg Deal Size" value={`$${metrics.avgDealSize.toLocaleString()}`} />
        </div>

        {metrics.sourceArr.length === 0 ? (
          <div className="border border-dashed border-border p-12 text-center">
            <p className="font-display text-muted-foreground text-sm tracking-wider uppercase">
              No attribution data yet
            </p>
            <p className="font-body text-muted-foreground text-sm mt-2 max-w-md mx-auto">
              Tag leads with a <code className="px-1 bg-muted rounded">conversion_source</code> to see which channels drive revenue.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by source */}
            <div className="border border-border bg-card p-6">
              <h3 className="font-display font-bold text-foreground text-sm tracking-wider uppercase mb-4">
                Revenue by Channel
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={metrics.sourceArr}>
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
                    formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {metrics.sourceArr.map((entry) => <Cell key={entry.source} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Lead volume pie */}
            <div className="border border-border bg-card p-6">
              <h3 className="font-display font-bold text-foreground text-sm tracking-wider uppercase mb-4">
                Lead Volume by Channel
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={metrics.sourceArr} dataKey="leads" nameKey="label" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {metrics.sourceArr.map((entry) => <Cell key={entry.source} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Detail table */}
        {metrics.sourceArr.length > 0 && (
          <div className="border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h3 className="font-display font-bold text-foreground text-sm tracking-wider uppercase">
                Channel Performance
              </h3>
            </div>
            <div className="divide-y divide-border">
              {metrics.sourceArr.map((s) => (
                <div key={s.source} className="px-6 py-4 grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
                  <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <p className="font-display font-bold text-foreground text-sm">{s.label}</p>
                  </div>
                  <Stat label="Leads" value={s.leads} />
                  <Stat label="Won" value={s.won} />
                  <Stat label="Close %" value={`${s.closeRate}%`} />
                  <Stat label="Revenue" value={`$${s.revenue.toLocaleString()}`} emphasize />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, highlight }) {
  return (
    <div className={`border p-5 ${highlight ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={`w-4 h-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />}
        <p className="font-display text-muted-foreground text-[10px] tracking-[0.2em] uppercase">{label}</p>
      </div>
      <p className={`font-display font-black text-2xl ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function Stat({ label, value, emphasize }) {
  return (
    <div>
      <p className="font-display text-muted-foreground text-[10px] tracking-wider uppercase">{label}</p>
      <p className={`font-display font-bold text-sm mt-0.5 ${emphasize ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
