import React, { useState } from 'react';
import {
  LayoutDashboard, Sparkles, AlertTriangle, MessageSquare,
  UploadCloud, Database, FileDown, Loader2
} from 'lucide-react';

const NAV = [
  { id: 'overview',  label: 'Overview',     icon: LayoutDashboard },
  { id: 'insights',  label: 'AI Insights',  icon: Sparkles },
  { id: 'anomalies', label: 'Anomalies',    icon: AlertTriangle },
  { id: 'chat',      label: 'Chat',         icon: MessageSquare },
];

export default function Sidebar({ session, activeTab, onTabChange, onReset }) {
  const { filename, summary } = session;
  const rowCount = summary?.row_count ?? '—';
  const colCount = summary?.column_count ?? '—';
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/export/${session.session_id}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename.replace('.csv', '_insights.pdf');
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-dash-900 border-r border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Sparkles size={14} className="text-slate-950" />
          </div>
          <span className="font-bold text-white">AI Insights</span>
        </div>
      </div>

      {/* Dataset info */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-start gap-2 mb-3">
          <Database size={15} className="text-slate-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-300 truncate font-medium" title={filename}>
            {filename}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="stat-chip">{rowCount} rows</span>
          <span className="stat-chip">{colCount} cols</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`sidebar-link w-full ${activeTab === id ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* Export + New Upload */}
      <div className="px-3 pb-5 space-y-1">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="sidebar-link w-full"
        >
          {exporting
            ? <Loader2 size={16} className="animate-spin" />
            : <FileDown size={16} />}
          {exporting ? 'Generating PDF…' : 'Export PDF Report'}
        </button>
        <button onClick={onReset} className="sidebar-link w-full">
          <UploadCloud size={16} />
          New Upload
        </button>
      </div>
    </aside>
  );
}
