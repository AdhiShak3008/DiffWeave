import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  ArrowUpDown,
  ExternalLink,
  Files,
  Database,
  GitPullRequest,
  CheckCircle2,
  Clock,
  Sparkles,
  Settings,
  User,
  ShieldCheck,
  Globe,
  Lock,
  ChevronDown,
  Activity,
  Terminal,
  X,
  BookOpen
} from 'lucide-react';

const GRADIENTS = [
  'from-teal-600/90 via-cyan-700/80 to-blue-800/90',
  'from-blue-600/90 via-indigo-700/80 to-purple-800/90',
  'from-purple-600/90 via-pink-700/80 to-rose-800/90',
  'from-emerald-600/90 via-teal-700/80 to-sky-800/90',
  'from-cyan-600/90 via-blue-700/80 to-indigo-800/90',
  'from-violet-600/90 via-purple-700/80 to-fuchsia-800/90',
];

const EMOJIS = ['🧬', '🚀', '🩺', '⚡', '📊', '🌐', '🛡️', '📑', '🧠', '🔬'];

export default function WorkspaceHub({
  workspaces = [],
  currentWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  currentUser,
  onOpenAuth
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated'); // updated, docs, facts, name
  const [showCreateModal, setShowCreateModal] = useState(false);

  // GitHub-style Create Workspace form state
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [wsVisibility, setWsVisibility] = useState('public');
  const [starterTemplate, setStarterTemplate] = useState('empty');
  const [suggestedName] = useState(() => {
    const suggestions = ['fuzzy-spork', 'neural-policy-v2', 'clinical-guidelines', 'rag-truth-matrix', 'legal-audit-2026'];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  });

  const username = currentUser?.username || 'shak3008';
  const displayName = currentUser?.username === 'shak3008' ? 'Adhi Shakthi' : (currentUser?.username || 'Adhi Shakthi');

  // Filter & Sort Workspaces
  const filteredWorkspaces = useMemo(() => {
    let list = workspaces.filter((w) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (w.name && w.name.toLowerCase().includes(q)) ||
        (w.description && w.description.toLowerCase().includes(q)) ||
        (w.id && w.id.toLowerCase().includes(q))
      );
    });

    if (sortBy === 'docs') {
      list.sort((a, b) => (b.d_count ?? 0) - (a.d_count ?? 0));
    } else if (sortBy === 'facts') {
      list.sort((a, b) => (b.k_count ?? 0) - (a.k_count ?? 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return list;
  }, [workspaces, searchQuery, sortBy]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const finalName = wsName.trim() || suggestedName;
    await onCreateWorkspace(finalName, wsDesc.trim());
    setWsName('');
    setWsDesc('');
    setShowCreateModal(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 2-Column Hugging Face App Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================================================================= */}
        {/* LEFT COLUMN: User Profile Card (Matches HF media_2)              */}
        {/* ================================================================= */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#0D1117] border border-[#30363D] rounded-2xl p-5 shadow-xl space-y-5">
            {/* Avatar with Pink / Neon Green ring accent */}
            <div className="relative w-28 h-28 mx-auto mt-2">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-pink-500 via-rose-400 to-emerald-400 p-[3px] shadow-lg shadow-pink-500/20">
                <div className="w-full h-full rounded-full bg-[#161B22] flex items-center justify-center overflow-hidden">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center text-white text-3xl font-black shadow-inner">
                    {username[0]?.toUpperCase() || 'A'}
                  </div>
                </div>
              </div>
              {/* Green star badge */}
              <div className="absolute top-0 left-0 w-6 h-6 rounded-full bg-emerald-400 text-black flex items-center justify-center text-xs font-bold shadow-md">
                ✦
              </div>
              {/* Hand wave badge */}
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#161B22] border border-[#30363D] flex items-center justify-center text-xs shadow-md">
                👋
              </div>
            </div>

            {/* Profile Info */}
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <h2 className="text-lg font-extrabold text-white">{displayName}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-emerald-500 to-teal-400 text-black uppercase tracking-wider shadow-sm">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">@{username}</p>
            </div>

            {/* Profile Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => setShowCreateModal(true)}
                className="col-span-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
              <button
                onClick={onOpenAuth}
                className="col-span-1 py-1.5 px-2 rounded-lg bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-slate-300 text-xs font-medium transition text-center truncate"
              >
                Profile
              </button>
              <button
                onClick={onOpenAuth}
                className="col-span-1 py-1.5 px-2 rounded-lg bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-slate-300 text-xs font-medium transition text-center truncate"
              >
                Settings
              </button>
            </div>

            <hr className="border-[#30363D]" />

            {/* AI & ML interests */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI & Knowledge Domains</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#161B22] border border-[#30363D] text-slate-300">
                  Deterministic RAG
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#161B22] border border-[#30363D] text-slate-300">
                  Semantic Git
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#161B22] border border-[#30363D] text-slate-300">
                  Clinical & Legal CI
                </span>
              </div>
            </div>

            <hr className="border-[#30363D]" />

            {/* Recent Activity */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>Recent Activity</span>
              </div>
              <div className="space-y-2 text-[11px] text-slate-400">
                <div className="flex items-start space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
                  <div>
                    <span className="text-slate-300 font-medium">Updated a Space</span>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{username}/DiffWeave · 2m ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400 mt-1 shrink-0" />
                  <div>
                    <span className="text-slate-300 font-medium">Published Space</span>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{username}/DocWeave · 3h ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Spaces / Workspaces Grid (Matches HF media_2)       */}
        {/* ================================================================= */}
        <div className="lg:col-span-9 space-y-6">
          {/* Header Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#30363D]">
            {/* Spaces count */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-mono text-sm tracking-widest">::</span>
                <h1 className="text-lg font-extrabold text-white flex items-center space-x-2">
                  <span>Workspaces</span>
                  <span className="text-slate-400 text-sm font-mono font-medium">
                    {filteredWorkspaces.length}
                  </span>
                </h1>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search workspaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-[#161B22] border border-[#30363D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-60 transition"
                />
              </div>
            </div>

            {/* Right: Sort & New Workspace Button */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-[#161B22] border border-[#30363D] rounded-lg px-2.5 py-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="updated" className="bg-[#161B22] text-white">Recently updated</option>
                  <option value="docs" className="bg-[#161B22] text-white">Most documents</option>
                  <option value="facts" className="bg-[#161B22] text-white">Most verified facts</option>
                  <option value="name" className="bg-[#161B22] text-white">Alphabetical</option>
                </select>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2EA043] text-white font-bold text-xs transition shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>New Workspace</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredWorkspaces.length === 0 ? (
            <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No workspaces found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery ? `No results for "${searchQuery}". Try a different keyword.` : "You don't have any document workspaces yet."}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-lg bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-bold transition inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Workspace</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWorkspaces.map((ws, idx) => {
                const grad = GRADIENTS[idx % GRADIENTS.length];
                const emoji = EMOJIS[idx % EMOJIS.length];
                const docsCount = ws.d_count ?? 0;
                const factsCount = ws.k_count ?? 0;
                const isSelected = currentWorkspace?.id === ws.id;

                return (
                  <div
                    key={ws.id}
                    onClick={() => onSelectWorkspace(ws)}
                    className={`group relative rounded-2xl overflow-hidden border transition duration-200 cursor-pointer flex flex-col justify-between shadow-lg hover:shadow-2xl hover:-translate-y-0.5 ${
                      isSelected
                        ? 'border-emerald-500/80 ring-2 ring-emerald-500/30 bg-[#161B22]'
                        : 'border-[#30363D] hover:border-slate-500 bg-[#161B22]'
                    }`}
                  >
                    {/* Top Gradient Banner (HF Style) */}
                    <div className={`bg-gradient-to-r ${grad} p-4 sm:p-5 flex flex-col justify-between min-h-[110px] relative`}>
                      {/* Top Bar: Status Badge */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[10px] font-bold text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Running</span>
                        </span>

                        <span className="text-white/60 text-xs group-hover:text-white transition">
                          &rarr;
                        </span>
                      </div>

                      {/* Workspace Title & Description */}
                      <div className="pt-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base sm:text-lg font-black text-white group-hover:underline drop-shadow-sm truncate">
                            {ws.name || 'Untitled Workspace'}
                          </h3>
                          <span className="text-sm">{emoji}</span>
                        </div>
                        <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
                          {ws.description || (docsCount === 0 && factsCount === 0 ? 'Empty workspace · ready for CLI setup' : `${docsCount} documents · ${factsCount} facts`)}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Metadata & Stats Bar */}
                    <div className="bg-[#0D1117] p-3.5 border-t border-[#30363D]/80 flex items-center justify-between text-xs text-slate-400">
                      {/* Left: Avatar + Username + Time */}
                      <div className="flex items-center space-x-2 truncate">
                        <div className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-[9px] text-white font-bold shrink-0">
                          {username[0]?.toUpperCase() || 'A'}
                        </div>
                        <span className="font-medium text-slate-300 truncate">@{username}</span>
                        <span className="text-slate-600 font-mono">·</span>
                        <span className="text-[11px] text-slate-500 truncate">
                          {idx === 0 ? '2 minutes ago' : idx === 1 ? '1 day ago' : idx === 2 ? '7 days ago' : 'Aug 25'}
                        </span>
                      </div>

                      {/* Right: Brief Stats (Docs & Facts) */}
                      <div className="flex items-center space-x-2 shrink-0 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-[#161B22] border border-[#30363D] text-sky-300 flex items-center space-x-1">
                          <Files className="w-3 h-3 text-sky-400" />
                          <span>{docsCount}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#161B22] border border-[#30363D] text-emerald-300 flex items-center space-x-1">
                          <Database className="w-3 h-3 text-emerald-400" />
                          <span>{factsCount}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* GITHUB-STYLE "CREATE A NEW REPOSITORY / WORKSPACE" MODAL (media_1)   */}
      {/* ===================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0D1117] border border-[#30363D] rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#30363D]">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Create a new workspace</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Workspaces contain your documents, version history, knowledge graph, and deterministic CI rules.{' '}
                  <span className="text-emerald-400 hover:underline cursor-pointer">Learn more</span>
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#21262D] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6 text-xs">
              {/* STEP 1: General */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <span className="w-5 h-5 rounded-full bg-[#21262D] text-slate-300 font-mono text-xs flex items-center justify-center">1</span>
                  <span>General</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Owner Dropdown */}
                  <div className="sm:col-span-5 space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Owner <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-white">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center text-[9px] text-white font-bold">
                          {username[0]?.toUpperCase() || 'A'}
                        </div>
                        <span className="font-semibold text-xs">{username}</span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  <div className="hidden sm:flex sm:col-span-1 justify-center items-center pb-2 text-slate-500 font-bold text-lg">
                    /
                  </div>

                  {/* Workspace Name Input */}
                  <div className="sm:col-span-6 space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Workspace name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={wsName}
                      onChange={(e) => setWsName(e.target.value)}
                      placeholder={suggestedName}
                      className="w-full px-3 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Great workspace names are short and memorable. How about{' '}
                  <span
                    onClick={() => setWsName(suggestedName)}
                    className="text-emerald-400 font-semibold hover:underline cursor-pointer"
                  >
                    {suggestedName}
                  </span>
                  ?
                </p>

                {/* Description */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-300">Description (optional)</label>
                    <span className="text-[10px] text-slate-500">{wsDesc.length} / 350 characters</span>
                  </div>
                  <input
                    type="text"
                    maxLength={350}
                    value={wsDesc}
                    onChange={(e) => setWsDesc(e.target.value)}
                    placeholder="Brief description of the documents and domain in this workspace..."
                    className="w-full px-3 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* STEP 2: Configuration */}
              <div className="space-y-4 pt-2 border-t border-[#30363D]">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <span className="w-5 h-5 rounded-full bg-[#21262D] text-slate-300 font-mono text-xs flex items-center justify-center">2</span>
                  <span>Configuration</span>
                </div>

                {/* Choose Visibility */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Choose visibility *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      onClick={() => setWsVisibility('public')}
                      className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                        wsVisibility === 'public'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-[#30363D] bg-[#161B22] hover:border-slate-500'
                      }`}
                    >
                      <Globe className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-white block">Public</span>
                        <span className="text-[11px] text-slate-400">Anyone on DiffWeave can query verified truth from this workspace.</span>
                      </div>
                    </label>

                    <label
                      onClick={() => setWsVisibility('private')}
                      className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                        wsVisibility === 'private'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-[#30363D] bg-[#161B22] hover:border-slate-500'
                      }`}
                    >
                      <Lock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-white block">Private</span>
                        <span className="text-[11px] text-slate-400">You choose who can see and commit to this workspace.</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Starter Template */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-semibold text-slate-300">Domain Starter Template</label>
                  <select
                    value={starterTemplate}
                    onChange={(e) => setStarterTemplate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="empty">Empty Workspace (CLI quickstart instructions)</option>
                    <option value="clinical">Clinical & Medical Guidelines Template</option>
                    <option value="legal">Legal & Compliance Contracts Template</option>
                    <option value="engineering">Engineering Architecture Specs Template</option>
                  </select>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#30363D]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#238636] hover:bg-[#2EA043] text-white font-bold transition shadow-md flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
