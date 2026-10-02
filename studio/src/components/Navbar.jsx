import React, { useState } from 'react';

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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    await onCreateWorkspace(newWsName.trim(), newWsDesc.trim());
    setNewWsName('');
    setNewWsDesc('');
    setShowNewModal(false);
  };

  const pendingCount = stats?.pending_proposals || 0;

  return (
    <header className="border-b border-slate-800 bg-[#090D16]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Workspace Selector */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-xl text-emerald-400 font-bold tracking-tight">◈ DiffWeave</span>
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

          {/* MCP Status Indicator */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-glow"></span>
              <span>MCP: 29 Tools</span>
            </div>
          </div>
        </div>
      </div>

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
                  className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Workspace purpose or project notes"
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg font-semibold"
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
