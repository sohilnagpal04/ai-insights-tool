import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Table2, Hash, AlertTriangle, TrendingUp } from 'lucide-react';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-slate-400 text-xs mb-0.5">{label}</p>
        <p className="text-white font-bold text-xl">{value}</p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dash-800 border border-slate-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-400">{label}</p>
      <p className="text-cyan-400 font-semibold">{payload[0].value}</p>
    </div>
  );
};

export default function Overview({ session }) {
  const { summary, charts } = session;
  const numericSummary = summary.numeric_summary || {};
  const correlations = summary.top_correlations || [];
  const missingValues = summary.missing_values || {};
  const categoricalSummary = summary.categorical_summary || {};

  const chartEntries = Object.entries(charts || {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Dataset Overview</h2>
        <p className="text-slate-400 text-sm">Summary statistics and distributions for your data.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Table2}       label="Rows"         value={summary.row_count}    accent="bg-cyan-500/10 text-cyan-400" />
        <StatCard icon={Hash}         label="Columns"      value={summary.column_count} accent="bg-violet-500/10 text-violet-400" />
        <StatCard icon={AlertTriangle} label="Anomalies"   value={summary.anomaly_count ?? 0} accent="bg-amber-500/10 text-amber-400" />
        <StatCard icon={TrendingUp}   label="Missing vals" value={Object.values(missingValues).reduce((a, b) => a + b, 0) || 0} accent="bg-rose-500/10 text-rose-400" />
      </div>

      {/* Histograms */}
      {chartEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Column Distributions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chartEntries.map(([col, data]) => (
              <div key={col} className="card">
                <p className="text-xs font-semibold text-slate-300 mb-3 truncate">{col}</p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                      {data.map((_, i) => (
                        <Cell key={i} fill={i % 2 === 0 ? '#06b6d4' : '#0891b2'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Numeric summary table */}
      {Object.keys(numericSummary).length > 0 && (
        <div className="card overflow-x-auto">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Numeric Summary</h3>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="pb-2 text-slate-400 pr-4">Column</th>
                {['mean', 'std', 'min', '50%', 'max'].map(s => (
                  <th key={s} className="pb-2 text-slate-400 pr-4">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(numericSummary.mean || {}).map(col => (
                <tr key={col} className="border-b border-slate-800 last:border-0">
                  <td className="py-2 pr-4 text-slate-300 font-medium truncate max-w-[120px]">{col}</td>
                  {['mean', 'std', 'min', '50%', 'max'].map(stat => (
                    <td key={stat} className="py-2 pr-4 text-slate-400">
                      {numericSummary[stat]?.[col]?.toFixed(2) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Correlations */}
      {correlations.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Top Correlations</h3>
          <div className="space-y-2">
            {correlations.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{c.columns}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${(c.correlation * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <span className="text-cyan-400 font-mono text-xs w-10 text-right">
                    {c.correlation.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorical top values */}
      {Object.keys(categoricalSummary).length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Categorical Columns (Top Values)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoricalSummary).map(([col, vals]) => (
              <div key={col}>
                <p className="text-xs font-medium text-slate-400 mb-1.5 truncate">{col}</p>
                <div className="space-y-1">
                  {Object.entries(vals).map(([val, count]) => (
                    <div key={val} className="flex justify-between text-xs">
                      <span className="text-slate-300 truncate max-w-[140px]">{val}</span>
                      <span className="text-slate-500 ml-2">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
