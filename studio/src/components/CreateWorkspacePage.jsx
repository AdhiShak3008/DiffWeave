import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FolderPlus,
  ShieldCheck,
  Lock,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Scale,
  Activity,
  Code2,
  Users,
  FileCheck2,
  FileText
} from 'lucide-react';
import { PARENT_CATEGORIES, TEMPLATES_CATALOG, getTemplateMeta } from '../data/templates';

const ICONS = {
  Scale,
  Activity,
  Code2,
  Users,
  ShieldCheck,
  FolderPlus
};

export default function CreateWorkspacePage({ onCreateWorkspace, workspaces, currentUser }) {
  const navigate = useNavigate();
  const username = currentUser?.username || currentUser?.email?.split('@')[0] || 'adhi';

  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [selectedParent, setSelectedParent] = useState('legal_title');
  const [starterTemplate, setStarterTemplate] = useState('title-insurance');
  const [wsVisibility, setWsVisibility] = useState('private');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const suggestedName = `${starterTemplate}-vault-${Math.floor(100 + Math.random() * 900)}`;

  const handleSelectParent = (parentId) => {
    setSelectedParent(parentId);
    const firstChild = Object.values(TEMPLATES_CATALOG).find((c) => c.parentId === parentId);
    if (firstChild) {
      handleSelectChildTemplate(firstChild.id);
    }
  };

  const handleSelectChildTemplate = (childId) => {
    setStarterTemplate(childId);
    const tmpl = TEMPLATES_CATALOG[childId] || TEMPLATES_CATALOG['empty'];
    if (tmpl.defaultVisibility) {
      setWsVisibility(tmpl.defaultVisibility);
    }
    if (!wsDesc) {
      setWsDesc(tmpl.description);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const finalName = (wsName.trim() || suggestedName).trim();

    if (!finalName) {
      setErrorMsg('Workspace name is required.');
      return;
    }

    const isDuplicate = (workspaces || []).some(
      (w) => w.name && w.name.trim().toLowerCase() === finalName.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMsg(`A workspace named "${finalName}" already exists. Please choose a unique name.`);
      return;
    }

    setLoading(true);
    try {
      const currentTmpl = TEMPLATES_CATALOG[starterTemplate] || TEMPLATES_CATALOG['empty'];
      const finalDesc = wsDesc.trim() || currentTmpl.description || 'DiffWeave verified knowledge repository.';
      await onCreateWorkspace(finalName, finalDesc, starterTemplate, wsVisibility);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create workspace. Please try again.');
      setLoading(false);
    }
  };

  const activeTemplateObj = TEMPLATES_CATALOG[starterTemplate] || TEMPLATES_CATALOG['empty'];

  return (
    <div className="min-h-screen bg-[#010409] text-slate-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Link
            to="/"
            className="flex items-center space-x-1.5 text-slate-400 hover:text-white transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Workspaces</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-white font-semibold">New</span>
        </div>

        {/* Page Header */}
        <div className="pb-6 border-b border-[#21262D] space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/20">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Create a new workspace</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                A workspace contains tracked documents, 3-way semantic diffs, master truth facts, and automated policy CI quality gates.
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center space-x-3 shadow-lg">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: General Details */}
          <div className="bg-[#0D1117] border border-[#30363D] rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center justify-center border border-emerald-500/30">
                1
              </span>
              <span>General Settings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              {/* Owner Badge */}
              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Owner <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-[#161B22] border border-[#30363D] text-white">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                    {username[0]?.toUpperCase() || 'A'}
                  </div>
                  <span className="font-semibold text-xs truncate">{username}</span>
                </div>
              </div>

              <div className="hidden sm:flex sm:col-span-1 justify-center items-center pb-2.5 text-slate-600 font-bold text-lg">
                /
              </div>

              {/* Workspace Name Input */}
              <div className="sm:col-span-7 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Workspace name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder={suggestedName}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#161B22] border border-[#30363D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center space-x-1">
              <span>Suggested name:</span>
              <button
                type="button"
                onClick={() => setWsName(suggestedName)}
                className="text-emerald-400 font-semibold hover:underline cursor-pointer"
              >
                {suggestedName}
              </button>
            </p>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Description (optional)</label>
                <span className="text-[10px] text-slate-500">{wsDesc.length} / 350 characters</span>
              </div>
              <textarea
                rows={2}
                maxLength={350}
                value={wsDesc}
                onChange={(e) => setWsDesc(e.target.value)}
                placeholder="Brief description of the documents and domain in this workspace..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#161B22] border border-[#30363D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none transition"
              />
            </div>

            {/* Visibility Mode Selector */}
            <div className="space-y-2 pt-2 border-t border-[#21262D]">
              <label className="text-xs font-semibold text-slate-300 block">Workspace Visibility</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setWsVisibility('private')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                    wsVisibility === 'private'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm shadow-emerald-500/10'
                      : 'border-[#30363D] bg-[#161B22] hover:border-slate-600'
                  }`}
                >
                  <Lock className={`w-4 h-4 mt-0.5 shrink-0 ${wsVisibility === 'private' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-bold text-white block">Private Workspace</span>
                    <span className="text-[11px] text-slate-400 block pt-0.5 leading-snug">
                      Only invited collaborators can access tracked documents, PRs, and truth items.
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setWsVisibility('public')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                    wsVisibility === 'public'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm shadow-emerald-500/10'
                      : 'border-[#30363D] bg-[#161B22] hover:border-slate-600'
                  }`}
                >
                  <Globe className={`w-4 h-4 mt-0.5 shrink-0 ${wsVisibility === 'public' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-bold text-white block">Public Workspace</span>
                    <span className="text-[11px] text-slate-400 block pt-0.5 leading-snug">
                      Anyone can view verified knowledge and query the deterministic truth register.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Domain Archetype & Specialized Template */}
          <div className="bg-[#0D1117] border border-[#30363D] rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
            <div className="flex items-center justify-between text-white font-bold text-sm">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center justify-center border border-emerald-500/30">
                  2
                </span>
                <span>Domain Archetype & Specialized Template</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Domain Quality Gates</span>
            </div>

            {/* TIER 1: Parent Domain Categories */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                1. Select Parent Domain:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PARENT_CATEGORIES.map((cat) => {
                  const isSelected = selectedParent === cat.id;
                  const IconComp = ICONS[cat.icon] || FolderPlus;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectParent(cat.id)}
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-sm shadow-emerald-500/20'
                          : 'border-[#30363D] bg-[#161B22] text-slate-400 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {cat.name}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {cat.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block leading-tight">
                        {cat.tagline}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TIER 2: Child Templates */}
            <div className="space-y-2 pt-3 border-t border-[#21262D]">
              <label className="text-xs font-semibold text-slate-300 block">
                2. Choose a specialized template:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.values(TEMPLATES_CATALOG)
                  .filter((tmpl) => tmpl.parentId === selectedParent)
                  .map((tmpl) => {
                    const isSelected = starterTemplate === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleSelectChildTemplate(tmpl.id)}
                        className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-sm shadow-emerald-500/10'
                            : 'border-[#30363D] bg-[#161B22] text-slate-400 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        <div className="flex items-start justify-between w-full gap-2">
                          <div>
                            <span className="font-bold text-slate-200 block text-xs">{tmpl.name}</span>
                            <span className="text-[11px] text-slate-400 block pt-0.5 leading-snug">{tmpl.tagline}</span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 ${
                              tmpl.defaultVisibility === 'private'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                            }`}
                          >
                            {tmpl.defaultVisibility === 'private' ? '🔒 Private' : '🌍 Public'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/80">
                          <span className="text-emerald-400 font-semibold font-mono">
                            {tmpl.policyRules?.length || 0} Policy CI Rules
                          </span>
                          <span className="text-slate-500 font-mono">
                            {(tmpl.recommendedFiles || []).join(', ')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* LIVE POLICY RULE INSPECTOR */}
            {activeTemplateObj && (
              <div className="bg-[#141B2D]/70 border border-slate-700/80 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-white text-xs font-mono uppercase tracking-wider">
                      Pre-Configured Policy as Code CI Suite:
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {activeTemplateObj.policyRules?.length || 0} Active Guardrails
                  </span>
                </div>

                <div className="space-y-2 pt-1 font-mono">
                  {(activeTemplateObj.policyRules || []).map((rule) => (
                    <div
                      key={rule.id}
                      className="p-2.5 rounded-lg bg-[#0D121F] border border-slate-800 flex items-center justify-between text-[11px]"
                    >
                      <div className="space-y-0.5 pr-2">
                        <span className="text-white font-medium block">{rule.name}</span>
                        <span className="text-slate-400 font-sans text-[11px] block">{rule.description}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          rule.is_blocking
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {rule.is_blocking ? 'BLOCKING GATE' : 'ADVISORY'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Submit & Cancel Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl border border-[#30363D] hover:bg-[#161B22] text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#238636] hover:bg-[#2EA043] disabled:opacity-50 text-white text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-emerald-900/30"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Workspace & Seeding Rules...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
