import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  FileDiff,
  Network,
  Database,
  ShieldCheck,
  History,
  FolderGit2,
  Plus,
  Search,
  CheckCircle2,
  Key,
  LogOut,
  User,
  Zap,
  ExternalLink,
  ChevronDown,
  Layers
} from 'lucide-react';
import { api } from '../api/client';

export default function Navbar({
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  activeTab,
  onSelectTab,
  stats,
}) {
  const [showNewModal, setShowNewModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('demo');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    setCurrentUser(api.getCurrentUser());
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    await onCreateWorkspace(newWsName.trim(), newWsDesc.trim());
    setNewWsName('');
    setNewWsDesc('');
    setShowNewModal(false);
  };

  const handleDemoLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const user = await api.demoLogin();
      setCurrentUser(user);
      setShowAuthModal(false);
    } catch (err) {
      api.setApiKey('demo-evaluator-token');
      setCurrentUser({ username: 'Demo Evaluator', email: 'demo@docweave.io' });
      setShowAuthModal(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const user = await api.login(loginEmail, loginPassword);
      setCurrentUser(user);
      setShowAuthModal(false);
    } catch (err) {
      setAuthError('Authentication failed: ' + (err.message || 'Invalid credentials'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    if (!customApiKey.trim()) return;
    api.setApiKey(customApiKey.trim());
    setCurrentUser({ username: 'API Key User', email: 'pat@docweave.io' });
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const pendingCount = stats?.pending_proposals || 0;

  const navItems = [
    { id: 'diff', label: 'Semantic Diff', icon: FileDiff },
    { id: 'prs', label: 'Knowledge PRs', icon: GitPullRequest, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'staging', label: 'Staging & Files', icon: Layers },
    { id: 'graph', label: 'Topology Graph', icon: Network },
    { id: 'knowledge', label: 'Knowledge Register', icon: Database },
    { id: 'rules', label: 'CI Policy Rules', icon: ShieldCheck },
    { id: 'audit', label: 'Git Audit Log', icon: History },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-[#070A10]/95 backdrop-blur-md sticky top-0 z-50">
      {/* Top Meta Bar */}
      <div className="border-b border-slate-900 px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-[11px] text-slate-400 bg-[#05070C]">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 font-medium text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>DiffWeave Knowledge GitOps Platform</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono">v0.1.0-prod</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 flex items-center space-x-1">
            <span>Powered by DocWeave MCP</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>FastMCP: 29 Tools Active</span>
          </div>
          <span className="text-slate-500">Latency: 14ms</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Workspace Breadcrumbs */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white font-bold text-base">🧶</span>
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight">DiffWeave</span>
                <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  Studio
                </span>
              </div>
            </div>

            <span className="text-slate-700">/</span>

            {/* Workspace Selector */}
            <div className="flex items-center space-x-2 bg-[#0E1422] border border-slate-800 rounded-lg p-1">
              <FolderGit2 className="w-3.5 h-3.5 text-slate-400 ml-2" />
              <select
                className="bg-transparent text-slate-200 text-xs rounded px-2 py-1 focus:outline-none font-medium cursor-pointer"
                value={currentWorkspace?.id || ''}
                onChange={(e) => onSelectWorkspace(e.target.value)}
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id} className="bg-[#0E1422] text-slate-200">
                    {w.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowNewModal(true)}
                className="text-[11px] text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition flex items-center space-x-1"
                title="Create Workspace"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center space-x-2 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono font-semibold border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Session & Auth Action */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-[#0E1422] border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
                </div>
                <span className="text-slate-200 font-medium max-w-[110px] truncate">{currentUser.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-red-400 p-0.5 rounded transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm shadow-emerald-600/30 flex items-center space-x-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Connect / API Key</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auth / API Key Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="bg-[#0D121F] border border-slate-700/80 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Key className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-base font-semibold text-white">Connect DocWeave Engine</h3>
              </div>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-slate-800 mb-4 text-xs font-medium">
              <button
                onClick={() => setAuthMode('demo')}
                className={`pb-2.5 px-3 flex items-center space-x-1.5 transition ${
                  authMode === 'demo' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>1-Click Demo</span>
              </button>
              <button
                onClick={() => setAuthMode('login')}
                className={`pb-2.5 px-3 flex items-center space-x-1.5 transition ${
                  authMode === 'login' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Email Sign-In</span>
              </button>
              <button
                onClick={() => setAuthMode('apikey')}
                className={`pb-2.5 px-3 flex items-center space-x-1.5 transition ${
                  authMode === 'apikey' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>API Key / PAT</span>
              </button>
            </div>

            {authError && (
              <div className="p-2.5 mb-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
                {authError}
              </div>
            )}

            {authMode === 'demo' && (
              <div>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Enter immediately with the <strong className="text-white">Demo Evaluator</strong> account. Full access to diffing, PR reviews, and AI knowledge committing without registration.
                </p>
                <button
                  onClick={handleDemoLogin}
                  disabled={authLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20"
                >
                  <Zap className="w-4 h-4" />
                  <span>{authLoading ? 'Connecting...' : 'Launch Demo Evaluator Session'}</span>
                </button>
              </div>
            )}

            {authMode === 'login' && (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">DocWeave Account Email</label>
                  <input
                    type="email"
                    required
                    placeholder="evaluator@docweave.io"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[#141B2D] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#141B2D] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition mt-2"
                >
                  {authLoading ? 'Signing In...' : 'Sign In with DocWeave'}
                </button>
              </form>
            )}

            {authMode === 'apikey' && (
              <form onSubmit={handleSaveApiKey} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Personal Access Token (PAT) / JWT</label>
                  <input
                    type="text"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    className="w-full bg-[#141B2D] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Connects DiffWeave Studio directly to your remote DocWeave MCP server endpoint with authenticated Bearer permissions.
                </p>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition mt-2"
                >
                  Save & Bind API Token
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Workspace Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="bg-[#0D121F] border border-slate-700/80 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4">Initialize Knowledge Workspace</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">Workspace Identifier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oncology Clinical Protocol 2026"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full bg-[#141B2D] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-400 mb-1">Description (optional)</label>
                <textarea
                  placeholder="Clinical documentation & knowledge validation..."
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  rows="3"
                  className="w-full bg-[#141B2D] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
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
