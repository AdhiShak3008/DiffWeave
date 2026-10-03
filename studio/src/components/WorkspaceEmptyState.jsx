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

  const wsId = workspace?.id || 'workspace-id';
  const token = typeof window !== 'undefined' ? localStorage.getItem('diffweave_token') || 'dw_pat_sample_token' : 'dw_pat_sample_token';

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

  const cliSnippet1 = `# 1. Install DiffWeave CLI (works on any system: macOS, Linux, Windows)
pip install git+https://github.com/AdhiShak3008/DiffWeave.git

# 2. Authenticate CLI session with your DocWeave credentials or token
dw login --email ${currentUser?.email || 'you@company.com'}
# Or with API token: dw login --token ${token ? token.slice(0, 16) + '...' : 'YOUR_TOKEN'}

# 3. Initialize this workspace locally in your document directory
dw init --workspace ${wsId}

# 4. Stage your documents or policy files for deterministic parsing
dw add ./policies/*.pdf

# 5. Run deterministic semantic diff & policy CI validation
dw diff

# 6. Commit & push verified knowledge to cloud
dw commit -m "Initial document ingestion"
dw push`;

  const cliSnippet2 = `# Push an existing document folder from any terminal
cd my-document-repo
dw init --workspace ${wsId}
dw add .
dw diff
dw commit -m "Add workspace documents"
dw push`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* GitHub-style Quick Setup Header Card */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-[#21262D]/70 border-b border-[#30363D] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Quick setup ? if you?ve done this kind of thing before</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Follow these commands to push documents into <strong className="text-slate-200">{workspace?.name || 'this workspace'}</strong> or upload directly below.
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

        {/* Cross-Platform Cloud Notice Banner */}
        <div className="mx-6 mt-6 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#0D1117] to-sky-950/30 border border-emerald-500/30 p-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xs font-bold text-white">Universal CLI & Multi-Platform Support</h4>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Remote Cloud Collaboration
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                These CLI commands are <strong>not restricted to this computer</strong>. Anyone on your team can install the CLI on their own machine, authenticate with their DocWeave account, and collaborate on this cloud workspace remotely. Changes, diffs, and commits reflect live in this Studio.
              </p>
              <div className="flex items-center space-x-2 pt-1 text-[11px] font-mono text-slate-400">
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                <span>Global install: <code className="text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded">pip install git+https://github.com/AdhiShak3008/DiffWeave.git</code></span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Section 1: Create a new document workspace on the command line */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">1</span>
                <span>Initialize and push documents using the DiffWeave CLI</span>
              </h4>
              <button
                onClick={() => copyToClipboard(cliSnippet1, 'cli1')}
                className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-emerald-400 transition bg-[#0D1117] hover:bg-[#161B22] px-3 py-1 rounded-md border border-[#30363D]"
              >
                {copiedId === 'cli1' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy commands</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-4 font-mono text-xs text-slate-200 overflow-x-auto shadow-inner leading-relaxed">
              <p className="text-slate-500"># 1. Install DiffWeave CLI (works on any system: macOS, Linux, Windows)</p>
              <p><span className="text-emerald-400 font-bold">pip</span> install git+https://github.com/AdhiShak3008/DiffWeave.git</p>
              <br />
              <p className="text-slate-500"># 2. Authenticate CLI session with your DocWeave account</p>
              <p><span className="text-emerald-400 font-bold">dw</span> login --email <span className="text-slate-300">{currentUser?.email || 'you@company.com'}</span></p>
              <p className="text-slate-500"># (or with token: dw login --token <span className="text-amber-300 font-semibold">{token ? token.slice(0, 16) + '...' : 'YOUR_TOKEN'}</span>)</p>
              <br />
              <p className="text-slate-500"># 3. Initialize this workspace locally in your document folder</p>
              <p><span className="text-emerald-400 font-bold">dw</span> init --workspace <span className="text-sky-300 font-semibold">{wsId}</span></p>
              <br />
              <p className="text-slate-500"># 4. Stage your documents or policy files for deterministic parsing</p>
              <p><span className="text-emerald-400 font-bold">dw</span> add ./policies/*.pdf</p>
              <br />
              <p className="text-slate-500"># 5. Run deterministic semantic diff & policy CI validation</p>
              <p><span className="text-emerald-400 font-bold">dw</span> diff</p>
              <br />
              <p className="text-slate-500"># 6. Commit & push verified knowledge to cloud master truth</p>
              <p><span className="text-emerald-400 font-bold">dw</span> commit -m <span className="text-teal-300 font-semibold">"Initial document ingestion"</span></p>
              <p><span className="text-emerald-400 font-bold">dw</span> push</p>
            </div>
          </div>

          {/* Section 2: Push an existing document repository */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">2</span>
                <span>?or push an existing document folder from any terminal</span>
              </h4>
              <button
                onClick={() => copyToClipboard(cliSnippet2, 'cli2')}
                className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-emerald-400 transition bg-[#0D1117] hover:bg-[#161B22] px-3 py-1 rounded-md border border-[#30363D]"
              >
                {copiedId === 'cli2' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy commands</span>
                  </>
                )}
              </button>
            </div>
            <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-3.5 font-mono text-xs text-slate-300 overflow-x-auto shadow-inner leading-relaxed">
              <p><span className="text-emerald-400 font-bold">cd</span> my-document-repo</p>
              <p><span className="text-emerald-400 font-bold">dw</span> init --workspace <span className="text-sky-300 font-semibold">{wsId}</span></p>
              <p><span className="text-emerald-400 font-bold">dw</span> add .</p>
              <p><span className="text-emerald-400 font-bold">dw</span> diff</p>
              <p><span className="text-emerald-400 font-bold">dw</span> commit -m <span className="text-teal-300 font-semibold">"Add workspace documents"</span></p>
              <p><span className="text-emerald-400 font-bold">dw</span> push</p>
            </div>
          </div>

          {/* Section 3: Browser Upload Dropzone */}
          <div className="space-y-3 pt-3 border-t border-[#30363D]">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-mono text-xs flex items-center justify-center font-bold">3</span>
              <span>?or populate directly in browser by uploading files</span>
            </h4>

            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-[#30363D] hover:border-emerald-500/70 bg-[#0D1117]/60 hover:bg-[#0D1117] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition group"
            >
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileDrop}
                accept=".pdf,.docx,.txt,.md,.csv,.json"
              />
              <div className="w-12 h-12 rounded-full bg-[#161B22] group-hover:bg-emerald-500/10 flex items-center justify-center mb-3 transition">
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 transition" />
              </div>
              <p className="text-sm font-semibold text-white">
                {uploading ? 'Staging & extracting deterministic facts...' : 'Drop files here or click to browse'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Supports PDF, DOCX, TXT, Markdown, CSV, and JSON. DiffWeave will instantly generate semantic diff proposals and policy CI checks.
              </p>
              {uploadSuccess && (
                <div className="mt-3 px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Files staged! Refreshing workspace...</span>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
