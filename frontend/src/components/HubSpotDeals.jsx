import React from 'react';
import {
  FunnelChart, Funnel, Tooltip, ResponsiveContainer, LabelList,
  BarChart, Bar, XAxis, YAxis, Cell,
} from 'recharts';
import { DollarSign, TrendingUp, Target, AlertTriangle, Trophy, XCircle } from 'lucide-react';

const fmt = n => n == null ? '—' : n >= 1e6
  ? `$${(n / 1e6).toFixed(1)}M`
  : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K`
  : `$${Number(n).toFixed(0)}`;

const STAGE_COLORS = [
  '#06b6d4', '#0891b2', '#0e7490',
  '#8b5cf6', '#7c3aed',
  '#10b981', '#f43f5e',
];

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  const colors = {
    cyan:    'border-cyan-500/20 bg-cyan-500/5 text-cyan-400',
    violet:  'border-violet-500/20 bg-violet-500/5 text-violet-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    amber:   'border-amber-500/20 bg-amber-500/5 text-amber-400',
    rose:    'border-rose-500/20 bg-rose-500/5 text-rose-400',
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

const PipelineTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-semibold mb-1">{d.label}</p>
      <p className="text-slate-400">{d.count} deals</p>
      <p className="text-cyan-400 font-bold">{fmt(d.value)}</p>
    </div>
  );
};

export default function HubSpotDeals({ hs }) {
  if (!hs) return null;

  const pipeline    = (hs.pipeline_by_stage || []).filter(s => s.stage !== 'closedlost');
  const atRisk      = hs.at_risk_deals || [];
  const activeStages = pipeline.filter(s => s.stage !== 'closedwon' && s.count > 0);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Sales Pipeline</h2>
          <p className="text-slate-400 text-sm">Live HubSpot deals intelligence</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-orange-500/5 border border-orange-500/20 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          HubSpot Connected
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={DollarSign} label="Total Pipeline"   value={fmt(hs.total_pipeline)}    sub="open deals"         accent="cyan"    />
        <KpiCard icon={Target}     label="Weighted Value"   value={fmt(hs.weighted_pipeline)}  sub="by probability"     accent="violet"  />
        <KpiCard icon={TrendingUp} label="Avg Deal Size"    value={fmt(hs.avg_deal_size)}       sub="active deals"       accent="blue"    />
        <KpiCard icon={Trophy}     label="Win Rate"         value={`${hs.win_rate}%`}           sub={`${hs.won_deals} won · ${hs.lost_deals} lost`} accent="emerald" />
        <KpiCard icon={AlertTriangle} label="At Risk"       value={atRisk.length}               sub="deals need attention" accent={atRisk.length > 0 ? 'amber' : 'emerald'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pipeline funnel */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Pipeline by Stage</h3>
          <p className="text-xs text-slate-500 mb-4">Deal count at each stage</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={activeStages} layout="vertical" margin={{ left: 8, right: 40 }}>
              <XAxis type="number" tick={{ fontSize: 9, fill: '#475569' }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} width={100} />
              <Tooltip content={<PipelineTip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {activeStages.map((_, i) => (
                  <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline value by stage */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Value by Stage</h3>
          <p className="text-xs text-slate-500 mb-4">Total deal value at each stage</p>
          <div className="space-y-3 mt-2">
            {activeStages.map((s, i) => {
              const maxVal = Math.max(...activeStages.map(x => x.value));
              const pct = maxVal > 0 ? (s.value / maxVal) * 100 : 0;
              return (
                <div key={s.stage}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{s.label}</span>
                    <span className="font-mono font-semibold" style={{ color: STAGE_COLORS[i % STAGE_COLORS.length] }}>
                      {fmt(s.value)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct.toFixed(1)}%`, background: STAGE_COLORS[i % STAGE_COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Won/Lost summary */}
          <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
            <div className="text-center bg-emerald-500/5 border border-emerald-500/20 rounded-xl py-3">
              <p className="text-2xl font-extrabold text-emerald-400">{hs.won_deals}</p>
              <p className="text-xs text-slate-500 mt-0.5">Closed Won</p>
            </div>
            <div className="text-center bg-rose-500/5 border border-rose-500/20 rounded-xl py-3">
              <p className="text-2xl font-extrabold text-rose-400">{hs.lost_deals}</p>
              <p className="text-xs text-slate-500 mt-0.5">Closed Lost</p>
            </div>
          </div>
        </div>
      </div>

      {/* At-risk deals */}
      {atRisk.length > 0 && (
        <div className="card border-amber-500/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">Deals Needing Attention</h3>
          </div>
          <div className="space-y-3">
            {atRisk.map((deal, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-800/50 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${deal.risk === 'Overdue' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 truncate font-medium">{deal.name}</p>
                    <p className="text-xs text-slate-500">{deal.stage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <span className="font-mono font-bold text-white">{fmt(deal.amount)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    deal.risk === 'Overdue'
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    {deal.risk === 'Overdue' ? `${deal.days_overdue}d overdue` : 'No close date'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
