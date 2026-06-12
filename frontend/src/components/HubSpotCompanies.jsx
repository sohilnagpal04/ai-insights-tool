import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Building2, DollarSign, Globe, Layers } from 'lucide-react';

const PIE_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6', '#ec4899', '#14b8a6'];

const fmt = n => n == null ? '—' : n >= 1e9
  ? `$${(n / 1e9).toFixed(1)}B`
  : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M`
  : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K`
  : `$${Number(n).toFixed(0)}`;

const RADIAN = Math.PI / 180;
function DonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  return (
    <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  const colors = {
    cyan:    'border-cyan-500/20 bg-cyan-500/5 text-cyan-400',
    violet:  'border-violet-500/20 bg-violet-500/5 text-violet-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
  }[accent] || '';
  return (
    <div className={`card border ${colors} flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        <Icon size={15} className="opacity-70" />
        <p className="text-xs uppercase tracking-wider opacity-70">{label}</p>
      </div>
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      {sub && <p className="text-xs opacity-50">{sub}</p>}
    </div>
  );
}

export default function HubSpotCompanies({ hs }) {
  if (!hs) return null;

  const industries = Object.entries(hs.industries || {}).map(([name, value]) => ({ name, value }));
  const countries  = Object.entries(hs.countries  || {}).map(([name, value]) => ({ name, value }));
  const sizes      = Object.entries(hs.size_distribution || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Company Intelligence</h2>
          <p className="text-slate-400 text-sm">Industry breakdown, size segments, and revenue profile</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-orange-500/5 border border-orange-500/20 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          HubSpot Connected
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Building2}  label="Total Companies"    value={hs.total_companies?.toLocaleString()} sub="in HubSpot"       accent="cyan"    />
        <KpiCard icon={DollarSign} label="Avg Annual Revenue" value={fmt(hs.avg_annual_revenue)}           sub="per company"     accent="emerald" />
        <KpiCard icon={DollarSign} label="Total Revenue"      value={fmt(hs.total_revenue)}                sub="combined CRM base" accent="violet"  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Industry donut */}
        {industries.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Industry Mix</h3>
            <div className="flex items-center gap-4">
              <PieChart width={140} height={140}>
                <Pie data={industries} cx={65} cy={65} innerRadius={35} outerRadius={65}
                  dataKey="value" labelLine={false} label={DonutLabel}>
                  {industries.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
              <div className="flex-1 space-y-1.5">
                {industries.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-300 truncate flex-1">{d.name.replace(/_/g, ' ')}</span>
                    <span className="text-slate-500">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Company size distribution */}
        {sizes.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-200 mb-1">Company Size</h3>
            <p className="text-xs text-slate-500 mb-4">Employees</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sizes} margin={{ left: -10, right: 10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
                <Tooltip formatter={v => [v, 'companies']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {sizes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Countries */}
      {countries.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Geographic Distribution</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {countries.map((c, i) => {
              const max = Math.max(...countries.map(x => x.value));
              return (
                <div key={c.name} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300 font-medium">{c.name}</span>
                    <span className="font-bold" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>{c.value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${((c.value / max) * 100).toFixed(0)}%`,
                      background: PIE_COLORS[i % PIE_COLORS.length],
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
