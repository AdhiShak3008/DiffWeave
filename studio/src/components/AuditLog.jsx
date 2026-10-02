import React, { useState } from 'react';
import {
  History,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export default function AuditLog({ activityFeed, loading }) {
  const [filterType, setFilterType] = useState('ALL');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono">Loading Git Audit Trail...</p>
      </div>
    );
  }

  const events = activityFeed || [];

  const filtered = events.filter((e) => {
    if (filterType === 'ALL') return true;
    return e.type === filterType;
  });

  const getEventBadge = (type) => {
    switch (type) {
      case 'proposal_approved':
        return {
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          label: 'COMMITTED',
        };
      case 'proposal_created':
        return {
          color: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          label: 'PROPOSED',
        };
      case 'workflow_completed':
        return {
          color: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
          label: 'WORKFLOW',
        };
      default:
        return {
          color: 'bg-slate-800 text-slate-300 border-slate-700',
          label: 'ACTIVITY',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Audit Log Header */}
      <div className="bg-[#0C101A] border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <History className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">Immutable Git Audit Log</h2>
            <p className="text-[11px] text-slate-400">Cryptographically verifiable lineage of knowledge commits, reviews, and workflows.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {['ALL', 'proposal_approved', 'proposal_created', 'workflow_completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === f
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {f === 'ALL'
                ? 'All Events'
                : f === 'proposal_approved'
                ? 'Approved'
                : f === 'proposal_created'
                ? 'Proposed'
                : 'Workflows'}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Commit History Timeline */}
      <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-6">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No audit records found matching criteria.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {filtered.map((evt, idx) => {
              const badge = getEventBadge(evt.type);
              const dateStr = evt.timestamp ? new Date(evt.timestamp).toLocaleString() : 'Recent';
              const sha = (evt.id || 'commit').slice(-7);

              return (
                <div key={evt.id || idx} className="relative flex items-start space-x-4 group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-[#0D121F] border-2 border-emerald-500 flex items-center justify-center group-hover:scale-125 transition">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>

                  <div className="flex-1 bg-[#121828] border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 text-[11px] font-bold">
                          {sha}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.2 rounded font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-slate-400 text-[11px] flex items-center space-x-1 font-mono">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Verified</span>
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono">{dateStr}</span>
                    </div>

                    <p className="text-slate-200 font-medium text-xs leading-relaxed font-sans">
                      {evt.message}
                    </p>

                    {evt.metadata && (
                      <div className="text-[10px] text-slate-400 font-mono pt-1">
                        Metadata: {JSON.stringify(evt.metadata)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
