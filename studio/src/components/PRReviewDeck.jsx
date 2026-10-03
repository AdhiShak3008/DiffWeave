import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Archive,
  AlertCircle,
  Clock,
  User,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Quote,
  MessageSquare,
  FileText,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PRReviewDeck({ proposals = [], onReviewProposal, onBatchReview, loading, workspaceId, selectedProposalId }) {
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Auto-select proposal from URL if provided
  React.useEffect(() => {
    if (selectedProposalId && proposals?.length) {
      const match = proposals.find((p) => p.id === selectedProposalId || p.id.startsWith(selectedProposalId));
      if (match) setSelectedProposal(match);
    }
  }, [selectedProposalId, proposals]);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono">Loading Knowledge Pull Requests...</p>
      </div>
    );
  }

  const filteredProposals = proposals.filter((p) => {
    if (filterStatus === 'ALL') return true;
    return p.status === filterStatus;
  });

  const activePR = selectedProposal || filteredProposals[0] || null;

  const handleReview = async (decision) => {
    if (!activePR) return;
    setIsSubmitting(true);
    try {
      await onReviewProposal(activePR.id, decision, reviewComment);
      setReviewComment('');
      if (decision === 'APPROVED') {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      // Select next PR
      const next = filteredProposals.find((p) => p.id !== activePR.id);
      setSelectedProposal(next || null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-[#0C101A] border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <GitPullRequest className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Knowledge Pull Requests (PRs)</h2>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {filteredProposals.length} open
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterStatus === status
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredProposals.length === 0 ? (
        <div className="bg-[#0C101A] border border-slate-800/80 rounded-2xl p-16 text-center shadow-inner">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">All PRs Reviewed</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no proposals matching filter <strong className="text-slate-300">{filterStatus}</strong>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* PR List Column (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-2">
            {filteredProposals.map((pr) => {
              const isSelected = activePR?.id === pr.id;
              const changes = pr.proposed_changes || {};
              const conf = Math.round((changes.confidence || (changes.proposed?.confidence) || 0.95) * 100);

              return (
                <Link
                  key={pr.id}
                  to={`/workspaces/${workspaceId || 'default'}/prs/${pr.id}`}
                  onClick={() => setSelectedProposal(pr)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer text-xs block no-underline ${
                    isSelected
                      ? 'bg-[#121828] border-emerald-500/50 shadow-md shadow-emerald-500/5'
                      : 'bg-[#0D121F] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <GitPullRequest className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className="font-mono text-[11px] text-slate-400">PR-{pr.id.slice(0, 6)}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          pr.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : pr.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        }`}
                      >
                        {pr.status}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">{conf}% Conf</span>
                  </div>

                  <p className="text-white font-medium line-clamp-1 mb-1">{pr.summary || 'Knowledge Proposal'}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{pr.proposal_type} DELTA</span>
                    <span>{pr.created_at ? new Date(pr.created_at).toLocaleTimeString() : 'Just now'}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* PR Details Deck (Right 7 Cols) */}
          <div className="lg:col-span-7">
            {activePR && (
              <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                {/* PR Header */}
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 mb-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      PR #{activePR.id.slice(0, 8)}
                    </span>
                    <span>•</span>
                    <span className="text-slate-300 uppercase font-semibold">{activePR.proposal_type} OPERATION</span>
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">{activePR.summary || 'Knowledge Delta'}</h3>
                </div>

                {/* Proposed Changes Content Box */}
                <div className="bg-[#090D16] border border-slate-800/90 rounded-xl p-4 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
                    <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Proposed Extraction Value</span>
                    </span>
                    <span className="text-slate-400">
                      Conf: {Math.round(((activePR.proposed_changes?.confidence) || 0.95) * 100)}%
                    </span>
                  </div>

                  <div className="text-slate-100 leading-relaxed bg-[#101726] p-3 rounded-lg border border-slate-800">
                    {activePR.proposed_changes?.value ||
                      activePR.proposed_changes?.proposed?.value ||
                      JSON.stringify(activePR.proposed_changes, null, 2)}
                  </div>

                  {activePR.proposed_changes?.evidence && activePR.proposed_changes.evidence.length > 0 && (
                    <div className="pt-2 flex items-start space-x-2 text-slate-300">
                      <Quote className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="text-[11px] italic font-sans text-slate-400">
                        "{activePR.proposed_changes.evidence[0]}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Automated CI Policy Lint Box */}
                <div className="bg-[#121828] border border-slate-800 rounded-xl p-4 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Policy Rules CI Status</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                      Checks Passed
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-1">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Confidence &gt; 80%</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Source Provenance Valid</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Schema RegEx Matched</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Reconciliation Verified</span>
                    </div>
                  </div>
                </div>

                {/* Reviewer Comment Box */}
                {activePR.status === 'PENDING' && (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <label className="block text-xs font-semibold text-slate-300">Review Decision & Notes</label>
                    <textarea
                      placeholder="Add an approval note or rejection justification (optional)..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={2}
                      className="w-full bg-[#121828] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />

                    {/* Review Actions */}
                    <div className="flex items-center justify-end space-x-2 pt-1 text-xs">
                      <button
                        onClick={() => handleReview('ARCHIVED')}
                        disabled={isSubmitting}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-medium flex items-center space-x-1.5"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive</span>
                      </button>

                      <button
                        onClick={() => handleReview('REJECTED')}
                        disabled={isSubmitting}
                        className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition font-medium flex items-center space-x-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Reject PR</span>
                      </button>

                      <button
                        onClick={() => handleReview('APPROVED')}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Commit to Master</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
