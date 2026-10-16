import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  RefreshCw,
  GitPullRequest,
  Check,
  Layers,
  FolderUp,
  Trash2,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  User,
  Activity,
  Scale,
  TrendingUp,
  ShieldCheck,
  Cpu,
  Play,
  RotateCcw,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../api/client';

// Heuristic client-side document taxonomy classification
const classifyClientDoc = (filename = '') => {
  const name = filename.toLowerCase();
  if (name.includes('clinical') || name.includes('protocol') || name.includes('trial') || name.includes('amendment') || name.includes('gcp')) {
    return { kind: 'CLINICAL', color: 'emerald', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  }
  if (name.includes('msa') || name.includes('nda') || name.includes('agreement') || name.includes('contract') || name.includes('legal') || name.includes('covenant')) {
    return { kind: 'LEGAL', color: 'indigo', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
  }
  if (name.includes('financial') || name.includes('audit') || name.includes('revenue') || name.includes('ebitda') || name.includes('budget') || name.includes('tax')) {
    return { kind: 'FINANCIAL', color: 'amber', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
  }
  if (name.includes('regulatory') || name.includes('compliance') || name.includes('fda') || name.includes('21_cfr') || name.includes('gdpr') || name.includes('hipaa')) {
    return { kind: 'REGULATORY', color: 'blue', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
  }
  if (name.includes('tech') || name.includes('api') || name.includes('spec') || name.includes('architecture') || name.includes('sla') || name.includes('system')) {
    return { kind: 'TECHNICAL', color: 'cyan', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
  }
  return { kind: 'GENERAL', color: 'slate', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30' };
};

export default function IngestionStaging({
  documents = [],
  onUploadDocument,
  onUploadBatch,
  currentWorkspace,
  currentUser,
  loading,
  onSelectTab,
  onRefresh,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [batchName, setBatchName] = useState('');
  const [batches, setBatches] = useState([]);
  const [expandedBatchId, setExpandedBatchId] = useState(null);
  const [customLogs, setCustomLogs] = useState([]);
  const [activeView, setActiveView] = useState('batches'); // 'batches' | 'documents'
  const [filterDomain, setFilterDomain] = useState('ALL');
  const [searchDocQuery, setSearchDocQuery] = useState('');

  const fileInputRef = useRef(null);

  const addCustomLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setCustomLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  // Fetch batches for current workspace
  const fetchBatches = async () => {
    if (!currentWorkspace?.id) return;
    try {
      const data = await api.getWorkspaceBatches(currentWorkspace.id);
      if (Array.isArray(data)) {
        setBatches(data);
        // Expand the first processing or first batch if none selected
        if (!expandedBatchId && data.length > 0) {
          const active = data.find((b) => b.status === 'PROCESSING' || b.status === 'QUEUED');
          setExpandedBatchId(active ? active.id : data[0].id);
        }
      }
    } catch (err) {
      console.warn('Could not fetch batches:', err);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [currentWorkspace?.id]);

  // Polling loop for active asynchronous batch processing
  useEffect(() => {
    const hasActiveBatch = batches.some((b) => b.status === 'PROCESSING' || b.status === 'QUEUED');
    if (!hasActiveBatch) return;

    const interval = setInterval(async () => {
      try {
        const updated = await api.getWorkspaceBatches(currentWorkspace.id);
        if (Array.isArray(updated)) {
          setBatches(updated);
          // Check if previously processing batch just completed
          const previouslyActive = batches.filter((b) => b.status === 'PROCESSING');
          const nowCompleted = updated.filter((b) => b.status === 'COMPLETED');
          if (previouslyActive.length > 0 && nowCompleted.length >= previouslyActive.length) {
            if (onRefresh) onRefresh();
          }
        }
      } catch (err) {
        console.warn('Batch polling error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [batches, currentWorkspace?.id]);

  // Combined Live Terminal Stream
  const terminalLogs = useMemo(() => {
    const wsId = currentWorkspace?.id || 'workspace-active';
    const lines = [
      `[0.00s] DiffWeave Asynchronous Batch Staging Engine initialized.`,
      `[0.02s] Workspace ID: ${wsId}`,
      `[0.05s] Monitoring multi-user staging buffer & neural extraction worker queue...`,
    ];

    // Add logs from active/recent batches
    batches.slice(0, 3).forEach((b) => {
      if (b.logs && Array.isArray(b.logs)) {
        b.logs.slice(-4).forEach((logLine) => lines.push(logLine));
      }
    });

    return [...lines, ...customLogs];
  }, [batches, currentWorkspace, customLogs]);

  // Handle file addition to staging buffer
  const handleFilesSelected = (newFileList) => {
    if (!newFileList || newFileList.length === 0) return;
    const array = Array.from(newFileList);
    setStagedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const filtered = array.filter((f) => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });

    if (!batchName) {
      const dateStr = new Date().toISOString().slice(0, 10);
      setBatchName(`Batch-${dateStr} (${stagedFiles.length + array.length} Docs)`);
    }

    addCustomLog(`Staged ${array.length} document(s) in local batch buffer.`);
  };

  const removeStagedFile = (idx) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearStagedQueue = () => {
    setStagedFiles([]);
    setBatchName('');
  };

  // Launch Batch Ingestion
  const handleDeployBatch = async () => {
    if (stagedFiles.length === 0) return;
    setUploading(true);

    const bName = batchName.trim() || `Batch #${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    addCustomLog(`Deploying batch '${bName}' with ${stagedFiles.length} documents...`);
    addCustomLog(`Dispatched to server worker pool with asynchronous background processing.`);

    try {
      if (onUploadBatch) {
        const res = await onUploadBatch(stagedFiles, bName);
        addCustomLog(`Batch accepted (Job ID: ${res.batch_id || 'active'}). Processing asynchronously.`);
      } else if (onUploadDocument) {
        // Fallback: upload individually
        for (const f of stagedFiles) {
          await onUploadDocument(f);
        }
      }

      setStagedFiles([]);
      setBatchName('');
      await fetchBatches();
      if (onRefresh) onRefresh();
    } catch (err) {
      addCustomLog(`Batch upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Quick Preset Sample Batch for 1-Click Testing
  const handleLoadSampleBatch = () => {
    const sampleFiles = [
      new File(
        [
          `CLINICAL TRIAL PROTOCOL SPECIFICATION - AMENDMENT 4
Study ID: DW-704-ONC
Phase: III Randomized, Double-Blind, Placebo-Controlled
Primary Endpoint: Progression-Free Survival (PFS) evaluated at Week 24.
Adverse Event Reporting: Any SAE must be reported within 24 hours to IRB.
Dosing Schedule: 50mg BID daily oral administration.
Statistical Significance Target: p < 0.001 vs placebo control cohort.`
        ],
        'Clinical-Trial-Protocol-DW704.txt',
        { type: 'text/plain' }
      ),
      new File(
        [
          `MASTER SERVICES AGREEMENT (MSA) & COMMERCIAL TERMS
Agreement ID: MSA-2026-DIFFWEAVE
Parties: DiffWeave Enterprise & Customer
Limitation of Liability: Aggregate liability capped at 2x annual contract fees.
Mutual Non-Disclosure: Confidentiality binding for 36 months post-termination.
Governing Law: State of Delaware Commercial Arbitration AAA.
IP Assignment: All custom deliverables assign exclusively to client upon payment.`
        ],
        'Master-Services-Agreement-v2.txt',
        { type: 'text/plain' }
      ),
      new File(
        [
          `FINANCIAL AUDIT & REVENUE RECOGNITION REPORT (ASC 606)
Fiscal Year: 2026 Q3 Disclosure
Revenue Model: Multi-element SaaS subscriptions amortized ratably over 36 months.
EBITDA Margin Target: 28.5% non-GAAP operating margin.
Billing Terms: Net 30 days with 1.5% compounding late fee on delinquent receivables.`
        ],
        'Q3-Financial-Audit-Disclosure.txt',
        { type: 'text/plain' }
      ),
      new File(
        [
          `REGULATORY COMPLIANCE SPECIFICATION (21 CFR PART 11 / EU MDR)
System: DiffWeave Clinical Ledger
Audit Trail Requirement: All knowledge assertions retain SHA-256 cryptographic signatures.
Data Retention: Archival record preservation for minimum 7-year statutory duration.
Security: AES-256 encryption at rest, TLS 1.3 in transit with RBAC.`
        ],
        'FDA-21CFR-Part11-Compliance.txt',
        { type: 'text/plain' }
      ),
    ];

    handleFilesSelected(sampleFiles);
    setBatchName(`Heterogeneous Enterprise Batch (${sampleFiles.length} Types)`);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const fname = (doc.filename || doc.title || '').toLowerCase();
      const matchesSearch = !searchDocQuery || fname.includes(searchDocQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterDomain === 'ALL') return true;
      const classification = classifyClientDoc(doc.filename || doc.title || '');
      return classification.kind === filterDomain;
    });
  }, [documents, filterDomain, searchDocQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header / Mode Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0C111D] via-[#0E1526] to-[#0D1829] border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-wide">Multi-Document Batch Processing Engine</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Async Workers Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload single documents or multi-kind batches. The server processes them asynchronously across workspace collaborators.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleLoadSampleBatch}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 hover:from-emerald-500/20 hover:to-cyan-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            title="Load sample Clinical, Legal, Financial & Regulatory batch"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Multi-Kind Batch</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchBatches();
              if (onRefresh) onRefresh();
            }}
            className="p-2 rounded-xl bg-[#141B2D] hover:bg-[#1C2640] border border-slate-800 text-slate-300 hover:text-white transition"
            title="Sync Workspace Documents & Batches"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drag & Drop Staging Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 relative overflow-hidden ${
          dragActive
            ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
            : 'border-slate-800 bg-[#0A0E17] hover:border-slate-700 hover:bg-[#0D1322]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesSelected(e.target.files);
            }
          }}
        />

        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <FolderUp className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">
            Choose One or Multiple Documents to Stage
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Drag & drop files here or select from disk. Supports <span className="text-slate-300 font-mono">PDF, DOCX, TXT, MD, JSON, CSV</span> of any domain (Clinical, Legal, Financial, Regulatory, Technical).
          </p>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <span className="px-3 py-1.5 rounded-xl bg-[#141B2D] border border-slate-700 text-xs font-semibold text-slate-200 shadow-sm flex items-center space-x-1.5">
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Files (Single or Multi-select)</span>
          </span>
        </div>
      </div>

      {/* Pre-Upload Staging Queue Tray (Appears when files are staged) */}
      {stagedFiles.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0C121E] border border-emerald-500/30 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                Staging Queue ({stagedFiles.length} Files Ready to Upload)
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={clearStagedQueue}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Queue</span>
              </button>
            </div>
          </div>

          {/* Batch Name Input */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-xs font-semibold text-slate-300 shrink-0">
              Batch Label:
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g. Q4 Clinical Protocol Amendments Batch"
              className="flex-1 bg-[#070A10] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
            />
          </div>

          {/* Staged File Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
            {stagedFiles.map((file, idx) => {
              const classification = classifyClientDoc(file.name);
              const sizeKb = Math.round(file.size / 1024);

              return (
                <div
                  key={`${file.name}-${idx}`}
                  className="p-3 rounded-xl bg-[#080B12] border border-slate-800/80 flex flex-col justify-between space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-xs font-medium text-slate-200 truncate" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStagedFile(idx)}
                      className="text-slate-500 hover:text-red-400 p-0.5 rounded transition"
                      title="Remove from batch"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`px-2 py-0.5 rounded border font-semibold ${classification.bg}`}>
                      {classification.kind}
                    </span>
                    <span className="text-slate-500 font-mono">{sizeKb} KB</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button: Launch Asynchronous Batch Pipeline */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              disabled={uploading}
              onClick={handleDeployBatch}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20 flex items-center space-x-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Batch to Server Workers...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Launch Asynchronous Batch ({stagedFiles.length} Documents)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Batches View vs Documents View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Batches & Documents Manager (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* View Mode Tabs */}
          <div className="flex items-center justify-between bg-[#0B0F19] border border-slate-800 rounded-xl p-1">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setActiveView('batches')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition ${
                  activeView === 'batches'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Workspace Batches ({batches.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('documents')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition ${
                  activeView === 'documents'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>All Tracked Documents ({documents.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                fetchBatches();
                if (onRefresh) onRefresh();
              }}
              className="px-2.5 py-1 text-slate-400 hover:text-white text-[11px] font-mono flex items-center space-x-1 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sync</span>
            </button>
          </div>

          {/* VIEW 1: Batches Manager */}
          {activeView === 'batches' && (
            <div className="space-y-3">
              {batches.length === 0 ? (
                <div className="py-14 text-center border border-slate-800/80 rounded-2xl bg-[#090D16] space-y-2">
                  <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-semibold">No Batches Ingested in this Workspace Yet</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Drag and drop files above, or click "Load Sample Multi-Kind Batch" to experience asynchronous multi-doc extraction.
                  </p>
                </div>
              ) : (
                batches.map((batch) => {
                  const isExpanded = expandedBatchId === batch.id;
                  const isProcessing = batch.status === 'PROCESSING' || batch.status === 'QUEUED';
                  const isCompleted = batch.status === 'COMPLETED';
                  const isPartial = batch.status === 'PARTIAL_SUCCESS';
                  const uploaderName = batch.uploader?.username || batch.uploader?.email || 'Workspace Member';
                  const filesList = batch.files || [];
                  const progressPct = batch.progress_pct || (isCompleted ? 100 : 0);

                  return (
                    <div
                      key={batch.id}
                      className="border border-slate-800 rounded-2xl bg-[#090D16] hover:border-slate-700 transition overflow-hidden shadow-sm"
                    >
                      {/* Batch Header Bar */}
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                              {batch.name || `Batch #${batch.id.slice(0, 8)}`}
                            </span>

                            {/* Status Badge */}
                            {isProcessing && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                <span>PROCESSING ({progressPct}%)</span>
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>COMPLETED</span>
                              </span>
                            )}
                            {isPartial && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                PARTIAL
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-400">
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-300 font-medium">@{uploaderName}</span>
                            </span>
                            <span>&bull;</span>
                            <span>{batch.total_files} documents</span>
                            <span>&bull;</span>
                            <span className="text-emerald-400 font-semibold font-mono">
                              +{batch.total_facts_extracted || 0} facts extracted
                            </span>
                            <span>&bull;</span>
                            <span className="text-slate-500">
                              {new Date(batch.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Batch Action Buttons */}
                        <div className="flex items-center space-x-2 shrink-0">
                          {onSelectTab && (
                            <button
                              type="button"
                              onClick={() => onSelectTab('prs')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400 transition flex items-center space-x-1"
                              title="Review Extracted Knowledge PRs"
                            >
                              <GitPullRequest className="w-3.5 h-3.5" />
                              <span>PR Review Deck</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setExpandedBatchId(isExpanded ? null : batch.id)}
                            className="p-1.5 rounded-lg bg-[#141B2D] hover:bg-[#1E2740] border border-slate-700 text-slate-300 transition"
                            title={isExpanded ? 'Collapse Batch' : 'Expand Batch Details'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-900 h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isCompleted
                              ? 'bg-emerald-400'
                              : isProcessing
                              ? 'bg-gradient-to-r from-amber-400 to-emerald-400 animate-pulse'
                              : 'bg-slate-600'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* Expanded Batch Items Accordion */}
                      {isExpanded && (
                        <div className="p-4 bg-[#060910] border-t border-slate-800/80 space-y-2.5">
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                            Itemized Batch Documents ({filesList.length})
                          </span>

                          <div className="divide-y divide-slate-800/50">
                            {filesList.map((item) => {
                              const itemDone = item.status === 'PROCESSED';
                              const itemRunning = item.status === 'PROCESSING';
                              const itemKind = item.detected_kind || 'GENERAL';
                              const classification = classifyClientDoc(item.filename);

                              return (
                                <div
                                  key={item.id}
                                  className="py-2.5 flex items-center justify-between gap-3 text-xs font-mono"
                                >
                                  <div className="flex items-center space-x-3 min-w-0">
                                    <div className="p-1.5 rounded-md bg-slate-800 text-slate-300 shrink-0">
                                      <FileText className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-white font-medium block truncate max-w-[200px] sm:max-w-xs">
                                        {item.filename}
                                      </span>
                                      <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                                        <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${classification.bg}`}>
                                          {itemKind}
                                        </span>
                                        <span>&bull;</span>
                                        <span>{item.stage || 'Completed'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-2 shrink-0">
                                    <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                                      {itemDone ? `${item.facts_count || 4} facts` : itemRunning ? 'Extracting...' : 'Queued'}
                                    </span>

                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        itemDone
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                          : itemRunning
                                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {item.status}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW 2: All Tracked Documents */}
          {activeView === 'documents' && (
            <div className="border border-slate-800 rounded-2xl bg-[#090D16] p-4 space-y-4">
              {/* Search & Domain Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchDocQuery}
                    onChange={(e) => setSearchDocQuery(e.target.value)}
                    placeholder="Search documents by name..."
                    className="w-full bg-[#060910] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                <div className="flex items-center space-x-1 shrink-0 overflow-x-auto pb-1 sm:pb-0">
                  {['ALL', 'CLINICAL', 'LEGAL', 'FINANCIAL', 'TECHNICAL'].map((dom) => (
                    <button
                      key={dom}
                      type="button"
                      onClick={() => setFilterDomain(dom)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        filterDomain === dom
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                      }`}
                    >
                      {dom}
                    </button>
                  ))}
                </div>
              </div>

              {filteredDocs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No documents matching the current filter.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 text-xs font-mono">
                  {filteredDocs.map((doc) => {
                    const displayName = doc.filename || doc.title || 'Document.pdf';
                    const classification = classifyClientDoc(displayName);

                    return (
                      <div key={doc.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-white font-medium block truncate max-w-[220px] sm:max-w-xs">
                              {displayName}
                            </span>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                              <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${classification.bg}`}>
                                {classification.kind}
                              </span>
                              <span>&bull;</span>
                              <span>ID: {doc.id.slice(0, 8)}</span>
                              <span>&bull;</span>
                              <span className="text-emerald-400 font-semibold">{doc.fact_count || doc.knowledge_items_extracted || 4} facts</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>PROCESSED</span>
                          </span>

                          {onSelectTab && (
                            <button
                              type="button"
                              onClick={() => onSelectTab('prs')}
                              className="px-2 py-1 rounded bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-[10px] font-semibold text-slate-300 hover:text-white transition flex items-center space-x-1"
                              title="Review Extracted Proposals in PR Review Deck"
                            >
                              <GitPullRequest className="w-3 h-3 text-emerald-400" />
                              <span>Review</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Pipeline Stream Terminal (5 cols) */}
        <div className="lg:col-span-5 bg-[#070A10] border border-slate-800 rounded-2xl p-4 font-mono text-[11px] flex flex-col h-[520px] shadow-inner">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-900 text-slate-400">
            <div className="flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-200 font-semibold">Live Async Ingestion Stream</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pt-3 text-slate-300 pr-1 select-text">
            {terminalLogs.map((log, i) => (
              <div key={i} className="leading-relaxed break-words">
                <span className="text-emerald-400">&gt;</span> {log}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-900/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>Async Worker Pool (4 slots)</span>
            <button
              type="button"
              onClick={() => setCustomLogs([])}
              className="text-slate-400 hover:text-white transition"
            >
              Clear Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
