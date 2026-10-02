import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Terminal,
  FileCode,
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function IngestionStaging({ documents, onUploadDocument, currentWorkspace, loading }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([
    '[0.00s] DiffWeave Staging ready. Bound to DocWeave FastMCP engine.',
    '[0.02s] Workspace ID: ' + (currentWorkspace?.id || '4314fb04-95be-41a2-bef4-50bf27c9c363'),
    '[0.05s] Monitoring document staging buffer...',
  ]);
  const fileInputRef = useRef(null);

  const addLog = (msg) => {
    setTerminalLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    addLog(`Ingesting file: ${file.name} (${Math.round(file.size / 1024)} KB)...`);
    addLog(`Running LangGraph neural extraction pipeline...`);

    try {
      await onUploadDocument(file);
      addLog(`DocWeave workflow completed for ${file.name}`);
      addLog(`3-Way semantic fact proposals generated successfully.`);
    } catch (err) {
      addLog(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
          dragActive
            ? 'border-emerald-400 bg-emerald-500/10'
            : 'border-slate-800 bg-[#0C101A] hover:border-slate-700 hover:bg-[#0E1422]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Upload className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Stage Document for Knowledge Extraction</h3>
          <p className="text-xs text-slate-400 mt-1">
            Drag & drop clinical protocols, amendments, or regulatory specs (TXT, PDF, DOCX)
          </p>
        </div>

        <button
          type="button"
          disabled={uploading}
          className="px-4 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1E2740] border border-slate-700 text-xs font-semibold text-slate-200 transition shadow-sm"
        >
          {uploading ? 'Processing Extraction...' : 'Select File from Disk'}
        </button>
      </div>

      {/* Grid: Staged Documents Table & Live Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Staged Documents List (7 cols) */}
        <div className="lg:col-span-7 bg-[#0D121F] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Tracked Staged Documents ({documents.length})</span>
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No documents staged yet in this workspace. Upload a file above to begin.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 text-xs font-mono">
              {documents.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-white font-medium block">{doc.filename}</span>
                      <span className="text-slate-500 text-[10px]">ID: {doc.id.slice(0, 8)}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {doc.status || 'COMMITTED'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Pipeline Terminal (5 cols) */}
        <div className="lg:col-span-5 bg-[#080B11] border border-slate-800 rounded-2xl p-4 font-mono text-[11px] flex flex-col h-[380px] shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-slate-900 text-slate-400">
            <div className="flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-200 font-semibold">Live Ingestion Stream</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pt-3 text-slate-300 pr-1">
            {terminalLogs.map((log, i) => (
              <div key={i} className="leading-relaxed">
                <span className="text-emerald-400">&gt;</span> {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
