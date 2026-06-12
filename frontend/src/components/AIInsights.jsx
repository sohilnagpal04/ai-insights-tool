import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, Lightbulb, BarChart2 } from 'lucide-react';

function InsightCard({ title, detail, index }) {
  const colors = [
    'border-cyan-500/30 bg-cyan-500/5',
    'border-violet-500/30 bg-violet-500/5',
    'border-emerald-500/30 bg-emerald-500/5',
  ];
  const icons = [TrendingUp, BarChart2, Lightbulb];
  const Icon = icons[index % icons.length];
  return (
    <div className={`rounded-xl border p-4 ${colors[index % colors.length]}`}>
      <div className="flex items-start gap-3">
        <Icon size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white mb-1">{title}</p>
          <p className="text-sm text-slate-400 leading-relaxed">{detail}</p>
        </div>
      </div>
    </div>
  );
}

export default function AIInsights({ session }) {
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    setRaw('');
    setParsed(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/insights/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.session_id }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const msg = JSON.parse(payload);
            if (msg.error) throw new Error(msg.error);
            if (msg.text) {
              fullText += msg.text;
              setRaw(fullText);
            }
          } catch (e) {
            if (e.message !== 'Unexpected token') throw e;
          }
        }
      }

      // Parse the completed JSON
      try {
        const jsonStart = fullText.indexOf('{');
        const jsonEnd = fullText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          setParsed(JSON.parse(fullText.slice(jsonStart, jsonEnd + 1)));
        }
      } catch {
        // leave raw visible if parse fails
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { generate(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">AI Insights</h2>
          <p className="text-slate-400 text-sm">Claude's analysis of your dataset.</p>
        </div>
        <button onClick={generate} disabled={loading} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Regenerate
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Streaming skeleton while loading and no parsed result yet */}
      {loading && !parsed && (
        <div className="card">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Sparkles size={14} className="text-cyan-400 animate-pulse" />
            Analysing your data…
          </div>
          {raw && (
            <p className="mt-3 text-slate-600 text-xs font-mono truncate">{raw.slice(-80)}</p>
          )}
        </div>
      )}

      {/* Rendered result */}
      {parsed && (
        <div className="space-y-4">
          {/* Executive summary */}
          <div className="card border-slate-700/50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Executive Summary</p>
            <p className="text-slate-300 text-sm leading-relaxed">{parsed.executive_summary}</p>
          </div>

          {/* Insights */}
          {parsed.insights?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Insights</p>
              <div className="space-y-3">
                {parsed.insights.map((ins, i) => (
                  <InsightCard key={i} title={ins.title} detail={ins.detail} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Anomalies */}
          {parsed.anomalies && (
            <div className="card border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Anomalies</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{parsed.anomalies}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendation */}
          {parsed.recommendation && (
            <div className="card border-cyan-500/20 bg-cyan-500/5">
              <div className="flex items-start gap-3">
                <Lightbulb size={15} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">Recommendation</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{parsed.recommendation}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback: show raw if JSON parse failed */}
      {!loading && !parsed && !error && raw && (
        <div className="card">
          <pre className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{raw}</pre>
        </div>
      )}
    </div>
  );
}
