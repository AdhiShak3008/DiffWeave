import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
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
  ArrowLeft,
  Sun,
  Moon,
  Settings
} from 'lucide-react';

export default function Navbar({
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  activeTab,
  onSelectTab,
  stats,
  currentUser,
  onLogout,
  onRefresh,
  refreshing
}) {
  const { theme, toggleTheme } = useTheme();
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
    { id: 'diff', label: 'Semantic Diff', icon: FileDiff, badge: pendingProposals > 0 ? `${pendingProposals}` : null },
    { id: 'prs', label: 'PR Review Deck', icon: GitPullRequest, badge: pendingProposals > 0 ? `${pendingProposals} pending` : null },
    { id: 'graph', label: 'Knowledge Graph', icon: Network },
    { id: 'staging', label: 'Ingestion Staging', icon: Files, badge: totalDocs > 0 ? `${totalDocs} docs` : null },
    { id: 'rules', label: 'Policy Rules CI', icon: ShieldCheck },
    { id: 'knowledge', label: 'Truth Register', icon: Database, badge: verifiedFacts > 0 ? `${verifiedFacts} facts` : null },
    { id: 'audit', label: 'Audit & Provenance', icon: History },
    { id: 'quickstart', label: 'CLI Quickstart', icon: Terminal },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#010409] border-b border-[#30363D] shadow-md select-none">
      {/* --------------------------------------------------------------------- */}
      {/* TIER 1: Global Platform Bar (#010409)                                  */}
      {/* --------------------------------------------------------------------- */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-[#21262D]">
        {/* Left: Brand Logo & Workspace Switcher */}
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            onClick={() => onSelectWorkspace && onSelectWorkspace(null)}
            className="flex items-center space-x-2.5 cursor-pointer group"
            title="Return to Workspaces Hub"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 p-[1px] shadow-sm group-hover:scale-105 transition">
              <div className="w-full h-full bg-[#010409] rounded-[6px] flex items-center justify-center">
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm text-white tracking-tight group-hover:text-emerald-300 transition">
                DiffWeave
              </span>
              <span className="text-[10px] text-slate-400 font-mono -mt-1">
                Document Git Platform
              </span>
            </div>
          </Link>

          <span className="text-slate-600 hidden sm:inline">/</span>

          {/* Hub Link Button */}
          <Link
            to="/"
            onClick={() => onSelectWorkspace && onSelectWorkspace(null)}
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition ${
              !currentWorkspace
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-[#161B22] hover:bg-[#21262D] border-[#30363D] text-slate-300 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Workspaces</span>
          </Link>

          {/* Workspace Dropdown */}
          <div ref={wsDropdownRef} className="relative">
            <button
              onClick={() => {
                setShowWsDropdown((prev) => !prev);
                setShowUserDropdown(false);
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-slate-200 transition"
            >
              <span className={`w-2 h-2 rounded-full ${currentWorkspace ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="truncate max-w-[150px] text-xs font-semibold">
                {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showWsDropdown && (
              <div className="absolute left-0 mt-1.5 w-64 bg-[#161B22] border border-[#30363D] rounded-xl shadow-2xl p-2 z-50 space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 border-b border-[#30363D]">
                  Document Workspaces ({workspaces.length})
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5 py-1">
                  {workspaces.map((w) => (
                    <Link
                      key={w.id}
                      to={`/workspaces/${w.id}/diff`}
                      onClick={() => {
                        setShowWsDropdown(false);
                        onSelectWorkspace && onSelectWorkspace(w);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition flex items-center justify-between ${
                        currentWorkspace?.id === w.id
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'text-slate-300 hover:bg-[#21262D] hover:text-white'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate">{w.name}</p>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {w.d_count ?? 0} docs &bull; {w.k_count ?? 0} facts
                        </span>
                      </div>
                      {currentWorkspace?.id === w.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </Link>
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

        {/* Right: FastMCP Bridge status, Theme Quick Toggle & User Profile */}
        <div className="flex items-center space-x-2.5">
          {/* FastMCP Connected Pill */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#161B22] border border-[#30363D] text-[11px] text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>FastMCP: Active</span>
          </div>

          {/* Quick Light/Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-slate-300 hover:text-white transition flex items-center justify-center"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle interface theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

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
                  <Link
                    to="/"
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full text-left px-2 py-1.5 rounded text-slate-300 hover:bg-[#21262D] flex items-center space-x-2"
                  >
                    <Grid className="w-3.5 h-3.5 text-sky-400" />
                    <span>Workspaces Hub</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full text-left px-2 py-1.5 rounded text-slate-300 hover:bg-[#21262D] flex items-center space-x-2"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Developer Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full text-left px-2 py-1.5 rounded text-slate-300 hover:bg-[#21262D] flex items-center space-x-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-sky-400" />
                    <span>Platform Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      handleCopyApiKey();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded text-slate-300 hover:bg-[#21262D] flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>{copiedApiKey ? 'Copied Token!' : 'Copy API Key'}</span>
                    </div>
                    {copiedApiKey && <span className="text-[10px] text-emerald-400 font-bold">&check;</span>}
                  </button>
                  <div className="pt-1 border-t border-[#30363D]">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-2 py-1.5 rounded text-rose-400 hover:bg-rose-950/30 flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition"
            >
              Sign In
            </Link>
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
              <Link
                to="/"
                onClick={() => onSelectWorkspace && onSelectWorkspace(null)}
                className="p-1 rounded-md hover:bg-[#161B22] text-slate-400 hover:text-white transition"
                title="Back to All Workspaces"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
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
                <span className="text-white font-bold font-mono">{verifiedFacts}</span>
              </div>

              <button
                onClick={onRefresh}
                className="p-1.5 rounded-md bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-slate-400 hover:text-white transition"
                title="Refresh Workspace Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* TIER 3: Workspace Navigation Tabs (GitHub-style deep Link tabs)   */}
          {/* ----------------------------------------------------------------- */}
          <nav className="flex px-4 sm:px-6 space-x-1 overflow-x-auto border-t border-[#21262D] text-xs font-medium no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  to={`/workspaces/${currentWorkspace.id}/${tab.id}`}
                  onClick={() => onSelectTab && onSelectTab(tab.id)}
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
                </Link>
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
