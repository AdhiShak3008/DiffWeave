import React, { useState } from 'react';
import {
  FileDiff,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Archive,
  Layers,
  Sparkles,
  Quote,
  Eye,
  Columns,
  AlignLeft,
  ChevronRight,
  MessageSquare,
  Send,
  SlidersHorizontal,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SemanticDiffViewer({ diffData, onReviewProposal, onBatchReview, loading }) {
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'unified'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'conflicts' | 'additions' | 'changes'
  const [comments, setComments] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [reviewedLocal, setReviewedLocal] = useState({});
  const [lastActionToast, setLastActionToast] = useState(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono">Running semantic fact diff against Master Knowledge Register...</p>
      </div>
    );
  }

  const rawAdditions = diffData?.additions || [];
  const rawChanges = diffData?.changes || [];
  const rawConflicts = diffData?.conflicts || [];
  const rawRemovals = diffData?.removals || [];

  // Filter out any delta that was just approved or rejected in local state
  const additions = rawAdditions.filter((a) => !reviewedLocal[a.proposal_id] && !reviewedLocal[a.id]);
  const changes = rawChanges.filter((c) => !reviewedLocal[c.proposal_id] && !reviewedLocal[c.id]);
  const conflicts = rawConflicts.filter((c) => !reviewedLocal[c.proposal_id] && !reviewedLocal[c.id]);
  const removals = rawRemovals.filter((r) => !reviewedLocal[r.proposal_id] && !reviewedLocal[r.id]);

  const totalDeltas = additions.length + changes.length + conflicts.length + removals.length;

  const handleAction = async (proposalId, decision) => {
    const allDeltas = [...rawConflicts, ...rawAdditions, ...rawChanges, ...rawRemovals];
    const found = allDeltas.find((d) => (d.proposal_id === proposalId || d.id === proposalId));
    const title = found?.title || found?.proposed_value || found?.summary || `Delta #${proposalId.slice(0, 8)}`;

    // Instant local removal & feedback banner
    setReviewedLocal((prev) => ({
      ...prev,
      [proposalId]: { decision, title, time: new Date().toLocaleTimeString() }
    }));

    setLastActionToast({
      proposalId,
      decision,
      title,
      time: new Date().toLocaleTimeString()
    });

    setActionLoading((prev) => ({ ...prev, [proposalId]: true }));
    try {
      if (decision === 'APPROVED') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10B981', '#14B8A6', '#3B82F6'],
        });
      }
      await onReviewProposal(proposalId, decision, comments[proposalId] || '');
    } catch (err) {
      console.error('Error applying diff review:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [proposalId]: false }));
    }
  };

  const handleBatch = async (decision) => {
    const allIds = [...rawConflicts, ...rawAdditions, ...rawChanges, ...rawRemovals].map((d) => d.proposal_id || d.id);
    const batchMap = {};
    allIds.forEach((id) => {
      batchMap[id] = { decision, title: 'Batch Knowledge Item' };
    });
    setReviewedLocal((prev) => ({ ...prev, ...batchMap }));

    setLastActionToast({
      decision,
      title: `Batch of ${allIds.length} semantic fact deltas`,
      time: new Date().toLocaleTimeString()
    });

    if (decision === 'APPROVED') {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.7 },
      });
    }
    await onBatchReview(decision);
  };

  return (
    <div className="space-y-6">
      {/* Diff Toolbar & Delta Summary */}
      <div className="bg-[#0C101A] border border-slate-800/90 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FileDiff className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-white text-sm">3-Way Semantic Fact Diff</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-medium">
              {totalDeltas} pending {totalDeltas === 1 ? 'delta' : 'deltas'}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs font-mono">
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              +{additions.length} added
            </span>
            <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              ~{changes.length} updated
            </span>
            {conflicts.length > 0 && (
              <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>!{conflicts.length} conflicts</span>
              </span>
            )}
          </div>
        </div>

        {/* View Controls & Filters */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Filter Pills */}
          <div className="flex items-center bg-[#141B2D] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                filterType === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({totalDeltas})
            </button>
            <button
              onClick={() => setFilterType('conflicts')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center space-x-1 ${
                filterType === 'conflicts' ? 'bg-rose-900/60 text-rose-300' : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              <span>Conflicts</span>
              {conflicts.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              )}
            </button>
            <button
              onClick={() => setFilterType('additions')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                filterType === 'additions' ? 'bg-emerald-950/60 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Additions
            </button>
          </div>

          {/* Split / Unified Toggle */}
          <div className="flex items-center bg-[#141B2D] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded transition ${viewMode === 'split' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Split View (Side by Side)"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`p-1.5 rounded transition ${viewMode === 'unified' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Unified View"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bulk Approve Button */}
          {totalDeltas > 0 && (
            <button
              onClick={() => handleBatch('APPROVED')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm shadow-emerald-600/20 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve All</span>
            </button>
          )}
        </div>
      </div>

      {/* Reactive Recent Action Toast Banner */}
      {lastActionToast && (
        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 shadow-md ${
          lastActionToast.decision === 'APPROVED'
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
            : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
        }`}>
          <div className="flex items-center space-x-3">
            <span className={`p-2 rounded-lg ${lastActionToast.decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {lastActionToast.decision === 'APPROVED' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </span>
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold">
                <span>
                  {lastActionToast.decision === 'APPROVED' ? '✓ Approved & Merged to Master Truth Register' : '✕ Rejected & Dismissed'}:
                </span>
                {lastActionToast.proposalId && (
                  <span className="font-mono text-[11px] opacity-80">ID: {lastActionToast.proposalId.slice(0, 8)}</span>
                )}
                <span className="text-[10px] text-slate-400 font-normal">at {lastActionToast.time}</span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1 mt-0.5 font-sans">
                "{lastActionToast.title}"
              </p>
            </div>
          </div>

          <button
            onClick={() => setLastActionToast(null)}
            className="text-slate-400 hover:text-white text-lg px-2"
            title="Dismiss"
          >
            &times;
          </button>
        </div>
      )}

      {totalDeltas === 0 ? (
        <div className="bg-[#0C101A] border border-slate-800/80 rounded-2xl p-16 text-center shadow-inner">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Knowledge Register is Up to Date</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            No pending knowledge proposals or conflicts found. Stage a new document or protocol version to generate 3-way fact diffs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Conflicts Section */}
          {(filterType === 'all' || filterType === 'conflicts') && conflicts.map((c) => (
            <div
              key={c.proposal_id}
              className="bg-[#0D121F] border border-rose-500/40 rounded-xl overflow-hidden shadow-lg shadow-rose-950/20 transition hover:border-rose-500/70"
            >
              {/* Card Header */}
              <div className="bg-rose-950/25 px-4 py-2.5 border-b border-rose-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="p-1 rounded bg-rose-500/20 text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-white tracking-wide">{c.title || 'Fact Conflict'}</span>
                    <span className="ml-2 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Conflict
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">ID: {c.proposal_id.slice(0, 8)}</span>
                </div>
              </div>

              {/* Conflict Body */}
              <div className="p-4 space-y-4">
                {c.rationale && (
                  <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed font-sans">
                    <strong className="text-rose-400">Reconciliation Note: </strong>
                    {c.rationale}
                  </p>
                )}

                {/* Side by Side Diff Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  {/* Baseline / Existing */}
                  <div className="bg-[#13111C] border border-slate-800 rounded-lg p-3">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-2 pb-1 border-b border-slate-800/80">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <span>- Master Truth (Existing Fact)</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Conf: {Math.round((c.existing?.confidence || 0.9) * 100)}%</span>
                    </div>
                    <div className="text-rose-200 bg-rose-950/20 p-2 rounded border border-rose-900/30 leading-relaxed break-words">
                      {c.existing?.value || 'N/A'}
                    </div>
                  </div>

                  {/* Proposed / Amendment */}
                  <div className="bg-[#0C1518] border border-emerald-900/40 rounded-lg p-3">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-2 pb-1 border-b border-slate-800/80">
                      <span className="text-emerald-400 flex items-center space-x-1 font-semibold">
                        <span>+ Proposed Fact (Extracted Amendment)</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">Conf: {Math.round((c.proposed?.confidence || 0.95) * 100)}%</span>
                    </div>
                    <div className="text-emerald-200 bg-emerald-950/25 p-2 rounded border border-emerald-800/30 leading-relaxed break-words font-medium">
                      {c.proposed?.value || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Evidence Provenance */}
                {c.proposed?.evidence && c.proposed.evidence.length > 0 && (
                  <div className="text-xs bg-[#101524] p-2.5 rounded-lg border border-slate-800 text-slate-300 flex items-start space-x-2">
                    <Quote className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">Source Provenance Citation</span>
                      <span className="text-slate-300 italic">{c.proposed.evidence[0]}</span>
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => setExpandedComments((p) => ({ ...p, [c.proposal_id]: !p[c.proposal_id] }))}
                    className="text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{comments[c.proposal_id] ? 'Edit Reviewer Note' : 'Add Note'}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAction(c.proposal_id, 'REJECTED')}
                      disabled={actionLoading[c.proposal_id]}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1 font-medium"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Reject Amendment</span>
                    </button>
                    <button
                      onClick={() => handleAction(c.proposal_id, 'APPROVED')}
                      disabled={actionLoading[c.proposal_id]}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1 font-semibold shadow-sm shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept & Resolve Conflict</span>
                    </button>
                  </div>
                </div>

                {/* Reviewer Note Drawer */}
                {expandedComments[c.proposal_id] && (
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Attach reviewer comment or clinical justification..."
                      value={comments[c.proposal_id] || ''}
                      onChange={(e) => setComments({ ...comments, [c.proposal_id]: e.target.value })}
                      className="w-full bg-[#161F32] border border-slate-700 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Additions Section */}
          {(filterType === 'all' || filterType === 'additions') && additions.map((a) => (
            <div
              key={a.proposal_id}
              className="bg-[#0D121F] border border-slate-800 rounded-xl overflow-hidden shadow-sm transition hover:border-emerald-500/40"
            >
              {/* Card Header */}
              <div className="bg-[#121828] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-white tracking-wide">{a.title || 'New Knowledge Delta'}</span>
                    <span className="ml-2 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      +{a.type || 'CLAIM'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                    {Math.round((a.confidence || 0.95) * 100)}% Confidence
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="bg-[#0C1518] border border-emerald-900/30 rounded-lg p-3">
                  <div className="text-xs text-emerald-200 leading-relaxed font-mono">
                    {a.proposed_value || a.summary || 'Extracted content'}
                  </div>
                </div>

                {a.evidence && a.evidence.length > 0 && (
                  <div className="text-xs bg-[#101524] p-2.5 rounded-lg border border-slate-800 text-slate-300 flex items-start space-x-2">
                    <Quote className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">Document Citation</span>
                      <span className="text-slate-300 italic">{a.evidence[0]}</span>
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => handleAction(a.proposal_id, 'REJECTED')}
                    disabled={actionLoading[a.proposal_id]}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-medium"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(a.proposal_id, 'APPROVED')}
                    disabled={actionLoading[a.proposal_id]}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition font-semibold flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Fact</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Changes / Updates Section */}
          {(filterType === 'all' || filterType === 'changes') && changes.map((ch) => (
            <div
              key={ch.proposal_id}
              className="bg-[#0D121F] border border-slate-800 rounded-xl overflow-hidden shadow-sm transition hover:border-blue-500/40"
            >
              <div className="bg-[#121828] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="p-1 rounded bg-blue-500/20 text-blue-400">
                    <FileDiff className="w-4 h-4 text-blue-400" />
                  </span>
                  <span className="text-xs font-semibold text-white">{ch.title || 'Knowledge Update'}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    UPDATE
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-[#141824] border border-slate-800 p-2.5 rounded text-slate-400">
                    <div className="text-[10px] text-slate-500 mb-1">- Previous Value</div>
                    <div>{ch.existing?.value || 'N/A'}</div>
                  </div>
                  <div className="bg-[#0C1518] border border-emerald-900/30 p-2.5 rounded text-emerald-300">
                    <div className="text-[10px] text-emerald-400 mb-1">+ Updated Value</div>
                    <div>{ch.proposed?.value || 'N/A'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => handleAction(ch.proposal_id, 'APPROVED')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                  >
                    Approve Update
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
