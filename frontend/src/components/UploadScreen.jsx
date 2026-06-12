import React, { useState, useRef } from 'react';
import { UploadCloud, Sparkles, FileText, AlertCircle, Users, Handshake, Building2 } from 'lucide-react';

const HUBSPOT_OBJECTS = [
  { id: 'contacts',  label: 'Contacts',  icon: Users,      desc: 'Leads, lifecycle stage, emails' },
  { id: 'deals',     label: 'Deals',     icon: Handshake,  desc: 'Pipeline, amounts, close dates' },
  { id: 'companies', label: 'Companies', icon: Building2,  desc: 'Industry, revenue, employees' },
];

export default function UploadScreen({ onSessionReady }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSource, setLoadingSource] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }
    setError(null);
    setLoading(true);
    setLoadingSource('csv');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) {
        let msg = 'Upload failed';
        try { msg = (await res.json()).detail || msg; } catch {}
        throw new Error(msg);
      }
      onSessionReady(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingSource(null);
    }
  }

  async function loadSample() {
    setError(null);
    setLoading(true);
    setLoadingSource('sample');
    try {
      const res = await fetch('/api/sample');
      if (!res.ok) throw new Error('Could not load sample data');
      onSessionReady(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingSource(null);
    }
  }

  async function loadHubSpot(objectType) {
    setError(null);
    setLoading(true);
    setLoadingSource(objectType);
    try {
      const res = await fetch(`/api/hubspot/fetch/${objectType}`);
      if (!res.ok) {
        let msg = 'HubSpot fetch failed';
        try { msg = (await res.json()).detail || msg; } catch {}
        throw new Error(msg);
      }
      onSessionReady(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingSource(null);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div className="min-h-screen bg-dash-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 text-cyan-400 text-sm font-medium mb-6">
          <Sparkles size={14} />
          AI-Powered Data Analysis
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">AI Insights</h1>
        <p className="text-slate-400 text-lg max-w-md">
          Upload a CSV or connect HubSpot to get instant AI-generated insights.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`w-full max-w-lg rounded-2xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
          dragging
            ? 'border-cyan-500 bg-cyan-500/5'
            : 'border-slate-700 bg-dash-900 hover:border-slate-500'
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && inputRef.current.click()}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />
        {loadingSource === 'csv' ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span>Analysing your data…</span>
          </div>
        ) : (
          <>
            <UploadCloud size={40} className="mx-auto mb-4 text-slate-500" />
            <p className="text-slate-300 font-medium mb-1">Drop your CSV here</p>
            <p className="text-slate-500 text-sm">or click to browse</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Divider */}
      <div className="mt-8 flex items-center gap-3 text-slate-500 text-sm w-full max-w-lg">
        <span className="h-px flex-1 bg-slate-700" />
        or connect a data source
        <span className="h-px flex-1 bg-slate-700" />
      </div>

      {/* HubSpot section */}
      <div className="mt-6 w-full max-w-lg">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">H</span>
          </div>
          <span className="text-slate-300 text-sm font-medium">HubSpot CRM</span>
          <span className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">Connected</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {HUBSPOT_OBJECTS.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => !loading && loadHubSpot(id)}
              disabled={loading}
              className="bg-dash-900 border border-slate-700 hover:border-orange-500/50 hover:bg-orange-500/5 rounded-xl p-4 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSource === id ? (
                <div className="flex flex-col items-center gap-2 py-1">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-400">Fetching…</span>
                </div>
              ) : (
                <>
                  <Icon size={18} className="text-orange-400 mb-2" />
                  <p className="text-slate-200 text-sm font-medium">{label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sample data */}
      <button
        onClick={loadSample}
        disabled={loading}
        className="mt-6 flex items-center gap-2 btn-ghost"
      >
        {loadingSource === 'sample'
          ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          : <FileText size={15} />}
        Try with sample sales data
      </button>
    </div>
  );
}
