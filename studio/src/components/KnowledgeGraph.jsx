import React, { useState } from 'react';

export default function KnowledgeGraph({ graphData, loading }) {
  const [selectedNode, setSelectedNode] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400">
        <span className="pulse-glow mr-3">⚙</span> Building knowledge graph topology...
      </div>
    );
  }

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-5 rounded-xl bg-[#0E1524] border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Knowledge Graph & Provenance Topology</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              {nodes.length} Nodes · {edges.length} Links
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual map of semantic relationships and incoming PR conflict connections across documents.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Visual Graph Canvas */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0C111E] p-6 min-h-[460px] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
            <span className="font-mono">Topology Visualizer (SVG Canvas)</span>
            <span className="text-[11px] text-slate-500">Click any node to inspect provenance</span>
          </div>

          {nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center my-auto py-20 text-slate-500 text-xs">
              <span>No knowledge entities or claims yet in this workspace.</span>
              <span className="mt-1 text-[11px] text-slate-600">Stage files to extract graph nodes.</span>
            </div>
          ) : (
            <div className="py-8 relative">
              <div className="flex flex-wrap gap-4 items-center justify-center">
                {nodes.map((n, idx) => {
                  const isSelected = selectedNode?.id === n.id;
                  const isProposal = n.type === 'PROPOSAL';
                  const isContradiction = edges.some(
                    (e) => (e.source === n.id || e.target === n.id) && e.relationship === 'CONTRADICTS'
                  );

                  let badgeColor = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300';
                  if (isProposal) badgeColor = 'border-amber-500/50 bg-amber-950/30 text-amber-200';
                  if (isContradiction) badgeColor = 'border-rose-500/60 bg-rose-950/30 text-rose-200 glow-crimson';

                  return (
                    <button
                      key={n.id || idx}
                      onClick={() => setSelectedNode(n)}
                      className={`p-3 rounded-xl border text-left transition transform hover:scale-105 shadow-md max-w-xs ${badgeColor} ${
                        isSelected ? 'ring-2 ring-cyan-400 scale-105' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/40">
                          {n.type}
                        </span>
                        <span className="text-[10px] font-mono opacity-70">
                          {(n.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-white line-clamp-1">{n.title}</h4>
                      {n.value && (
                        <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 opacity-80 font-mono">
                          "{n.value}"
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Edge list summary */}
              {edges.length > 0 && (
                <div className="mt-8 pt-4 border-t border-slate-800/80">
                  <h5 className="text-[11px] font-mono text-slate-400 mb-2">Active Semantic Links:</h5>
                  <div className="flex flex-wrap gap-2">
                    {edges.map((e, idx) => (
                      <span
                        key={idx}
                        className={`text-[10px] font-mono px-2 py-1 rounded border ${
                          e.relationship === 'CONTRADICTS'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300'
                        }`}
                      >
                        {e.relationship} ({e.confidence || 1.0})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-3">
            <span>Legend: Green = Committed Truth · Amber = Proposed PR · Red = Collision</span>
          </div>
        </div>

        {/* Selected Node Inspector */}
        <div className="rounded-xl border border-slate-800 bg-[#0F1524] p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4">
              Node Inspector
            </h3>

            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase block mb-1">
                    {selectedNode.type}
                  </span>
                  <h4 className="text-sm font-bold text-white">{selectedNode.title}</h4>
                </div>

                {selectedNode.value && (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block mb-1 font-mono">Registered Value:</span>
                    <p className="text-xs text-slate-200 font-mono">"{selectedNode.value}"</p>
                  </div>
                )}

                {selectedNode.summary && (
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1 font-mono">Summary:</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.summary}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block">Status:</span>
                    <span className="text-emerald-400 font-semibold">{selectedNode.status || 'ACTIVE'}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block">Confidence:</span>
                    <span className="text-amber-300 font-semibold">
                      {(selectedNode.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {selectedNode.filename && (
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1 font-mono">Source Document:</span>
                    <span className="text-xs text-slate-300 font-mono bg-slate-800 px-2 py-1 rounded">
                      {selectedNode.filename}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-500 text-xs">
                Select any node on the graph to inspect its properties, evidence, and provenance links.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
