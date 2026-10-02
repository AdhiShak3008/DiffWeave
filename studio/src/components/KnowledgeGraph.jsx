import React, { useState, useMemo } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Link2,
  FileText,
  Info
} from 'lucide-react';

export default function KnowledgeGraph({ graphData, loading }) {
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  const rawNodes = graphData?.nodes || [];
  const rawEdges = graphData?.edges || [];

  // Filter nodes based on type and search query
  const filteredNodes = useMemo(() => {
    return rawNodes.filter((n) => {
      const matchesType = filterType === 'ALL' || n.type === filterType;
      const matchesSearch =
        !searchQuery ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(n.value || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [rawNodes, filterType, searchQuery]);

  // Generate deterministic circular / force layout coordinates
  const positionedNodes = useMemo(() => {
    const total = filteredNodes.length;
    if (total === 0) return [];

    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(centerX, centerY) - 80;

    return filteredNodes.map((node, i) => {
      // Golden angle distribution for natural cluster spread
      const angle = (i * 2.399963) % (2 * Math.PI);
      const r = 40 + (radius - 40) * Math.sqrt((i + 1) / total);
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      return { ...node, x, y };
    });
  }, [filteredNodes]);

  const nodeMap = useMemo(() => {
    const map = {};
    positionedNodes.forEach((n) => {
      map[n.id] = n;
    });
    return map;
  }, [positionedNodes]);

  const getNodeColor = (type) => {
    switch (type) {
      case 'ENTITY':
        return '#06B6D4'; // Cyan
      case 'CLAIM':
        return '#8B5CF6'; // Violet
      case 'METRIC':
        return '#10B981'; // Emerald
      case 'DATE':
        return '#F59E0B'; // Amber
      case 'PROPOSAL':
        return '#EC4899'; // Pink
      default:
        return '#3B82F6'; // Blue
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono">Building Knowledge Topology Graph...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Graph Control Bar */}
      <div className="bg-[#0C101A] border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Network className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Knowledge Graph Topology</h2>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {positionedNodes.length} nodes • {rawEdges.length} edges
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Node Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search graph..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#141B2D] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#141B2D] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="CLAIM">Claims</option>
            <option value="METRIC">Metrics</option>
            <option value="ENTITY">Entities</option>
            <option value="PROPOSAL">Pending PRs</option>
          </select>

          {/* Zoom Controls */}
          <div className="flex items-center bg-[#141B2D] border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.15, 2.0))}
              className="p-1.5 hover:text-white text-slate-400 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
              className="p-1.5 hover:text-white text-slate-400 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 hover:text-white text-slate-400 transition"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas & Detail Drawer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Canvas (8 Cols) */}
        <div className="lg:col-span-8 bg-[#090D16] border border-slate-800/80 rounded-2xl p-4 overflow-hidden relative min-h-[560px] flex items-center justify-center">
          {/* Interactive SVG */}
          <svg
            viewBox="0 0 800 600"
            className="w-full h-full transition-transform duration-200 cursor-grab active:cursor-grabbing"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="graphGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#161F32" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#graphGrid)" />

            {/* Edges */}
            {rawEdges.map((edge, idx) => {
              const src = nodeMap[edge.source];
              const tgt = nodeMap[edge.target];
              if (!src || !tgt) return null;

              const isHighlighted = selectedNode && (selectedNode.id === src.id || selectedNode.id === tgt.id);

              return (
                <g key={edge.id || idx}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isHighlighted ? '#10B981' : '#334155'}
                    strokeWidth={isHighlighted ? 2.5 : 1.2}
                    strokeDasharray={edge.relationship === 'PROPOSED_UPDATE' ? '4 3' : 'none'}
                    opacity={isHighlighted ? 0.9 : 0.4}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {positionedNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const color = getNodeColor(node.type);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer group"
                >
                  {/* Glow circle on select */}
                  {isSelected && (
                    <circle r="22" fill="none" stroke={color} strokeWidth="2.5" opacity="0.8" className="animate-pulse" />
                  )}

                  {/* Node Circle */}
                  <circle
                    r={node.type === 'PROPOSAL' ? 14 : 12}
                    fill="#0D121F"
                    stroke={color}
                    strokeWidth={isSelected ? 3 : 2}
                    strokeDasharray={node.type === 'PROPOSAL' ? '3 2' : 'none'}
                    className="transition hover:scale-125"
                  />

                  {/* Inner Type Indicator Dot */}
                  <circle r="4" fill={color} />

                  {/* Node Label Text */}
                  <text
                    y="24"
                    textAnchor="middle"
                    fill={isSelected ? '#F8FAFC' : '#94A3B8'}
                    fontSize="9.5"
                    fontFamily="Inter, sans-serif"
                    fontWeight={isSelected ? '600' : '400'}
                    className="select-none pointer-events-none"
                  >
                    {node.title.length > 22 ? node.title.slice(0, 20) + '...' : node.title}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Color Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-[#0E1422]/90 backdrop-blur-sm border border-slate-800 rounded-xl p-3 text-[11px] font-mono flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span className="text-slate-300">Entity</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400"></span>
              <span className="text-slate-300">Claim</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300">Metric</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-400 border border-dashed border-pink-300"></span>
              <span className="text-slate-300">PR Delta</span>
            </span>
          </div>
        </div>

        {/* Selected Node Details Drawer (4 Cols) */}
        <div className="lg:col-span-4 bg-[#0D121F] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 text-xs text-slate-400">
            <Info className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">Node Provenance Inspector</span>
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Identifier</span>
                <span className="text-slate-300 font-semibold">{selectedNode.id}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Classification Type</span>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-bold"
                  style={{
                    backgroundColor: `${getNodeColor(selectedNode.type)}20`,
                    color: getNodeColor(selectedNode.type),
                    border: `1px solid ${getNodeColor(selectedNode.type)}40`,
                  }}
                >
                  {selectedNode.type}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Fact Statement</span>
                <div className="bg-[#141B2D] p-3 rounded-lg border border-slate-800 text-slate-200 leading-relaxed font-sans text-xs">
                  {selectedNode.value || selectedNode.title}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-[#141B2D] p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Confidence</span>
                  <span className="text-emerald-400 font-bold">
                    {Math.round((selectedNode.confidence || 0.95) * 100)}%
                  </span>
                </div>
                <div className="bg-[#141B2D] p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">State</span>
                  <span className="text-slate-300 font-semibold">{selectedNode.status || 'ACTIVE'}</span>
                </div>
              </div>

              {selectedNode.filename && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Source Document</span>
                  <div className="flex items-center space-x-1.5 text-slate-300 bg-[#141B2D] p-2 rounded border border-slate-800 text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{selectedNode.filename}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-500">
              <Network className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p>Click on any node in the topology canvas to inspect its semantic provenance and connected relationships.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
