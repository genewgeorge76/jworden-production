import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, Zap, Calendar } from 'lucide-react';

const COLORS = ['#2B7A0B', '#FFC700', '#4B5563', '#00C9A7', '#FF6B6B', '#4ECDC4'];

export default function CrewReporting() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await api.functions.invoke('crewMetrics', {});
      setMetrics(response.data);
      setLoading(false);
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const summary = metrics?.summary || [];

  // Prepare data for charts
  const crewProductivity = summary.map((crew) => ({
    crew: crew.crew,
    sqft: crew.totalSqft,
  }));

  const crewEfficiency = summary.map((crew) => ({
    crew: crew.crew,
    avgPerJob: crew.avgSqftPerJob,
    avgDuration: crew.avgDuration,
  }));

  const monthlyData = {};
  summary.forEach((crew) => {
    Object.entries(crew.monthlyData).forEach(([month, sqft]) => {
      if (!monthlyData[month]) monthlyData[month] = {};
      monthlyData[month][crew.crew] = sqft;
    });
  });

  const timeSeriesData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display font-black text-foreground text-3xl uppercase tracking-tight">
            Crew Performance
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Aggregate metrics and team productivity analysis
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total Crews', value: summary.length },
            { icon: TrendingUp, label: 'Total Sq Ft', value: summary.reduce((a, b) => a + b.totalSqft, 0).toLocaleString() },
            { icon: Zap, label: 'Total Jobs', value: summary.reduce((a, b) => a + b.jobCount, 0) },
            { icon: Calendar, label: 'Avg Output/Month', value: Math.round(summary.reduce((a, b) => a + b.avgMonthlyOutput, 0) / summary.length).toLocaleString() },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="border border-border bg-card p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Icon className="w-5 h-5 text-primary" />
                <p className="font-display text-muted-foreground text-xs tracking-wider uppercase">{label}</p>
              </div>
              <p className="font-display font-black text-foreground text-2xl">
                {typeof value === 'number' && value > 100000 ? (value / 1000).toFixed(1) + 'K' : value}
              </p>
            </div>
          ))}
        </div>

        {/* Main charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Crew productivity */}
          <div className="border border-border bg-card p-6 rounded-lg">
            <h2 className="font-display font-bold text-foreground text-lg uppercase tracking-wide mb-6">
              Total Sq Ft by Crew
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={crewProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="crew" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                  }}
                  formatter={(value) => value.toLocaleString()}
                />
                <Bar dataKey="sqft" fill="hsl(43, 100%, 50%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Crew distribution */}
          <div className="border border-border bg-card p-6 rounded-lg">
            <h2 className="font-display font-bold text-foreground text-lg uppercase tracking-wide mb-6">
              Job Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={summary}
                  dataKey="jobCount"
                  nameKey="crew"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.crew}: ${entry.jobCount}`}
                >
                  {summary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time series */}
        {timeSeriesData.length > 0 && (
          <div className="border border-border bg-card p-6 rounded-lg">
            <h2 className="font-display font-bold text-foreground text-lg uppercase tracking-wide mb-6">
              Monthly Output Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                  }}
                  formatter={(value) => value.toLocaleString()}
                />
                <Legend />
                {summary.map((crew, index) => (
                  <Line
                    key={crew.crew}
                    type="monotone"
                    dataKey={crew.crew}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Detailed crew table */}
        <div className="border border-border bg-card rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-display font-bold text-foreground text-lg uppercase tracking-wide">
              Crew Rankings
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left font-display font-bold text-foreground text-xs tracking-wider uppercase">Crew</th>
                  <th className="px-6 py-3 text-left font-display font-bold text-foreground text-xs tracking-wider uppercase">Total Sq Ft</th>
                  <th className="px-6 py-3 text-left font-display font-bold text-foreground text-xs tracking-wider uppercase">Jobs</th>
                  <th className="px-6 py-3 text-left font-display font-bold text-foreground text-xs tracking-wider uppercase">Avg Sq Ft/Job</th>
                  <th className="px-6 py-3 text-left font-display font-bold text-foreground text-xs tracking-wider uppercase">Avg Duration</th>
                  <th className="px-6 py-3 text-left font-display font-bold text-foreground text-xs tracking-wider uppercase">Avg Monthly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.map((crew, index) => (
                  <tr key={crew.crew} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-display font-bold text-foreground flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      {crew.crew}
                    </td>
                    <td className="px-6 py-4 text-foreground">{crew.totalSqft.toLocaleString()}</td>
                    <td className="px-6 py-4 text-foreground">{crew.jobCount}</td>
                    <td className="px-6 py-4 text-foreground">{crew.avgSqftPerJob.toLocaleString()}</td>
                    <td className="px-6 py-4 text-foreground">{crew.avgDuration} day(s)</td>
                    <td className="px-6 py-4 text-foreground font-display font-bold text-primary">
                      {crew.avgMonthlyOutput.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
