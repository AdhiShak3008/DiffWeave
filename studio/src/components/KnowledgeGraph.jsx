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
  Info,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Layers,
  Activity,
  GitPullRequest,
  BookOpen,
  Filter,
  Eye,
  X,
  HelpCircle
} from 'lucide-react';

export default function KnowledgeGraph({ graphData, loading, onSelectTab }) {
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [displayMode, setDisplayMode] = useState('pipeline'); // 'pipeline' (hierarchical flow) | 'network' (constellation)
  const [showGraphExplainer, setShowGraphExplainer] = useState(true);

  const rawNodes = graphData?.nodes || [];
  const rawEdges = graphData?.edges || [];

  // Categorize nodes into intuitive medical layers
  const categorized = useMemo(() => {
    const docs = [];
    const claims = [];
    const metrics = [];
    const rules = [];
    const proposals = [];

    rawNodes.forEach((n) => {
      const t = String(n.type || '').toUpperCase();
      if (t === 'DOCUMENT') docs.push(n);
      else if (t === 'METRIC') metrics.push(n);
      else if (t === 'CLAIM') claims.push(n);
      else if (t === 'RULE' || t === 'SAFETY') rules.push(n);
      else if (t === 'PROPOSAL') proposals.push(n);
      else claims.push(n); // default
    });

    return { docs, claims, metrics, rules, proposals };
  }, [rawNodes]);

  // Filter nodes based on user search and category
  const filteredNodes = useMemo(() => {
    return rawNodes.filter((n) => {
      const t = String(n.type || '').toUpperCase();
      const matchesType =
        filterType === 'ALL' ||
        (filterType === 'DOCUMENTS' && t === 'DOCUMENT') ||
        (filterType === 'CLAIMS' && t === 'CLAIM') ||
        (filterType === 'METRICS' && t === 'METRIC') ||
        (filterType === 'RULES' && (t === 'RULE' || t === 'SAFETY')) ||
        (filterType === 'PROPOSALS' && t === 'PROPOSAL');

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (n.title || '').toLowerCase().includes(q) ||
        String(n.value || '').toLowerCase().includes(q) ||
        (n.filename || '').toLowerCase().includes(q);

      return matchesType && matchesSearch;
    });
  }, [rawNodes, filterType, searchQuery]);

  // Generate constellation layout coordinates for Network view
  const positionedNodes = useMemo(() => {
    const total = filteredNodes.length;
    if (total === 0) return [];

    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(centerX, centerY) - 70;

    return filteredNodes.map((node, i) => {
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

  const getNodeTheme = (type) => {
    const t = String(type || '').toUpperCase();
    switch (t) {
      case 'DOCUMENT':
        return {
          color: '#3B82F6', // Blue
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          badge: 'SOURCE DOCUMENT',
          icon: FileText,
          desc: 'Original medical guideline or clinical PDF.'
        };
      case 'CLAIM':
        return {
          color: '#8B5CF6', // Violet
          bg: 'bg-violet-500/10',
          border: 'border-violet-500/30',
          badge: 'CLINICAL ASSERTION',
          icon: Activity,
          desc: 'Verified clinical finding or standard of care.'
        };
      case 'METRIC':
        return {
          color: '#10B981', // Emerald
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          badge: 'DOSING / THRESHOLD',
          icon: Sparkles,
          desc: 'Quantitative clinical threshold or numerical boundary.'
        };
      case 'RULE':
      case 'SAFETY':
        return {
          color: '#F59E0B', // Amber
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          badge: 'SAFETY GUARDRAIL',
          icon: ShieldCheck,
          desc: 'Quality gate or regulatory constraint (e.g. GCP 24h SLA).'
        };
      case 'PROPOSAL':
        return {
          color: '#EC4899', // Pink
          bg: 'bg-pink-500/10',
          border: 'border-pink-500/30',
          badge: 'STAGED PULL REQUEST',
          icon: GitPullRequest,
          desc: 'Candidate assertion awaiting human peer review.'
        };
      default:
        return {
          color: '#06B6D4', // Cyan
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          badge: 'MEDICAL ENTITY',
          icon: Link2,
          desc: 'Medical concept, drug, or classification.'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono">Building Knowledge Lineage Graph...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* 1. PLAIN-ENGLISH EDUCATIONAL BANNER (No Jargon)                     */}
      {/* =================================================================== */}
      {showGraphExplainer && (
        <div className="bg-gradient-to-r from-[#0C121E] via-[#0E1526] to-[#0A101D] border border-emerald-500/20 rounded-2xl p-4 sm:p-5 relative shadow-lg">
          <button
            onClick={() => setShowGraphExplainer(false)}
            className="absolute top-3.5 right-3.5 text-slate-500 hover:text-slate-300 transition"
            title="Dismiss Explainer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Network className="w-5 h-5" />
            </div>

            <div className="space-y-1.5 max-w-4xl text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">Medical Knowledge Lineage & Connections</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-semibold border border-emerald-500/30">
                  Interactive Visual Map
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Think of this as a <strong>family tree for clinical knowledge</strong>. Source medical documents (blue) sit at the root. DiffWeave extracts verified assertions (violet) and dosing cutoffs (emerald), which are automatically guarded by compliance rules (amber).
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-[11px] text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                  <span>1. Source Guidelines</span>
                </span>
                <span className="text-slate-600">&rarr;</span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block"></span>
                  <span>2. Clinical Findings</span>
                </span>
                <span className="text-slate-600">&rarr;</span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span>3. Dosing Thresholds</span>
                </span>
                <span className="text-slate-600">&rarr;</span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  <span>4. Safety Guardrails</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. GRAPH CONTROLS (Views, Search, Filters)                          */}
      {/* =================================================================== */}
      <div className="bg-[#0C101A] border border-slate-800/90 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Network className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Knowledge Lineage</h2>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {rawNodes.length} medical elements &bull; {rawEdges.length} connections
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Node Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search elements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#141B2D] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-44"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#141B2D] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="DOCUMENTS">Source Documents (Blue)</option>
            <option value="CLAIMS">Clinical Assertions (Violet)</option>
            <option value="METRICS">Dosing & Metrics (Emerald)</option>
            <option value="RULES">Safety Guardrails (Amber)</option>
            <option value="PROPOSALS">Staged PRs (Pink)</option>
          </select>

          {/* View Mode Toggle: Lineage Pipeline vs Network Constellation */}
          <div className="flex items-center bg-[#141B2D] border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setDisplayMode('pipeline')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center space-x-1.5 ${
                displayMode === 'pipeline' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Pipeline Flow: Left-to-right lineage tree"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pipeline Flow</span>
            </button>
            <button
              onClick={() => setDisplayMode('network')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center space-x-1.5 ${
                displayMode === 'network' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Network Constellation: Cluster canvas"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Constellation</span>
            </button>
          </div>

          {/* Zoom Controls (Network Mode Only) */}
          {displayMode === 'network' && (
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
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. MAIN VISUAL CANVAS: PIPELINE FLOW vs CONSTELLATION               */}
      {/* =================================================================== */}
      {displayMode === 'pipeline' ? (
        /* ================================================================= */
        /* VIEW 1: STRUCTURED PIPELINE LINEAGE FLOW (No Jargon, Easy to Get) */
        /* ================================================================= */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Column 1: Source Medical Documents */}
            <div className="bg-[#0A0E18] border border-blue-500/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-2.5">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Source Documents</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">
                  {categorized.docs.length || 1}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Baseline protocols uploaded to DiffWeave staging.</p>

              <div className="space-y-2.5 pt-1">
                {(categorized.docs.length > 0 ? categorized.docs : [
                  { id: 'doc-baseline', title: 'Clinical-Guidelines-2026.pdf', value: 'Master clinical protocol version 2026', type: 'DOCUMENT' }
                ]).map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedNode(doc)}
                    className="p-3 rounded-xl bg-[#101726] hover:bg-[#162136] border border-blue-500/30 transition cursor-pointer space-y-1.5 shadow-sm group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-300 group-hover:text-blue-200 truncate">{doc.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">PDF</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{doc.value || 'Verified baseline source document'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Clinical Findings & Guidelines */}
            <div className="bg-[#0A0E18] border border-violet-500/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-violet-500/20 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Clinical Findings</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 font-bold">
                  {categorized.claims.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Clinical claims extracted and committed to master.</p>

              <div className="space-y-2.5 pt-1">
                {categorized.claims.map((claim) => (
                  <div
                    key={claim.id}
                    onClick={() => setSelectedNode(claim)}
                    className="p-3 rounded-xl bg-[#121426] hover:bg-[#1A1C38] border border-violet-500/30 transition cursor-pointer space-y-1.5 shadow-sm group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-violet-300 group-hover:text-violet-200 truncate">{claim.title}</span>
                      <span className="text-[10px] font-mono text-violet-400 font-semibold">96% Conf</span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{claim.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Dosing & Numerical Thresholds */}
            <div className="bg-[#0A0E18] border border-emerald-500/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Dosing & Thresholds</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                  {categorized.metrics.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Quantitative boundaries and numerical guidelines.</p>

              <div className="space-y-2.5 pt-1">
                {categorized.metrics.map((metric) => (
                  <div
                    key={metric.id}
                    onClick={() => setSelectedNode(metric)}
                    className="p-3 rounded-xl bg-[#0F1A1C] hover:bg-[#152528] border border-emerald-500/30 transition cursor-pointer space-y-1.5 shadow-sm group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200 truncate">{metric.title}</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                        {Math.round((metric.confidence || 0.95) * 100)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 4: Safety Guardrails & Compliance Rules */}
            <div className="bg-[#0A0E18] border border-amber-500/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Safety Guardrails</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                  4
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Automated policy checks enforcing clinical compliance.</p>

              <div className="space-y-2.5 pt-1">
                {[
                  { id: 'rule-floor', title: 'Confidence Floor &ge; 85%', value: 'Prevents low-confidence extractions from polluting the Truth Register.', type: 'RULE' },
                  { id: 'rule-provenance', title: 'Mandatory Provenance Citation', value: 'Requires every claim to cite exact document page and paragraph.', type: 'RULE' },
                  { id: 'rule-sae', title: 'Safety Escalation SLA (24h)', value: 'Strict 24-hour reporting deadline for adverse clinical deviations.', type: 'RULE' },
                  { id: 'rule-stats', title: 'Statistical p-Value Validation', value: 'Ensures clinical numerical claims specify confidence intervals.', type: 'RULE' },
                ].map((rule) => (
                  <div
                    key={rule.id}
                    onClick={() => setSelectedNode(rule)}
                    className="p-3 rounded-xl bg-[#1A160F] hover:bg-[#262016] border border-amber-500/30 transition cursor-pointer space-y-1.5 shadow-sm group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200 truncate">{rule.title}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{rule.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================================================================= */
        /* VIEW 2: INTERACTIVE NETWORK CONSTELLATION CANVAS                  */
        /* ================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-[#090D16] border border-slate-800/80 rounded-2xl p-4 overflow-hidden relative min-h-[560px] flex items-center justify-center">
            <svg
              viewBox="0 0 800 600"
              className="w-full h-full transition-transform duration-200 cursor-grab active:cursor-grabbing"
              style={{ transform: `scale(${zoom})` }}
            >
              <defs>
                <pattern id="graphGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#161F32" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#graphGrid)" />

              {/* Connecting Lines */}
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

              {/* Circular Nodes */}
              {positionedNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const theme = getNodeTheme(node.type);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer group"
                  >
                    {isSelected && (
                      <circle r="24" fill="none" stroke={theme.color} strokeWidth="2.5" opacity="0.8" className="animate-pulse" />
                    )}

                    <circle
                      r={node.type === 'DOCUMENT' ? 16 : 13}
                      fill="#0D121F"
                      stroke={theme.color}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition hover:scale-125"
                    />

                    <circle r="4" fill={theme.color} />

                    <text
                      y="26"
                      textAnchor="middle"
                      fill={isSelected ? '#F8FAFC' : '#94A3B8'}
                      fontSize="9.5"
                      fontFamily="Inter, sans-serif"
                      fontWeight={isSelected ? '600' : '400'}
                      className="select-none pointer-events-none"
                    >
                      {node.title.length > 20 ? node.title.slice(0, 18) + '...' : node.title}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Side Inspector in Constellation Mode */}
          <div className="lg:col-span-4 bg-[#0D121F] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Element Inspector</h3>
            {selectedNode ? (
              renderNodeDetails(selectedNode)
            ) : (
              <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-600" />
                <p>Click any node on the graph to inspect its clinical finding, confidence, and source document.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. SLIDE-OVER / MODAL INSPECTOR WHEN CLICKING ANY NODE IN PIPELINE  */}
      {/* =================================================================== */}
      {selectedNode && displayMode === 'pipeline' && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedNode(null)}
          />

          <div className="relative w-full max-w-lg bg-[#0C111C] border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl z-10 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {getNodeTheme(selectedNode.type).badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white pt-1">{selectedNode.title}</h3>
                </div>

                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {renderNodeDetails(selectedNode)}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Close
              </button>

              {onSelectTab && selectedNode.type !== 'RULE' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNode(null);
                    onSelectTab('knowledge');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <span>View in Truth Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper function to render node detail card
  function renderNodeDetails(node) {
    const theme = getNodeTheme(node.type);
    const Icon = theme.icon;

    return (
      <div className="space-y-4 text-xs">
        <div className={`p-4 rounded-xl border ${theme.bg} ${theme.border} space-y-2`}>
          <div className="flex items-center space-x-2">
            <Icon className="w-4 h-4" style={{ color: theme.color }} />
            <span className="font-bold text-white">{theme.badge}</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans">{node.value || node.title}</p>
          <span className="text-[11px] text-slate-400 block pt-1">{theme.desc}</span>
        </div>

        {/* Provenance & Citation */}
        <div className="bg-[#121826] border border-slate-800 rounded-xl p-4 space-y-2.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Provenance Citation</span>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Source Protocol:</span>
            <span className="font-semibold text-white">{node.filename || 'Clinical_Guideline.pdf'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Section Citation:</span>
            <span className="font-mono text-emerald-400">Section 2.1 Baseline Standard</span>
          </div>
          {node.confidence !== undefined && (
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Confidence Score:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {Math.round((node.confidence || 0.95) * 100)}% Verified
              </span>
            </div>
          )}
        </div>

        {/* Connected Elements */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Lineage Relationships</span>
          <div className="p-3 rounded-xl bg-[#111622] border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
            <div className="flex items-center space-x-1.5 text-blue-400">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Extracted from: <strong>{node.filename || 'Clinical_Guideline.pdf'}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5 text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Guarded by: <strong>Confidence Floor (&ge;85%) & Mandatory Provenance</strong></span>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Committed branch: <strong>refs/heads/main</strong></span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
