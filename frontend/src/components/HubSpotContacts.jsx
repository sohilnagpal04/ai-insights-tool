import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Users, UserCheck, Star, TrendingUp } from 'lucide-react';

const PIE_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6'];

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  const colors = {
    cyan:    'border-cyan-500/20 bg-cyan-500/5 text-cyan-400',
    violet:  'border-violet-500/20 bg-violet-500/5 text-violet-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    amber:   'border-amber-500/20 bg-amber-500/5 text-amber-400',
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

const RADIAN = Math.PI / 180;
function DonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.07) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  return (
    <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function HubSpotContacts({ hs }) {
  if (!hs) return null;

  const funnel    = (hs.lifecycle_funnel || []).filter(s => s.count > 0);
  const maxCount  = Math.max(...funnel.map(s => s.count), 1);
  const countries = Object.entries(hs.top_countries || {}).map(([name, value]) => ({ name, value }));
  const titles    = Object.entries(hs.top_job_titles || {}).map(([name, value]) => ({ name, value }));
  const status    = Object.entries(hs.lead_status || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Contact Intelligence</h2>
          <p className="text-slate-400 text-sm">Lifecycle funnel and lead quality breakdown</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-orange-500/5 border border-orange-500/20 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          HubSpot Connected
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users}     label="Total Contacts"   value={hs.total_contacts?.toLocaleString()} sub="in HubSpot"         accent="cyan"    />
        <KpiCard icon={TrendingUp} label="MQLs"            value={hs.mqls}                              sub="marketing qualified" accent="violet"  />
        <KpiCard icon={Star}      label="SQLs"             value={hs.sqls}                              sub="sales qualified"    accent="amber"   />
        <KpiCard icon={UserCheck} label="Customers"        value={hs.customers}                         sub={`${hs.conversion_rate}% conversion`} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Lifecycle funnel */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Lifecycle Funnel</h3>
          <p className="text-xs text-slate-500 mb-5">Contacts at each stage</p>
          <div className="space-y-3">
            {funnel.map((s, i) => {
              const pct = (s.count / maxCount) * 100;
              const color = PIE_COLORS[i % PIE_COLORS.length];
              return (
                <div key={s.stage}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{s.label}</span>
                    <span className="font-mono font-semibold" style={{ color }}>{s.count.toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct.toFixed(1)}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead status + countries */}
        <div className="space-y-4">

          {/* Lead status donut */}
          {status.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Lead Status</h3>
              <div className="flex items-center gap-4">
                <PieChart width={110} height={110}>
                  <Pie data={status} cx={50} cy={50} innerRadius={28} outerRadius={50}
                    dataKey="value" labelLine={false} label={DonutLabel}>
                    {status.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
                <div className="flex-1 space-y-1.5">
                  {status.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-300 truncate flex-1">{s.name}</span>
                      <span className="text-slate-500">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top countries */}
          {countries.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Top Countries</h3>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={countries} layout="vertical" margin={{ left: 0, right: 30 }}>
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#475569' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={90} />
                  <Tooltip formatter={v => [v, 'contacts']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {countries.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top job titles */}
      {titles.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Top Job Titles</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {titles.map((t, i) => (
              <div key={t.name} className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-slate-300 truncate">{t.name}</span>
                <span className="text-sm font-bold ml-3 flex-shrink-0" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
