import React, { useState, useEffect } from 'react';
import {
  Lock,
  Globe,
  Users,
  UserPlus,
  Shield,
  Trash2,
  CheckCircle2,
  Copy,
  Key,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';

export default function AccessManagementModal({ workspace, isOpen, onClose, onWorkspaceUpdated }) {
  const [accessData, setAccessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibility, setVisibility] = useState(workspace?.visibility || 'private');
  const [savingVis, setSavingVis] = useState(false);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('EDITOR');
  const [inviting, setInviting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Scoped Token state
  const [generatedToken, setGeneratedToken] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (isOpen && workspace?.id) {
      loadAccess();
    }
  }, [isOpen, workspace?.id]);

  const loadAccess = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.getWorkspaceAccess(workspace.id);
      setAccessData(data);
      setVisibility(data.visibility || 'private');
    } catch (err) {
      setErrorMsg(`Could not load access data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityChange = async (newVis) => {
    if (newVis === visibility) return;
    setSavingVis(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.updateWorkspaceVisibility(workspace.id, newVis);
      setVisibility(newVis);
      setSuccessMsg(`Workspace is now ${newVis.toUpperCase()}.`);
      if (onWorkspaceUpdated) {
        onWorkspaceUpdated({ ...workspace, visibility: newVis });
      }
    } catch (err) {
      setErrorMsg(`Failed to update visibility: ${err.message}`);
    } finally {
      setSavingVis(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.addWorkspaceMember(workspace.id, inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setSuccessMsg(`Collaborator added successfully.`);
      await loadAccess();
    } catch (err) {
      setErrorMsg(`Could not add collaborator: ${err.message}`);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await api.removeWorkspaceMember(workspace.id, memberId);
      setSuccessMsg('Collaborator removed.');
      await loadAccess();
    } catch (err) {
      setErrorMsg(`Failed to remove: ${err.message}`);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await api.updateWorkspaceMemberRole(workspace.id, memberId, newRole);
      setSuccessMsg(`Role updated to ${newRole}.`);
      await loadAccess();
    } catch (err) {
      setErrorMsg(`Failed to update role: ${err.message}`);
    }
  };

  const handleGenerateToken = () => {
    const token = `dw_ws_${workspace.id.replace(/-/g, '').slice(0, 12)}_${Math.random().toString(36).substring(2, 10)}`;
    setGeneratedToken(token);
    setCopiedToken(false);
  };

  const handleCopyToken = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0C101A] border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0F1422]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Manage Workspace Access</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {workspace?.name}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Control who can query, commit changes, and review Knowledge PRs in this repository.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Visibility Controls */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono block">
              Workspace Visibility
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleVisibilityChange('private')}
                disabled={savingVis}
                className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
                  visibility === 'private'
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/10'
                    : 'border-slate-800 bg-[#121726] hover:border-slate-700 text-slate-400'
                }`}
              >
                <Lock className={`w-4 h-4 mt-0.5 shrink-0 ${visibility === 'private' ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-white">Private</span>
                    {visibility === 'private' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Strictly locked. Only you and invited collaborators can view facts, query truth, or stage documents.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleVisibilityChange('public')}
                disabled={savingVis}
                className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
                  visibility === 'public'
                    ? 'border-sky-500 bg-sky-500/10 shadow-sm shadow-sky-500/10'
                    : 'border-slate-800 bg-[#121726] hover:border-slate-700 text-slate-400'
                }`}
              >
                <Globe className={`w-4 h-4 mt-0.5 shrink-0 ${visibility === 'public' ? 'text-sky-400' : 'text-slate-500'}`} />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-white">Public</span>
                    {visibility === 'public' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Open to world. Anyone can search verified knowledge and submit draft PRs; only owners can merge.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Invite Collaborators */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono block">
              Invite Collaborators
            </label>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="flex-1 bg-[#121726] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="bg-[#121726] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ADMIN">Admin (Full Control)</option>
                <option value="EDITOR">Editor (Stage & Review PRs)</option>
                <option value="VIEWER">Viewer (Read-Only)</option>
              </select>
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{inviting ? 'Inviting...' : 'Add Member'}</span>
              </button>
            </form>
          </div>

          {/* Section 3: Collaborators List */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Active Members ({(accessData?.members?.length || 0) + 1})
              </label>
              <button
                type="button"
                onClick={loadAccess}
                className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-[#121726] overflow-hidden text-xs">
              {/* Workspace Owner */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                    {(accessData?.owner?.username || 'O')[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-white block">
                      {accessData?.owner?.username || 'Workspace Owner'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {accessData?.owner?.email || 'owner@diffweave.io'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  OWNER
                </span>
              </div>

              {/* Invited Members */}
              {(accessData?.members || []).map((m) => (
                <div key={m.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs">
                      {m.email[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200 block">{m.email}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Added {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'recently'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={m.role}
                      onChange={(e) => handleUpdateRole(m.id, e.target.value)}
                      className="bg-[#0C101A] border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="EDITOR">Editor</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                      title="Remove Collaborator"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {(accessData?.members || []).length === 0 && (
                <div className="p-3 text-center text-slate-500 text-[11px]">
                  No additional collaborators added yet. Invite coworkers above to pair on this workspace.
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Scoped API Access Tokens for AI & CLI */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scoped Access Token (MCP & CLI)</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Generate a dedicated workspace token for Claude, Cursor, or terminal CI pipelines.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateToken}
                className="px-3 py-1.5 rounded-lg bg-[#141B2D] hover:bg-[#1E2740] border border-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                + Generate Token
              </button>
            </div>

            {generatedToken && (
              <div className="p-3 rounded-xl bg-[#141B2D] border border-slate-700/80 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-emerald-300 truncate">
                  {generatedToken}
                </span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedToken ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#0F1422] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
