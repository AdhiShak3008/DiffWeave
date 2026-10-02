import React, { useState } from 'react';

export default function SemanticDiffViewer({ diff, onReview, loading }) {
  const [filter, setFilter] = useState('all'); // all, conflicts, additions, changes
  const [actingId, setActingId] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400">
        <span className="pulse-glow mr-3">⚙</span> Generating semantic knowledge diff...
      </div>
    );
  }

  const summary = diff?.summary || {};
  const conflicts = diff?.conflicts || [];
  const additions = diff?.additions || [];
  const changes = diff?.changes || [];
  const removals = diff?.removals || [];

  const handleAction = async (proposalId, decision) => {
    setActingId(proposalId);
    try {
      await onReview(proposalId, decision);
    } finally {
      setActingId(null);
    }
  };

  const totalDiffs = (conflicts.length + additions.length + changes.length + removals.length);

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#0E1524] border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Knowledge Semantic Diff</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {totalDiffs} changes detected
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Compares newly extracted document facts against committed production truths with verbatim evidence provenance.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            All ({totalDiffs})
          </button>
          <button
            onClick={() => setFilter('conflicts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1 ${
              filter === 'conflicts' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>Conflicts ({conflicts.length})</span>
          </button>
          <button
            onClick={() => setFilter('additions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1 ${
              filter === 'additions' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Additions ({additions.length})</span>
          </button>
          <button
            onClick={() => setFilter('changes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1 ${
              filter === 'changes' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Updates ({changes.length})</span>
          </button>
        </div>
      </div>

      {totalDiffs === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-[#090E17]">
          <span className="text-3xl text-emerald-400">✔</span>
          <h3 className="text-base font-semibold text-white mt-2">Workspace Knowledge is in Sync</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No uncommitted or conflicting knowledge items found. Upload documents via the Staging tab or dw add.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Conflicts (Red / Contradiction) */}
          {(filter === 'all' || filter === 'conflicts') &&
            conflicts.map((c, idx) => {
              const evidenceList = c.proposed?.evidence || [];
              const quote = evidenceList[0]?.quote || 'No verbatim citation';
              const page = evidenceList[0]?.page_number || 'N/A';

              return (
                <div key={c.proposal_id || idx} className="rounded-xl border border-rose-500/30 bg-[#0F1422] p-5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        ! CONTRADICTION COLLISION
                      </span>
                      <span className="text-xs text-slate-400 font-mono">PR: {c.proposal_id?.slice(0, 8)}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        disabled={actingId === c.proposal_id}
                        onClick={() => handleAction(c.proposal_id, 'APPROVED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition disabled:opacity-50"
                      >
                        ✓ Accept & Merge
                      </button>
                      <button
                        disabled={actingId === c.proposal_id}
                        onClick={() => handleAction(c.proposal_id, 'REJECTED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition disabled:opacity-50"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-3">{c.title}</h3>

                  {/* 3-Way Split Diff */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Baseline truth */}
                    <div className="rounded-lg bg-rose-950/20 border border-rose-500/20 p-4">
                      <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider block mb-1">
                        ◀ Baseline Truth (Committed)
                      </span>
                      <p className="text-sm text-slate-200 font-medium">"{c.existing?.value || 'N/A'}"</p>
                      <span className="text-[11px] text-slate-400 mt-2 block font-mono">
                        Confidence: {c.existing?.confidence || 1.0}
                      </span>
                    </div>

                    {/* Proposed incoming */}
                    <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/20 p-4">
                      <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                        ▶ Proposed Change (From Incoming Document)
                      </span>
                      <p className="text-sm text-slate-100 font-medium">"{c.proposed?.value}"</p>
                      <div className="mt-3 pt-2 border-t border-emerald-500/10">
                        <span className="text-[11px] text-slate-400 block font-mono mb-1">
                          Verbatim Evidence (Page {page}):
                        </span>
                        <blockquote className="text-xs text-cyan-300 italic bg-cyan-950/20 p-2 rounded border-l-2 border-cyan-500">
                          "{quote}"
                        </blockquote>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Additions (Green) */}
          {(filter === 'all' || filter === 'additions') &&
            additions.map((a, idx) => {
              const evidenceList = a.evidence || [];
              const quote = evidenceList[0]?.quote || 'No verbatim citation';
              const page = evidenceList[0]?.page_number || 'N/A';

              return (
                <div key={a.proposal_id || idx} className="rounded-xl border border-emerald-500/30 bg-[#0F1422] p-5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        + NEW {a.type || 'CLAIM'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">PR: {a.proposal_id?.slice(0, 8)}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        disabled={actingId === a.proposal_id}
                        onClick={() => handleAction(a.proposal_id, 'APPROVED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition disabled:opacity-50"
                      >
                        ✓ Commit Fact
                      </button>
                      <button
                        disabled={actingId === a.proposal_id}
                        onClick={() => handleAction(a.proposal_id, 'REJECTED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition disabled:opacity-50"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-2">{a.title}</h3>
                  <div className="rounded-lg bg-emerald-950/15 border border-emerald-500/15 p-4 mb-3">
                    <span className="text-[11px] font-mono text-emerald-400 block mb-1">Extracted Value:</span>
                    <p className="text-sm text-slate-100 font-medium">"{a.proposed_value}"</p>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-mono mb-1">
                      Verbatim Document Evidence (Page {page}):
                    </span>
                    <blockquote className="text-xs text-cyan-300 italic">"{quote}"</blockquote>
                  </div>
                </div>
              );
            })}

          {/* Changes / Updates (Amber) */}
          {(filter === 'all' || filter === 'changes') &&
            changes.map((ch, idx) => (
              <div key={ch.proposal_id || idx} className="rounded-xl border border-amber-500/30 bg-[#0F1422] p-5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      ~ MODIFIED CLAIM
                    </span>
                    <span className="text-xs text-slate-400 font-mono">PR: {ch.proposal_id?.slice(0, 8)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      disabled={actingId === ch.proposal_id}
                      onClick={() => handleAction(ch.proposal_id, 'APPROVED')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition disabled:opacity-50"
                    >
                      ✓ Merge Update
                    </button>
                    <button
                      disabled={actingId === ch.proposal_id}
                      onClick={() => handleAction(ch.proposal_id, 'REJECTED')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition disabled:opacity-50"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white mb-2">{ch.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">Existing:</span>
                    <p className="text-xs text-slate-300 mt-1 font-medium">{ch.existing?.value || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded bg-amber-950/20 border border-amber-500/20">
                    <span className="text-[10px] text-amber-400 block font-mono">Proposed Update:</span>
                    <p className="text-xs text-amber-200 mt-1 font-medium">{ch.proposed?.value || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
