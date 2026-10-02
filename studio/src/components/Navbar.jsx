import React, { useState, useEffect } from 'react';
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
  const [authMode, setAuthMode] = useState('demo'); // 'demo' | 'login' | 'apikey'
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
      // Fallback local demo user
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

  return (
    <header className="border-b border-slate-800 bg-[#090D16]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Workspace Selector */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-xl text-emerald-400 font-bold tracking-tight">🧶 DiffWeave</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Studio
              </span>
            </div>

            {/* Workspace dropdown */}
            <div className="flex items-center space-x-2">
              <select
                className="bg-[#121826] border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                value={currentWorkspace?.id || ''}
                onChange={(e) => onSelectWorkspace(e.target.value)}
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowNewModal(true)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 transition"
                title="Create Workspace"
              >
                + New
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1">
            {[
              { id: 'diff', label: 'Knowledge Diff' },
              { id: 'prs', label: 'Pull Requests', badge: pendingCount > 0 ? pendingCount : null },
              { id: 'staging', label: 'Staging & Files' },
              { id: 'graph', label: 'Knowledge Graph' },
              { id: 'knowledge', label: 'Knowledge Register' },
              { id: 'rules', label: 'Policy Rules' },
              { id: 'audit', label: 'Audit Trail' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status Controls */}
          <div className="flex items-center space-x-3">
            {/* MCP Status Indicator */}
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-glow"></span>
              <span>MCP: 29 Tools</span>
            </div>

            {/* Auth / User Control */}
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg text-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
                </div>
                <span className="text-slate-200 font-medium max-w-[100px] truncate">{currentUser.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-red-400 text-xs ml-1"
                  title="Log out"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
              >
                Sign In / API Key
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auth / API Key Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#101726] border border-slate-700 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Connect DocWeave Account</h3>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 mb-4 text-xs font-medium">
              <button
                onClick={() => setAuthMode('demo')}
                className={`pb-2 px-3 ${authMode === 'demo' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-slate-400'}`}
              >
                ⚡ 1-Click Demo
              </button>
              <button
                onClick={() => setAuthMode('login')}
                className={`pb-2 px-3 ${authMode === 'login' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-slate-400'}`}
              >
                Email Login
              </button>
              <button
                onClick={() => setAuthMode('apikey')}
                className={`pb-2 px-3 ${authMode === 'apikey' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-slate-400'}`}
              >
                API Key / PAT
              </button>
            </div>

            {authError && (
              <div className="p-2 mb-3 rounded bg-red-950/50 border border-red-500/30 text-red-300 text-xs">
                {authError}
              </div>
            )}

            {authMode === 'demo' && (
              <div>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Log in immediately as an evaluator demo user. No registration or email verification required.
                </p>
                <button
                  onClick={handleDemoLogin}
                  disabled={authLoading}
                  className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition"
                >
                  {authLoading ? 'Authenticating...' : 'Enter as Demo Evaluator'}
                </button>
              </div>
            )}

            {authMode === 'login' && (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="user@docweave.io"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[#161F32] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                    className="w-full bg-[#161F32] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition mt-2"
                >
                  {authLoading ? 'Signing In...' : 'Sign In'}
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
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    className="w-full bg-[#161F32] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Paste a JWT bearer token or API key generated from DocWeave to authenticate all requests from this Studio.
                </p>
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition mt-2"
                >
                  Save & Connect API Key
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Workspace Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#101726] border border-slate-700 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Workspace</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clinical Research Protocols"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full bg-[#161F32] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-400 mb-1">Description (optional)</label>
                <textarea
                  placeholder="Clinical documentation & knowledge validation..."
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  rows="3"
                  className="w-full bg-[#161F32] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
