import React, { useState, useRef, useEffect } from 'react';
import {
  FileDiff,
  GitPullRequest,
  Network,
  ShieldCheck,
  Files,
  Database,
  History,
  Key,
  Search,
  User,
  LogOut,
  ExternalLink,
  ChevronDown,
  Layers,
  CheckCircle2,
  Copy,
  Lock,
  Cpu,
  Plus,
  RefreshCw,
  Sparkles,
  Terminal,
  Grid,
  ArrowLeft
} from 'lucide-react';

export default function Navbar({
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onOpenHub,
  onCreateWorkspace,
  activeTab,
  onSelectTab,
  stats,
  currentUser,
  onOpenAuth,
  onLogout,
  onRefresh,
  refreshing,
}) {
  const [showWsDropdown, setShowWsDropdown] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);

  const handleCopyApiKey = () => {
    const tok = localStorage.getItem("diffweave_token") || localStorage.getItem("token") || "";
    if (tok) {
      navigator.clipboard.writeText(tok);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    } else {
      alert("No active API token found. Please sign in.");
    }
  };
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const wsDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Close dropdowns when clicking anywhere outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wsDropdownRef.current && !wsDropdownRef.current.contains(event.target)) {
        setShowWsDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    await onCreateWorkspace(newWsName.trim());
    setNewWsName('');
    setShowCreateModal(false);
  };

  const totalDocs = stats?.total_documents ?? currentWorkspace?.d_count ?? 0;
  const verifiedFacts = stats?.knowledge_items ?? stats?.total_knowledge_items ?? currentWorkspace?.k_count ?? 0;
  const pendingProposals = stats?.pending_proposals ?? 0;

  const tabs = [
    { id: 'diff', label: 'Semantic Diff', icon: FileDiff, badge: pendingProposals > 0 ? `${pendingProposals}` : undefined },
    { id: 'prs', label: 'Knowledge PRs', icon: GitPullRequest, badge: pendingProposals > 0 ? `${pendingProposals}` : undefined },
    { id: 'graph', label: 'Topology Graph', icon: Network },
    { id: 'staging', label: 'Documents & Staging', icon: Files, badge: totalDocs > 0 ? `${totalDocs}` : undefined },
    { id: 'rules', label: 'Policy CI Rules', icon: ShieldCheck },
    { id: 'knowledge', label: 'Master Truth Register', icon: Database, badge: verifiedFacts > 0 ? `${verifiedFacts}` : undefined },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'quickstart', label: 'CLI Quickstart', icon: Terminal },
  ];

  return (
    <header className="w-full bg-[#0D1117] border-b border-[#30363D] text-slate-100 select-none">
      {/* --------------------------------------------------------------------- */}
      {/* TIER 1: Global Platform Bar (#010409)                                 */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-[#010409] border-b border-[#30363D] px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs">
        {/* Left: Brand & Workspace Selector */}
        <div className="flex items-center space-x-3">
          {/* DiffWeave Logo (Navigates to Hub) */}
          <div
            onClick={onOpenHub}
            className="flex items-center space-x-2.5 cursor-pointer group"
            title="Return to Workspaces Hub"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 p-0.5 shadow-md group-hover:scale-105 transition">
              <div className="w-full h-full bg-[#010409] rounded-[6px] flex items-center justify-center">
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm text-white tracking-tight group-hover:text-emerald-400 transition">
                DiffWeave
              </span>
              <span className="text-[10px] text-slate-400 font-mono -mt-1">
                Document Git Platform
              </span>
            </div>
          </div>

          <span className="text-slate-600 hidden sm:inline">/</span>

          {/* Hub Button */}
          <button
            onClick={onOpenHub}
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition ${
              !currentWorkspace
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-[#161B22] hover:bg-[#21262D] border-[#30363D] text-slate-300 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Workspaces</span>
          </button>

          {/* Workspace Dropdown */}
          <div ref={wsDropdownRef} className="relative">
            <button
              onClick={() => {
                setShowWsDropdown((prev) => !prev);
                setShowUserDropdown(false);
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-slate-200 transition font-medium"
            >
              <span className={`w-2 h-2 rounded-full ${currentWorkspace ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="truncate max-w-[150px] text-xs font-semibold">
                {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showWsDropdown && (
              <div className="absolute left-0 mt-1.5 w-64 bg-[#161B22] border border-[#30363D] rounded-xl shadow-2xl p-2 z-50 space-y-1">
                {/* Option to go to Hub */}
                <button
                  onClick={() => {
                    onOpenHub();
                    setShowWsDropdown(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center space-x-2 text-emerald-400 hover:bg-[#21262D] font-bold pb-2 border-b border-[#30363D]"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>View All Workspaces (Hub)</span>
                </button>

                <div className="text-[10px] font-bold text-slate-400 px-2 pt-2 pb-1 uppercase tracking-wider">
                  Workspaces ({workspaces.length})
                </div>

                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {workspaces.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        onSelectWorkspace(w);
                        setShowWsDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition flex items-center justify-between ${
                        currentWorkspace?.id === w.id
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'text-slate-300 hover:bg-[#21262D]'
                      }`}
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="truncate font-semibold">{w.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal truncate">
                          {w.d_count ?? 0} docs · {w.k_count ?? 0} facts
                        </span>
                      </div>
                      {currentWorkspace?.id === w.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-1.5 border-t border-[#30363D]">
                  <button
                    onClick={() => {
                      setShowWsDropdown(false);
                      setShowCreateModal(true);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded text-xs text-sky-400 hover:bg-[#21262D] font-semibold flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Document Workspace...</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: FastMCP Bridge status & User Profile */}
        <div className="flex items-center space-x-3">
          {/* FastMCP Connected Pill */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#161B22] border border-[#30363D] text-[11px] text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 " />
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>FastMCP: Active</span>
          </div>

          {/* User Menu */}
          {currentUser ? (
            <div ref={userDropdownRef} className="relative">
              <button
                onClick={() => {
                  setShowUserDropdown((prev) => !prev);
                  setShowWsDropdown(false);
                }}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-slate-200 transition"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center text-[9px]">
                  {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
                </div>
                <span className="font-semibold text-xs truncate max-w-[100px]">
                  {currentUser.username || 'Evaluator'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-1.5 w-56 bg-[#161B22] border border-[#30363D] rounded-xl shadow-2xl p-2 z-50 space-y-1 text-xs">
                  <div className="px-2 py-1.5 border-b border-[#30363D]">
                    <p className="font-bold text-white">{currentUser.username || 'User'}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email || 'user@docweave.io'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenHub();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded text-slate-300 hover:bg-[#21262D] flex items-center space-x-2"
                  >
                    <Grid className="w-3.5 h-3.5 text-sky-400" />
                    <span>Workspaces Hub</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      const tok = localStorage.getItem("diffweave_token") || localStorage.getItem("token") || "";
                      if (tok) {
                        navigator.clipboard.writeText(tok);
                        alert("Personal Access Token / API Key copied to clipboard!");
                      } else {
                        alert("No active API token found.");
                      }
                    }}
                    className="w-full text-left px-2 py-1.5 rounded text-slate-300 hover:bg-[#21262D] flex items-center space-x-2"
                  >
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copy API Key</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => { window.location.href = "/login"; }}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-[#238636] hover:bg-[#2EA043] text-white font-semibold text-xs transition shadow"
            >
              <Lock className="w-3 h-3" />
              <span>Sign in with DocWeave</span>
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TIER 2: Workspace Document Context Header (#0D1117) - If Workspace Active */}
      {/* --------------------------------------------------------------------- */}
      {currentWorkspace && (
        <>
          <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Workspace Title & Badge */}
            <div className="flex items-center space-x-2.5">
              <button
                onClick={onOpenHub}
                className="p-1 rounded-md hover:bg-[#161B22] text-slate-400 hover:text-white transition"
                title="Back to All Workspaces"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <Files className="w-5 h-5 text-emerald-400" />
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold text-base sm:text-lg">
                  {currentWorkspace?.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Deterministic RAG
                </span>
              </div>
            </div>

            {/* Real Document Platform KPI Badges */}
            <div className="flex items-center space-x-2 text-xs font-semibold">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#161B22] border border-[#30363D] text-slate-300">
                <Files className="w-3.5 h-3.5 text-sky-400" />
                <span>Tracked Docs:</span>
                <span className="text-white font-bold font-mono">{totalDocs}</span>
              </div>

              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#161B22] border border-[#30363D] text-slate-300">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Truth:</span>
                <span className="text-white font-bold font-mono">{verifiedFacts} Facts</span>
              </div>

              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#161B22] border border-[#30363D] text-slate-300">
                <GitPullRequest className="w-3.5 h-3.5 text-amber-400" />
                <span>Pending PRs:</span>
                <span className="text-amber-400 font-bold font-mono">{pendingProposals}</span>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* TIER 3: Knowledge Git Tabs                                       */}
          {/* ----------------------------------------------------------------- */}
          <nav className="px-4 sm:px-6 flex space-x-1 overflow-x-auto text-xs font-semibold no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2.5 border-b-2 transition whitespace-nowrap ${
                    isActive
                      ? 'border-emerald-500 text-white font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'bg-[#21262D] text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </>
      )}

      {/* Fallback Simple Modal if triggered from dropdown */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create New Document Workspace</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Workspace Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. security-policies-2026"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-bold"
                >
                  Initialize Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
