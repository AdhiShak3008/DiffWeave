import React, { useState } from 'react';
import {
  Database,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Sparkles,
  FileText,
  Copy,
  Layers,
  GitPullRequest,
  ArrowRight,
  ShieldCheck,
  UploadCloud,
  CheckCheck,
  Info
} from 'lucide-react';

export default function KnowledgeBase({
  knowledgeItems = [],
  currentWorkspace,
  loading,
  searchQuery = '',
  onSearchChange,
  setActiveTab,
  pendingProposalsCount = 0,
  onApproveAll
}) {
  const [internalSearch, setInternalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [approving, setApproving] = useState(false);

  const search = searchQuery !== undefined && searchQuery !== '' ? searchQuery : internalSearch;
  const setSearch = onSearchChange || setInternalSearch;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono">Loading Master Knowledge Register...</p>
      </div>
    );
  }

  const activeCount = knowledgeItems.filter((i) => !i.status || i.status.toUpperCase() === 'ACTIVE').length;
  const pendingCount = knowledgeItems.filter((i) => i.status && i.status.toUpperCase() === 'PENDING').length;
  const effectivePending = pendingProposalsCount > 0 ? pendingProposalsCount : pendingCount;

  const filtered = knowledgeItems.filter((item) => {
    const itemType = String(item.type || '').toUpperCase();
    const itemStatus = String(item.status || 'ACTIVE').toUpperCase();

    const matchesCat = categoryFilter === 'ALL' || itemType === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || itemStatus === statusFilter;

    const s = search.toLowerCase().trim();
    if (!s) return matchesCat && matchesStatus;

    const titleMatch = (item.title || '').toLowerCase().includes(s);
    const valueMatch = String(item.value || '').toLowerCase().includes(s);
    const typeMatch = itemType.toLowerCase().includes(s);
    const fileMatch = (item.filename || '').toLowerCase().includes(s);
    return matchesCat && matchesStatus && (titleMatch || valueMatch || typeMatch || fileMatch);
  });

  const availableCategories = ['ALL', ...new Set(knowledgeItems.map((i) => String(i.type || '').toUpperCase()).filter(Boolean))];

  const handleCopy = (val, id) => {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(knowledgeItems, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `diffweave-knowledge-${currentWorkspace?.id || 'register'}.json`;
    a.click();
  };

  const handleBatchApprove = async () => {
    if (!onApproveAll) return;
    setApproving(true);
    try {
      await onApproveAll();
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">{activeCount}</div>
            <div className="text-[11px] text-slate-400 font-medium">Committed Facts (main)</div>
          </div>
        </div>

        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">{effectivePending}</div>
            <div className="text-[11px] text-slate-400 font-medium">Pending PRs Awaiting Merge</div>
          </div>
        </div>

        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">
              {knowledgeItems.filter((i) => (i.confidence || 0.95) >= 0.9).length}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">High Confidence (&ge;90%)</div>
          </div>
        </div>

        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">
              {new Set(knowledgeItems.map((i) => i.type)).size}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Unique Semantic Categories</div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-[#0C101A] border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Database className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Master Knowledge Register</h2>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {filtered.length} entries shown
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search facts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#141B2D] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-44"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#141B2D] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Committed (Active)</option>
            <option value="PENDING">Staged (Pending PR)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#141B2D] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Quick Merge All PRs Button (if pending proposals exist) */}
          {effectivePending > 0 && onApproveAll && (
            <button
              onClick={handleBatchApprove}
              disabled={approving}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
              title="Merge all pending proposals into master truth register"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{approving ? 'Merging...' : `Merge ${effectivePending} PRs`}</span>
            </button>
          )}

          {/* Export Button */}
          <button
            onClick={exportJSON}
            className="px-3 py-1.5 rounded-lg bg-[#141B2D] hover:bg-[#1E2740] border border-slate-700 text-slate-200 font-semibold transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Primary Content Table / Comprehensive Explainer */}
      {knowledgeItems.length === 0 ? (
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Database className="w-8 h-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Git-for-Knowledge Architecture</span>
            </div>
            <h3 className="text-lg font-bold text-white">Master Truth Register is Currently Empty</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              In DiffWeave, truth is version-controlled like source code. Unverified claims do not contaminate the Master Truth Register automatically. Instead, ingested documents create candidate <strong className="text-slate-200">Knowledge Pull Requests (Proposals)</strong> that must be reviewed and merged into <code className="text-emerald-400 font-mono">main</code>.
            </p>
          </div>

          {/* Workflow 3-Step Diagram */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl mx-auto text-left pt-2">
            <div className="bg-[#131A2B] border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
              <div className="text-[11px] font-bold text-blue-400 font-mono flex items-center space-x-1">
                <span>01.</span>
                <span>Stage Document</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Upload guidelines, trial PDFs, or clinical protocols in Ingestion Staging.
              </p>
            </div>

            <div className="bg-[#131A2B] border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
              <div className="text-[11px] font-bold text-amber-400 font-mono flex items-center space-x-1">
                <span>02.</span>
                <span>Review PR Deck</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Inspect 3-way semantic diffs, verify source provenance, and approve claims.
              </p>
            </div>

            <div className="bg-[#131A2B] border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
              <div className="text-[11px] font-bold text-emerald-400 font-mono flex items-center space-x-1">
                <span>03.</span>
                <span>Commit to Main</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Approved assertions are committed here into your cryptographically verifiable truth register.
              </p>
            </div>
          </div>

          {/* Interactive CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {effectivePending > 0 ? (
              <>
                {setActiveTab && (
                  <button
                    onClick={() => setActiveTab('prs')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center space-x-2 shadow-lg shadow-blue-500/20"
                  >
                    <GitPullRequest className="w-4 h-4" />
                    <span>Review {effectivePending} Pending Knowledge PRs</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                )}
                {onApproveAll && (
                  <button
                    onClick={handleBatchApprove}
                    disabled={approving}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>{approving ? 'Committing...' : 'One-Click Merge All into Register'}</span>
                  </button>
                )}
              </>
            ) : (
              setActiveTab && (
                <button
                  onClick={() => setActiveTab('staging')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Stage Document for Knowledge Extraction</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              )
            )}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl py-16 text-center space-y-3">
          <p className="text-xs text-slate-400">No knowledge entries found matching filter criteria.</p>
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('ALL');
              setStatusFilter('ALL');
            }}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-800/80">
            {filtered.map((item) => {
              const isPending = item.status && item.status.toUpperCase() === 'PENDING';
              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-[#121828] transition flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-white">{item.title}</span>

                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {item.type || 'CLAIM'}
                      </span>

                      {isPending ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                          <GitPullRequest className="w-3 h-3 inline mr-1" />
                          <span>STAGED PR (PENDING)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 inline mr-1" />
                          <span>COMMITTED (MAIN)</span>
                        </span>
                      )}

                      <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                        {Math.round((item.confidence || 0.95) * 100)}% Conf
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.value}</p>

                    <div className="flex items-center space-x-4 text-[11px] text-slate-500 font-mono">
                      <span>ID: {item.id ? item.id.slice(0, 8) : 'unknown'}</span>
                      {item.filename && <span>Source: {item.filename}</span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleCopy(item.value, item.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      title="Copy Value"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copiedId === item.id && (
                      <span className="text-[10px] text-emerald-400 font-mono">Copied!</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
