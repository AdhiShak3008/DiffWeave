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
  CheckCircle2
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

  const cliSnippet1 = `# 1. Install or upgrade the DiffWeave CLI
pip install diffweave

# 2. Authenticate CLI session with your token
diffweave login --token ` + (token ? token.slice(0, 16) + '...' : 'YOUR_TOKEN') + `

# 3. Initialize this workspace locally in your document directory
diffweave init --workspace ` + wsId + `

# 4. Stage your documents or policy files for deterministic parsing
diffweave add ./policies/*.pdf

# 5. Run deterministic semantic diff & policy CI validation
diffweave diff

# 6. Commit & push verified knowledge to main
diffweave commit -m "Initial document ingestion"
diffweave push`;

  const cliSnippet2 = `# Push an existing local folder or document collection
cd my-document-repo
diffweave remote add origin https://diff-weave.vercel.app/api/workspaces/` + wsId + `
diffweave branch -M main
diffweave push -u origin main`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-[#161B22] to-sky-950/40 border border-emerald-500/30 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Workspace is empty</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Populate <span className="text-emerald-300 font-semibold">{workspace?.name || 'this workspace'}</span> with documents to start generating deterministic knowledge diffs, policy rules, and PRs.
            </p>
          </div>
        </div>
        {onDismissEmptyState && (
          <button
            onClick={onDismissEmptyState}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-slate-300 transition whitespace-nowrap self-start sm:self-auto font-medium"
          >
            Explore Empty Studio Tabs &rarr;
          </button>
        )}
      </div>

      {/* GitHub-style Quick Setup Terminal Box */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-[#010409] px-6 py-4 border-b border-[#30363D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-white font-bold text-base">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <span>Quick setup — if you've done this kind of thing before</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Get started by using the DiffWeave CLI, pushing existing documents, or uploading files directly below.
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
              <p className="text-slate-500"># 1. Install or upgrade the DiffWeave CLI</p>
              <p><span className="text-emerald-400 font-bold">pip</span> install diffweave</p>
              <br />
              <p className="text-slate-500"># 2. Authenticate CLI session with your Personal Access Token</p>
              <p><span className="text-emerald-400 font-bold">diffweave</span> login --token <span className="text-amber-300 font-semibold">{token ? token.slice(0, 20) + '...' : 'YOUR_TOKEN'}</span></p>
              <br />
              <p className="text-slate-500"># 3. Initialize this workspace locally in your document folder</p>
              <p><span className="text-emerald-400 font-bold">diffweave</span> init --workspace <span className="text-sky-300 font-semibold">{wsId}</span></p>
              <br />
              <p className="text-slate-500"># 4. Stage your documents or policy files for deterministic parsing</p>
              <p><span className="text-emerald-400 font-bold">diffweave</span> add ./policies/*.pdf</p>
              <br />
              <p className="text-slate-500"># 5. Run deterministic semantic diff & policy CI validation</p>
              <p><span className="text-emerald-400 font-bold">diffweave</span> diff</p>
              <br />
              <p className="text-slate-500"># 6. Commit & push verified knowledge to main</p>
              <p><span className="text-emerald-400 font-bold">diffweave</span> commit -m <span className="text-teal-300 font-semibold">"Initial document ingestion"</span></p>
              <p><span className="text-emerald-400 font-bold">diffweave</span> push</p>
            </div>
          </div>

          {/* Section 2: Push an existing document repository */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">2</span>
                <span>…or push an existing document repository from the command line</span>
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
              <p><span className="text-emerald-400 font-bold">diffweave</span> remote add origin https://diff-weave.vercel.app/api/workspaces/{wsId}</p>
              <p><span className="text-emerald-400 font-bold">diffweave</span> branch -M main</p>
              <p><span className="text-emerald-400 font-bold">diffweave</span> push -u origin main</p>
            </div>
          </div>

          {/* Section 3: Browser Upload Dropzone */}
          <div className="space-y-3 pt-3 border-t border-[#30363D]">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-mono text-xs flex items-center justify-center font-bold">3</span>
              <span>…or populate directly in browser by uploading files</span>
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
