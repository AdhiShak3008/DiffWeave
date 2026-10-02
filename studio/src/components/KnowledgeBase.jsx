import React, { useState } from 'react';

export default function KnowledgeBase({ items, onSearch, loading }) {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const types = ['ALL', 'CLAIM', 'ENTITY', 'METRIC', 'METHOD', 'OBSERVATION'];
  const itemList = items || [];
  const filtered = selectedType === 'ALL' ? itemList : itemList.filter((i) => i.type === selectedType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0E1524] border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Master Knowledge Register</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              {itemList.length} Committed Truths
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Production-grade factual register with complete audit provenance and citation links.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full sm:w-80">
          <input
            type="text"
            placeholder="Hybrid lexical + vector search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#121A2C] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-black rounded-lg transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition ${
              selectedType === t
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs">
          <span className="pulse-glow mr-2">⚙</span> Fetching knowledge items...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-[#090E17]">
          <span className="text-2xl text-slate-500 block mb-2 font-mono">∅</span>
          <h3 className="text-sm font-semibold text-white">No Committed Items Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            Approve proposals in the Pull Requests tab or run 'dw commit' to register knowledge.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl border border-slate-800 bg-[#0F1423] hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20">
                  {item.type}
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  Confidence: {(item.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mb-2">{item.title}</h4>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 mb-3">
                <span className="text-[10px] font-mono text-slate-500 block mb-1">Committed Value:</span>
                <p className="text-xs text-slate-200 font-mono">"{item.value}"</p>
              </div>

              {item.summary && (
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{item.summary}</p>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
                <span>File: {item.filename || 'Source Doc'}</span>
                <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Active'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
