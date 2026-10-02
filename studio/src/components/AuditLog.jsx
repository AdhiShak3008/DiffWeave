import React from 'react';

export default function AuditLog({ activityFeed, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400">
        <span className="pulse-glow mr-3">⚙</span> Loading audit timeline...
      </div>
    );
  }

  const events = activityFeed?.events || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-5 rounded-xl bg-[#0E1524] border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Knowledge Audit Log & Telemetry Timeline</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
              {events.length} Historical Records
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable provenance record tracking every document upload, rule trigger, and human review decision.
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-[#090E17]">
          <span className="text-2xl text-slate-500 block mb-2 font-mono">∅</span>
          <h3 className="text-sm font-semibold text-white">No Activity Events Recorded Yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Ingest documents or review proposals to generate audit events.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-[#0F1524] p-5">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {events.map((ev, idx) => {
              const evType = ev.type || 'event';
              let badgeStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
              if (evType.includes('approved') || evType.includes('completed')) {
                badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              } else if (evType.includes('rejected')) {
                badgeStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
              } else if (evType.includes('archived') || evType.includes('review')) {
                badgeStyle = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
              }

              return (
                <div key={ev.id || idx} className="relative group">
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-slate-900 border-2 border-slate-600 group-hover:border-emerald-400 transition"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-block w-fit ${badgeStyle}`}
                    >
                      {evType}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium mt-1">{ev.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
