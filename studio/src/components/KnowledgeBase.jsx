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
  Layers
} from 'lucide-react';

export default function KnowledgeBase({ knowledgeItems = [], currentWorkspace, loading, searchQuery = '', onSearchChange }) {
  const [internalSearch, setInternalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

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

  const filtered = knowledgeItems.filter((item) => {
    const itemType = String(item.type || '').toUpperCase();
    const matchesCat = categoryFilter === 'ALL' || itemType === categoryFilter;
    const s = search.toLowerCase().trim();
    if (!s) return matchesCat;
    const titleMatch = (item.title || '').toLowerCase().includes(s);
    const valueMatch = String(item.value || '').toLowerCase().includes(s);
    const typeMatch = itemType.toLowerCase().includes(s);
    const fileMatch = (item.filename || '').toLowerCase().includes(s);
    return matchesCat && (titleMatch || valueMatch || typeMatch || fileMatch);
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

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">{knowledgeItems.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Committed Facts in Register</div>
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
            {filtered.length} entries
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search facts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#141B2D] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
            />
          </div>

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

          {/* Export Button */}
          <button
            onClick={exportJSON}
            className="px-3 py-1.5 rounded-lg bg-[#141B2D] hover:bg-[#1E2740] border border-slate-700 text-slate-200 font-semibold transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Facts Table */}
      <div className="bg-[#0D121F] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No knowledge entries found matching filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filtered.map((item) => (
              <div key={item.id} className="p-4 hover:bg-[#121828] transition flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-semibold text-white">{item.title}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {item.type || 'CLAIM'}
                    </span>
                    <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                      {Math.round((item.confidence || 0.95) * 100)}% Conf
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.value}</p>

                  <div className="text-[11px] text-slate-500 font-mono">
                    ID: {item.id.slice(0, 8)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
