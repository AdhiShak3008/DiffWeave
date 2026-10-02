import React, { useState } from 'react';

export default function IngestionStaging({ documents, onUpload, loading }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadMessage('Ingesting document into DocWeave pipeline...');
    try {
      const file = files[0];
      const res = await onUpload(file);
      setUploadMessage(`Successfully staged ${file.name}! Workflow: ${res.workflow_id?.slice(0, 8)}`);
    } catch (err) {
      setUploadMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragOver
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-slate-700/80 bg-[#0E1524]/60 hover:border-slate-600'
        }`}
      >
        <div className="max-w-md mx-auto">
          <span className="text-3xl text-emerald-400 block mb-2">📄</span>
          <h3 className="text-sm font-semibold text-white">Stage Documents for Ingestion</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Drop PDFs, Word documents (.docx), or clinical texts (.txt) here to start automated extraction.
          </p>

          <label className="inline-block px-4 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg cursor-pointer transition shadow">
            <span>Browse Document File</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
            />
          </label>

          {uploadMessage && (
            <p className="text-xs text-emerald-300 mt-3 font-mono animate-fade-in">{uploadMessage}</p>
          )}
        </div>
      </div>

      {/* Real-time Ingestion Pipeline Visualizer */}
      <div className="p-5 rounded-xl bg-[#0F1524] border border-slate-800">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
          Automated Extraction & Reconciliation Pipeline
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { step: '1. Ingestion', desc: 'Text Layout & OCR' },
            { step: '2. Chunking', desc: 'Semantic Windows' },
            { step: '3. Extraction', desc: 'Atomic Fact LLM' },
            { step: '4. Reconciliation', desc: 'RRF & Collision Detect' },
            { step: '5. Rule Linter', desc: 'Policy Gate Check' },
          ].map((s, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] font-bold text-emerald-400 block">{s.step}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Document Inventory Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0F1524] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Tracked Workspace Documents</h3>
          <span className="text-xs text-slate-400 font-mono">{documents?.length || 0} files</span>
        </div>

        {documents?.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No documents uploaded to this workspace yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#121A2C] text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Filename</th>
                  <th className="px-5 py-3 font-semibold">Pipeline State</th>
                  <th className="px-5 py-3 font-semibold">Document UUID</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {documents.map((d) => {
                  const status = d.workflow_status || d.status || 'COMPLETED';
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">{status}</span>
                  );
                  if (status === 'COMPLETED') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        ✔ COMMITTED
                      </span>
                    );
                  } else if (status === 'WAITING_FOR_REVIEW') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                        ● REVIEW REQUIRED
                      </span>
                    );
                  } else if (status === 'RUNNING') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 animate-pulse">
                        ⚙ PROCESSING
                      </span>
                    );
                  }

                  return (
                    <tr key={d.document_id} className="hover:bg-slate-800/30 transition">
                      <td className="px-5 py-3 text-white font-semibold">{d.filename}</td>
                      <td className="px-5 py-3">{statusBadge}</td>
                      <td className="px-5 py-3 font-mono text-slate-500">
                        {d.document_id?.slice(0, 12)}...
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] text-slate-400 font-mono">
                          WF: {d.workflow_id?.slice(0, 8) || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
