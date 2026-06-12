import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell,
} from 'recharts';
import { Table2, Hash, AlertTriangle, ShieldCheck, Layers, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── Palette ───────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6', '#ec4899'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null || n === '') return '—';
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return Number(n).toFixed(2);
}

function corrLabel(r) {
  const a = Math.abs(r);
  if (a >= 0.7) return { label: 'Strong',   cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  if (a >= 0.4) return { label: 'Moderate', cls: 'text-amber-400  bg-amber-500/10  border-amber-500/20'  };
  return              { label: 'Weak',     cls: 'text-slate-400  bg-slate-700/50  border-slate-600'      };
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
  const cfg = {
    cyan:    { ring: 'border-cyan-500/20',    bg: 'bg-cyan-500/10',    text: 'text-cyan-400'    },
    violet:  { ring: 'border-violet-500/20',  bg: 'bg-violet-500/10',  text: 'text-violet-400'  },
    blue:    { ring: 'border-blue-500/20',    bg: 'bg-blue-500/10',    text: 'text-blue-400'    },
    amber:   { ring: 'border-amber-500/20',   bg: 'bg-amber-500/10',   text: 'text-amber-400'   },
    emerald: { ring: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    rose:    { ring: 'border-rose-500/20',    bg: 'bg-rose-500/10',    text: 'text-rose-400'    },
  }[accent] || {};
  return (
    <div className={`card border ${cfg.ring} flex flex-col gap-3`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg}`}>
        <Icon size={18} className={cfg.text} />
      </div>
      <div>
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`font-extrabold text-3xl leading-none ${cfg.text}`}>{value}</p>
        {sub && <p className="text-slate-600 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Area chart (distribution) ─────────────────────────────────────────────────
function DistributionCard({ col, data, index }) {
  const gradId  = `grad-${col.replace(/\W/g, '')}`;
  const isEven  = index % 2 === 0;
  const color   = isEven ? '#06b6d4' : '#8b5cf6';
  const total   = data.reduce((s, d) => s + d.value, 0);
  const meanIdx = (() => {
    let cum = 0;
    for (let i = 0; i < data.length; i++) {
      cum += data[i].value;
      if (cum >= total / 2) return i;
    }
    return 0;
  })();
  const meanLabel = data[meanIdx]?.label;

  const AreaTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs shadow-xl">
        <p className="text-slate-400 mb-0.5">{label}</p>
        <p className="font-bold" style={{ color }}>{payload[0].value} rows</p>
      </div>
    );
  };

  return (
    <div className="card group hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-slate-100">{col}</p>
          <p className="text-xs text-slate-500 mt-0.5">{total} total rows</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full border"
          style={{ color, borderColor: color + '40', background: color + '15' }}>
          numeric
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#475569' }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
          <Tooltip content={<AreaTip />} />
          {meanLabel && (
            <ReferenceLine x={meanLabel} stroke={color} strokeDasharray="4 2" strokeOpacity={0.6}
              label={{ value: 'median', position: 'top', fontSize: 8, fill: color }} />
          )}
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
            fill={`url(#${gradId})`} dot={false} activeDot={{ r: 4, fill: color }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Donut chart (categorical) ─────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
function DonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) {
  if (percent < 0.07) return null;
  const r  = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

const DonutTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-semibold">{payload[0].name}</p>
      <p className="text-slate-400">{payload[0].value} rows</p>
    </div>
  );
};

function CategoryCard({ col, vals }) {
  const data    = Object.entries(vals).map(([name, value]) => ({ name, value }));
  const total   = data.reduce((s, d) => s + d.value, 0);
  const topVal  = data[0];

  return (
    <div className="card hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-100 truncate">{col}</p>
        <span className="text-xs px-2 py-0.5 rounded-full border text-violet-400 border-violet-500/30 bg-violet-500/10 flex-shrink-0 ml-2">
          categorical
        </span>
      </div>
      <div className="flex items-center gap-4">
        <PieChart width={120} height={120}>
          <Pie data={data} cx={55} cy={55} innerRadius={30} outerRadius={55}
            dataKey="value" labelLine={false} label={DonutLabel}>
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip content={<DonutTip />} />
        </PieChart>
        <div className="flex-1 min-w-0 space-y-1.5">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="text-xs text-slate-300 truncate flex-1">{d.name}</span>
              <span className="text-xs text-slate-500 flex-shrink-0">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
      {topVal && (
        <p className="text-xs text-slate-600 mt-3 border-t border-slate-800 pt-2">
          Top: <span className="text-slate-400">{topVal.name}</span> · {((topVal.value / total) * 100).toFixed(0)}% of rows
        </p>
      )}
    </div>
  );
}

// ── Correlation row ───────────────────────────────────────────────────────────
function CorrelationRow({ columns, correlation }) {
  const pos      = correlation >= 0;
  const abs      = Math.abs(correlation);
  const color    = pos ? '#06b6d4' : '#f43f5e';
  const { label, cls } = corrLabel(correlation);
  const Icon     = abs >= 0.4 ? (pos ? TrendingUp : TrendingDown) : Minus;

  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-800/60 last:border-0">
      <Icon size={16} style={{ color }} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-slate-200 truncate">{columns}</span>
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            <span className={`text-xs border px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
            <span className="font-mono text-sm font-bold" style={{ color }}>
              {pos ? '+' : ''}{correlation.toFixed(3)}
            </span>
          </div>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(abs * 100).toFixed(1)}%`,
              background: `linear-gradient(90deg, ${color}aa, ${color})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Numeric table ─────────────────────────────────────────────────────────────
function NumericTable({ numericSummary }) {
  const stats = ['mean', 'std', 'min', '50%', 'max'];
  const cols  = Object.keys(numericSummary.mean || {});
  if (!cols.length) return null;
  return (
    <div className="card overflow-x-auto">
      <h3 className="text-sm font-semibold text-slate-200 mb-4">Numeric Summary</h3>
      <table className="w-full text-xs text-left">
        <thead>
          <tr className="border-b border-slate-700/60">
            <th className="pb-2.5 pr-6 text-slate-500 uppercase tracking-wider font-medium">Column</th>
            {stats.map(s => (
              <th key={s} className={`pb-2.5 pr-4 text-right uppercase tracking-wider font-medium ${
                s === 'min' ? 'text-rose-500/70' : s === 'max' ? 'text-cyan-500/70' : 'text-slate-500'
              }`}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cols.map((col, ri) => (
            <tr key={col} className={`border-b border-slate-800/50 last:border-0 ${ri % 2 === 1 ? 'bg-slate-800/20' : ''}`}>
              <td className="py-2.5 pr-6 text-slate-200 font-medium">{col}</td>
              {stats.map(s => (
                <td key={s} className={`py-2.5 pr-4 font-mono text-right ${
                  s === 'min' ? 'text-rose-400' : s === 'max' ? 'text-cyan-400' : 'text-slate-400'
                }`}>{fmt(numericSummary[s]?.[col])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-700 mt-3">
        <span className="text-rose-400">min</span> · <span className="text-cyan-400">max</span> values highlighted
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Overview({ session }) {
  const { summary, charts } = session;
  const numericSummary     = summary.numeric_summary || {};
  const correlations       = summary.top_correlations || [];
  const missingValues      = summary.missing_values || {};
  const categoricalSummary = summary.categorical_summary || {};
  const dtypes             = summary.dtypes || {};

  const missingTotal  = Object.values(missingValues).reduce((a, b) => a + b, 0);
  const numericCols   = Object.values(dtypes).filter(t => !['str', 'object'].includes(t)).length;
  const totalCells    = (summary.row_count || 0) * (summary.column_count || 0);
  const qualityScore  = totalCells > 0 ? Math.round(((totalCells - missingTotal) / totalCells) * 100) : 100;
  const chartEntries  = Object.entries(charts || {});

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Dataset Overview</h2>
          <p className="text-slate-400 text-sm">
            {summary.row_count?.toLocaleString()} rows · {summary.column_count} columns · {numericCols} numeric · {Object.keys(categoricalSummary).length} categorical
          </p>
        </div>
        <div className={`text-right px-4 py-2 rounded-xl border ${qualityScore >= 90 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
          <p className="text-xs text-slate-500 mb-0.5">Data Quality</p>
          <p className={`text-2xl font-extrabold ${qualityScore >= 90 ? 'text-emerald-400' : 'text-rose-400'}`}>{qualityScore}%</p>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Table2}        label="Rows"       value={summary.row_count?.toLocaleString()} accent="cyan"   />
        <StatCard icon={Hash}          label="Columns"    value={summary.column_count}                accent="violet" />
        <StatCard icon={AlertTriangle} label="Anomalies"  value={summary.anomaly_count ?? 0}
          sub={summary.anomaly_count > 0 ? `${((summary.anomaly_count / summary.row_count) * 100).toFixed(1)}% of rows` : 'none detected'}
          accent={summary.anomaly_count > 0 ? 'amber' : 'emerald'} />
        <StatCard icon={Layers}        label="Missing"    value={missingTotal}
          sub={missingTotal > 0 ? `across ${Object.keys(missingValues).length} columns` : 'dataset complete'}
          accent={missingTotal > 0 ? 'rose' : 'emerald'} />
      </div>

      {/* Distributions */}
      {chartEntries.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-slate-200 mb-1">Distributions</h3>
          <p className="text-xs text-slate-500 mb-4">How values are spread across each numeric column</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chartEntries.map(([col, data], i) => (
              <DistributionCard key={col} col={col} data={data} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Correlations */}
      {correlations.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-slate-200 mb-1">Correlations</h3>
          <p className="text-xs text-slate-500 mb-4">
            How strongly pairs of numeric columns move together · scale 0 → 1
          </p>
          <div className="card">
            {correlations.map((c, i) => (
              <CorrelationRow key={i} columns={c.columns} correlation={c.correlation} />
            ))}
            <p className="text-xs text-slate-700 mt-3 pt-3 border-t border-slate-800/60">
              <span className="text-cyan-400">↑ Positive</span> — both columns rise together ·{' '}
              <span className="text-rose-400">↓ Negative</span> — one rises as the other falls
            </p>
          </div>
        </section>
      )}

      {/* Categorical breakdown */}
      {Object.keys(categoricalSummary).length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-slate-200 mb-1">Categorical Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Top value distribution per category column</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoricalSummary).map(([col, vals]) => (
              <CategoryCard key={col} col={col} vals={vals} />
            ))}
          </div>
        </section>
      )}

      {/* Numeric summary table */}
      {Object.keys(numericSummary).length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-slate-200 mb-1">Numeric Stats</h3>
          <p className="text-xs text-slate-500 mb-4">Mean, spread, and range for every numeric column</p>
          <NumericTable numericSummary={numericSummary} />
        </section>
      )}

    </div>
  );
}
