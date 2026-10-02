import React, { useState } from 'react';

export default function PRReviewDeck({ proposals, onReview, onBatchReview, loading }) {
  const [commentMap, setCommentMap] = useState({});
  const [actingId, setActingId] = useState(null);
  const [batchActing, setBatchActing] = useState(false);

  const handleSingle = async (proposalId, decision) => {
    setActingId(proposalId);
    try {
      const comment = commentMap[proposalId] || null;
      await onReview(proposalId, decision, comment);
    } finally {
      setActingId(null);
    }
  };

  const handleBatch = async (decision) => {
    setBatchActing(true);
    try {
      await onBatchReview(decision);
    } finally {
      setBatchActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400">
        <span className="pulse-glow mr-3">⚙</span> Loading review queue...
      </div>
    );
  }

  const pendingList = proposals || [];

  return (
    <div className="space-y-6">
      {/* Header with Batch Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0E1524] border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Knowledge Pull Requests (PRs)</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
              {pendingList.length} Awaiting Review
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Human approval gate: unreviewed proposals never enter Master Truth without explicit sign-off.
          </p>
        </div>

        {pendingList.length > 0 && (
          <div className="flex items-center space-x-3">
            <button
              disabled={batchActing}
              onClick={() => handleBatch('APPROVED')}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition shadow-lg disabled:opacity-50"
            >
              ✓ Approve & Merge All ({pendingList.length})
            </button>
            <button
              disabled={batchActing}
              onClick={() => handleBatch('REJECTED')}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition disabled:opacity-50"
            >
              ✕ Reject All
            </button>
          </div>
        )}
      </div>

      {pendingList.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-[#090E17]">
          <span className="text-3xl text-emerald-400 font-mono">[OK]</span>
          <h3 className="text-base font-semibold text-white mt-2">All Knowledge PRs Reviewed</h3>
          <p className="text-xs text-slate-400 mt-1">No items currently waiting for human governance.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingList.map((p, idx) => {
            const pc = p.proposed_changes || {};
            const evidenceList = pc.evidence || [];
            const quote = evidenceList[0]?.quote || 'No citation attached';
            const page = evidenceList[0]?.page_number || 'N/A';
            const val = pc.value || pc.proposed?.value || 'N/A';
            const conf = pc.confidence || pc.proposed?.confidence || 1.0;

            return (
              <div
                key={p.proposal_id || idx}
                className="rounded-xl border border-slate-800 bg-[#0F1423] p-5 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      PR #{p.proposal_id?.slice(0, 8)}
                    </span>
                    <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10">
                      {p.proposal_type}
                    </span>
                    <span className="text-xs text-slate-400">Confidence: {(conf * 100).toFixed(0)}%</span>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    Created: {p.created_at ? new Date(p.created_at).toLocaleTimeString() : 'Recent'}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white mb-2">{p.summary}</h3>

                {p.rationale && (
                  <p className="text-xs text-slate-400 mb-3 bg-slate-900/60 p-2.5 rounded border border-slate-800/50">
                    <strong className="text-slate-300">Reconciliation Analysis:</strong> {p.rationale}
                  </p>
                )}

                {/* Proposed value */}
                <div className="p-3 rounded-lg bg-[#141C2E] border border-slate-800 mb-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    Proposed Knowledge Value
                  </span>
                  <p className="text-sm text-slate-100 font-medium font-mono">"{val}"</p>
                </div>

                {/* Evidence citation */}
                <div className="bg-cyan-950/20 p-3 rounded-lg border border-cyan-500/20 mb-4">
                  <span className="text-[11px] text-cyan-400 font-mono block mb-1">
                    Verbatim Document Citation (Page {page}):
                  </span>
                  <blockquote className="text-xs text-cyan-200 italic">"{quote}"</blockquote>
                </div>

                {/* Reviewer Note and Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Optional reviewer note / audit message..."
                    value={commentMap[p.proposal_id] || ''}
                    onChange={(e) =>
                      setCommentMap({ ...commentMap, [p.proposal_id]: e.target.value })
                    }
                    className="w-full sm:w-80 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />

                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <button
                      disabled={actingId === p.proposal_id}
                      onClick={() => handleSingle(p.proposal_id, 'ARCHIVED')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition"
                    >
                      Stash
                    </button>
                    <button
                      disabled={actingId === p.proposal_id}
                      onClick={() => handleSingle(p.proposal_id, 'REJECTED')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition"
                    >
                      Reject
                    </button>
                    <button
                      disabled={actingId === p.proposal_id}
                      onClick={() => handleSingle(p.proposal_id, 'APPROVED')}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 transition shadow-sm"
                    >
                      ✓ Approve & Commit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
