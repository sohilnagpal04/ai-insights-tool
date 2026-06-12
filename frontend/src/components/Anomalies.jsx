import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function Anomalies({ session }) {
  const { summary } = session;
  const count = summary.anomaly_count ?? 0;
  const samples = summary.anomaly_sample ?? [];

  if (count === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Anomaly Detection</h2>
          <p className="text-slate-400 text-sm">Outlier rows detected via Isolation Forest (5% contamination).</p>
        </div>
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle size={40} className="text-emerald-400 mb-3" />
          <p className="text-white font-medium">No anomalies detected</p>
          <p className="text-slate-400 text-sm mt-1">Your dataset looks clean.</p>
        </div>
      </div>
    );
  }

  const columns = samples.length > 0 ? Object.keys(samples[0]) : [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Anomaly Detection</h2>
        <p className="text-slate-400 text-sm">Outlier rows detected via Isolation Forest (5% contamination).</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2">
          <AlertTriangle size={16} className="text-amber-400" />
          <span className="text-amber-300 font-semibold">{count}</span>
          <span className="text-amber-400/70 text-sm">anomalous rows found</span>
        </div>
        <span className="text-slate-500 text-sm">(showing first 5)</span>
      </div>

      {samples.length > 0 && (
        <div className="card overflow-x-auto">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Sample Anomalous Rows</h3>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-700">
                {columns.map(col => (
                  <th key={col} className="pb-2 pr-4 text-slate-400 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {samples.map((row, i) => (
                <tr key={i} className="border-b border-slate-800 last:border-0">
                  {columns.map(col => (
                    <td key={col} className="py-2 pr-4 text-slate-300 whitespace-nowrap">
                      {row[col] == null ? <span className="text-slate-600">—</span> : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
