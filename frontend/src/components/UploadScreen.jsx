import React, { useState, useRef } from 'react';
import { UploadCloud, Sparkles, FileText, AlertCircle } from 'lucide-react';

export default function UploadScreen({ onSessionReady }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }
      onSessionReady(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSample() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/sample');
      if (!res.ok) throw new Error('Could not load sample data');
      onSessionReady(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div className="min-h-screen bg-dash-950 flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 text-cyan-400 text-sm font-medium mb-6">
          <Sparkles size={14} />
          AI-Powered Data Analysis
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">AI Insights</h1>
        <p className="text-slate-400 text-lg max-w-md">
          Upload a CSV file and get instant AI-generated insights, charts, and anomaly detection.
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
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />
        {loading ? (
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

      <div className="mt-6 flex items-center gap-3 text-slate-500 text-sm">
        <span className="h-px w-16 bg-slate-700" />
        or
        <span className="h-px w-16 bg-slate-700" />
      </div>

      <button
        onClick={loadSample}
        disabled={loading}
        className="mt-6 flex items-center gap-2 btn-ghost"
      >
        <FileText size={15} />
        Try with sample sales data
      </button>
    </div>
  );
}
