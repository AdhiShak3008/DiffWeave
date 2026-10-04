import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  UploadCloud,
  FileText,
  GitBranch,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Sparkles,
  ExternalLink,
  Code2,
  CheckCircle2,
  Globe,
  Laptop
} from 'lucide-react';

export default function WorkspaceEmptyState({
  workspace,
  currentUser,
  onUploadDocument,
  onRefresh,
  onDismissEmptyState
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [shellTab, setShellTab] = useState('cmd'); // 'cmd' | 'bash'

  const wsId = workspace?.id || 'workspace-id';
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('diffweave_token') || localStorage.getItem('token') || '')
    : '';

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await onUploadDocument(files[i]);
      }
      setUploadSuccess(true);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Commands without comments for direct pasting into terminal
  const cmdAll = `pip install git+https://github.com/AdhiShak3008/DiffWeave.git
dw login --token ${token || 'YOUR_API_TOKEN'}
mkdir my-docs
cd my-docs
dw init --workspace ${wsId}
dw add sample.pdf
dw diff
dw push`;

  const bashAll = `pip install git+https://github.com/AdhiShak3008/DiffWeave.git
dw login --token ${token || 'YOUR_API_TOKEN'}
mkdir -p my-docs && cd my-docs
dw init --workspace ${wsId}
dw add sample.pdf
dw diff
dw push`;

  const loginCmd = `dw login --token ${token || 'YOUR_API_TOKEN'}`;
  const initCmd = `dw init --workspace ${wsId}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* GitHub-style Quick Setup Header Card */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-[#21262D]/70 border-b border-[#30363D] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Quick setup &mdash; CLI Document Ingestion</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Follow these commands to push documents into <strong className="text-slate-200">{workspace?.name || 'this workspace'}</strong> or stage directly in the browser below.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-[#161B22] border border-[#30363D] text-slate-300">
              Workspace ID: <span className="text-emerald-400 font-bold">{wsId.slice(0, 8)}...</span>
            </span>
            <button
              onClick={() => copyToClipboard(wsId, 'wsid')}
              className="p-1.5 rounded bg-[#21262D] hover:bg-[#30363D] text-slate-300 transition"
              title="Copy full workspace ID"
            >
              {copiedId === 'wsid' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Universal Cross-Platform Notice */}
        <div className="mx-6 mt-6 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#0D1117] to-sky-950/30 border border-emerald-500/20 p-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xs font-bold text-white">Universal CLI & Multi-Platform Support</h4>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Cloud Synchronized
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                These CLI commands operate across <strong>Windows, macOS, and Linux</strong>. Documents pushed through the CLI immediately reconcile against your cloud Knowledge Register.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* CLI Instructions with Shell Selector */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">1</span>
                <span>Run in your local terminal</span>
              </h4>

              {/* Shell switcher & Copy All button */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-[#0D1117] border border-[#30363D] rounded-lg p-0.5 text-xs font-mono">
                  <button
                    onClick={() => setShellTab('cmd')}
                    className={`px-2.5 py-1 rounded transition ${
                      shellTab === 'cmd'
                        ? 'bg-[#21262D] text-emerald-400 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Windows CMD
                  </button>
                  <button
                    onClick={() => setShellTab('bash')}
                    className={`px-2.5 py-1 rounded transition ${
                      shellTab === 'bash'
                        ? 'bg-[#21262D] text-emerald-400 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    PowerShell / Bash
                  </button>
                </div>

                <button
                  onClick={() => copyToClipboard(shellTab === 'cmd' ? cmdAll : bashAll, 'cli_all')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-xs text-slate-300 hover:text-white transition font-medium"
                  title="Copy all commands sequentially"
                >
                  {copiedId === 'cli_all' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">All Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step-by-step Interactive Command Blocks */}
            <div className="space-y-2.5 font-mono text-xs">
              {/* Step 1: Install */}
              <div className="group rounded-lg bg-[#0D1117] border border-[#30363D] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5"># Step 1: Install CLI package globally</span>
                  <code><span className="text-emerald-400 font-bold">pip</span> install git+https://github.com/AdhiShak3008/DiffWeave.git</code>
                </div>
                <button
                  onClick={() => copyToClipboard('pip install git+https://github.com/AdhiShak3008/DiffWeave.git', 'c1')}
                  className="opacity-70 group-hover:opacity-100 p-1.5 rounded bg-[#161B22] hover:bg-[#21262D] text-slate-300 transition"
                  title="Copy command"
                >
                  {copiedId === 'c1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Step 2: Login */}
              <div className="group rounded-lg bg-[#0D1117] border border-[#30363D] p-3 flex items-center justify-between">
                <div className="truncate mr-2">
                  <span className="text-[11px] text-slate-500 block mb-0.5"># Step 2: Authenticate session with API token</span>
                  <code className="truncate block"><span className="text-emerald-400 font-bold">dw</span> login --token <span className="text-amber-300 font-mono">{token ? token.slice(0, 24) + '...' : 'YOUR_TOKEN'}</span></code>
                </div>
                <button
                  onClick={() => copyToClipboard(loginCmd, 'c2')}
                  className="opacity-70 group-hover:opacity-100 p-1.5 rounded bg-[#161B22] hover:bg-[#21262D] text-slate-300 transition shrink-0"
                  title="Copy full token login command"
                >
                  {copiedId === 'c2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Step 3: Create & Navigate Directory */}
              <div className="group rounded-lg bg-[#0D1117] border border-[#30363D] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5"># Step 3: Create a document directory and enter it</span>
                  <code>{shellTab === 'cmd' ? 'mkdir my-docs && cd my-docs' : 'mkdir -p my-docs && cd my-docs'}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(shellTab === 'cmd' ? 'mkdir my-docs && cd my-docs' : 'mkdir -p my-docs && cd my-docs', 'c3')}
                  className="opacity-70 group-hover:opacity-100 p-1.5 rounded bg-[#161B22] hover:bg-[#21262D] text-slate-300 transition"
                  title="Copy command"
                >
                  {copiedId === 'c3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Step 4: Init Workspace */}
              <div className="group rounded-lg bg-[#0D1117] border border-[#30363D] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5"># Step 4: Bind local folder to this workspace</span>
                  <code><span className="text-emerald-400 font-bold">dw</span> init --workspace <span className="text-sky-300 font-bold">{wsId}</span></code>
                </div>
                <button
                  onClick={() => copyToClipboard(initCmd, 'c4')}
                  className="opacity-70 group-hover:opacity-100 p-1.5 rounded bg-[#161B22] hover:bg-[#21262D] text-slate-300 transition"
                  title="Copy command"
                >
                  {copiedId === 'c4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Step 5: Add document */}
              <div className="group rounded-lg bg-[#0D1117] border border-[#30363D] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5"># Step 5: Stage documents for parsing &amp; fact extraction</span>
                  <code><span className="text-emerald-400 font-bold">dw</span> add <span className="text-teal-300">./your-document.pdf</span></code>
                </div>
                <button
                  onClick={() => copyToClipboard('dw add ./your-document.pdf', 'c5')}
                  className="opacity-70 group-hover:opacity-100 p-1.5 rounded bg-[#161B22] hover:bg-[#21262D] text-slate-300 transition"
                  title="Copy command"
                >
                  {copiedId === 'c5' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Step 6: Diff */}
              <div className="group rounded-lg bg-[#0D1117] border border-[#30363D] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5"># Step 6: Inspect semantic fact diff against Master Truth</span>
                  <code><span className="text-emerald-400 font-bold">dw</span> diff</code>
                </div>
                <button
                  onClick={() => copyToClipboard('dw diff', 'c6')}
                  className="opacity-70 group-hover:opacity-100 p-1.5 rounded bg-[#161B22] hover:bg-[#21262D] text-slate-300 transition"
                  title="Copy command"
                >
                  {copiedId === 'c6' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Step 7: Push */}
              <div className="group rounded-lg bg-[#0D1117] border border-[#30363D] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5"># Step 7: Commit &amp; push verified knowledge to cloud</span>
                  <code><span className="text-emerald-400 font-bold">dw</span> push</code>
                </div>
                <button
                  onClick={() => copyToClipboard('dw push', 'c7')}
                  className="opacity-70 group-hover:opacity-100 p-1.5 rounded bg-[#161B22] hover:bg-[#21262D] text-slate-300 transition"
                  title="Copy command"
                >
                  {copiedId === 'c7' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#30363D]" />
            <span className="flex-shrink mx-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">or upload directly via browser</span>
            <div className="flex-grow border-t border-[#30363D]" />
          </div>

          {/* Browser Drag and Drop Upload */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-[#30363D] hover:border-emerald-500/50 rounded-xl p-8 text-center bg-[#0D1117]/50 hover:bg-[#0D1117] transition cursor-pointer"
          >
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileDrop}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {uploading ? 'Processing documents...' : 'Drag and drop documents here, or browse files'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PDF, DOCX, Markdown, TXT. Documents will be immediately parsed with semantic fact extraction.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Dismiss / Continue Bar */}
        <div className="bg-[#21262D]/40 border-t border-[#30363D] px-6 py-3 flex items-center justify-between text-xs text-slate-400">
          <span>Need help? Check out our developer guide or run <code className="text-emerald-400 font-mono">dw doctor</code></span>
          {onDismissEmptyState && (
            <button
              onClick={onDismissEmptyState}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition"
            >
              Continue to Workspace Dashboard &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
