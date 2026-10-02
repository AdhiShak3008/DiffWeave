import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  FileText,
  File,
  Terminal,
  GitBranch,
  History,
  Tag,
  Download,
  Copy,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldCheck,
  Network,
  Cpu,
  BookOpen
} from 'lucide-react';

export default function CodeOverview({ currentWorkspace, stats, onNavigateTab }) {
  const [showCloneDropdown, setShowCloneDropdown] = useState(false);
  const [copiedClone, setCopiedClone] = useState(false);
  const [copiedCliClone, setCopiedCliClone] = useState(false);

  const cloneUrl = 'https://github.com/AdhiShak3008/DiffWeave.git';
  const cliCloneCmd = `dw clone docweave://${currentWorkspace?.id || 'default'}`;

  const copyText = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'git') {
      setCopiedClone(true);
      setTimeout(() => setCopiedClone(false), 2000);
    } else {
      setCopiedCliClone(true);
      setTimeout(() => setCopiedCliClone(false), 2000);
    }
  };

  const files = [
    { name: 'diffweave', type: 'dir', msg: 'feat(mcp): align client convenience methods with DocWeave tool names', time: '12 mins ago' },
    { name: 'studio', type: 'dir', msg: 'feat(ui): MAANG-grade Studio UI and Hugging Face Docker ready', time: '28 mins ago' },
    { name: '.dockerignore', type: 'file', msg: 'build(docker): configure hugging face spaces deployment rules', time: '1 hour ago' },
    { name: 'Dockerfile', type: 'file', msg: 'build: multi-stage dockerfile with node18 + python3.10', time: '1 hour ago' },
    { name: 'README.md', type: 'file', msg: 'docs: add hugging face spaces metadata and architecture spec', time: '1 hour ago' },
    { name: 'dw.bat', type: 'file', msg: 'feat(cli): add windows terminal wrapper script', time: '2 hours ago' },
    { name: 'pyproject.toml', type: 'file', msg: 'chore: configure package dependencies and fastmcp bindings', time: '2 hours ago' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn">
      {/* Left 3 Columns: Git Header, File Tree & README */}
      <div className="lg:col-span-3 space-y-4">
        {/* Branch & Actions Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            {/* Branch Selector */}
            <div className="relative">
              <button className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-slate-200 font-semibold transition">
                <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                <span>main</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            <span className="flex items-center space-x-1 text-slate-400 font-mono text-[11px] px-2 py-1 bg-[#161B22] border border-[#30363D] rounded-md">
              <Tag className="w-3 h-3 text-emerald-400" />
              <span>v0.1.0</span>
            </span>

            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-medium">1 branch</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-medium">1 tag</span>
          </div>

          {/* Right Action: Green "Code" Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCloneDropdown(!showCloneDropdown)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#238636] hover:bg-[#2EA043] text-white font-semibold shadow transition"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Code</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Dropdown Menu */}
            {showCloneDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-[#161B22] border border-[#30363D] rounded-lg shadow-2xl p-4 space-y-3 z-30">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Clone Knowledge Repository</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                    FastMCP
                  </span>
                </div>

                {/* DiffWeave CLI Command */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold">DiffWeave CLI:</span>
                  <div className="flex items-center space-x-1 bg-[#0D1117] border border-[#30363D] rounded p-1.5 font-mono text-[11px] text-emerald-400">
                    <span className="flex-1 truncate">{cliCloneCmd}</span>
                    <button
                      onClick={() => copyText(cliCloneCmd, 'cli')}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      {copiedCliClone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Git Clone Command */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold">GitHub Git Repository:</span>
                  <div className="flex items-center space-x-1 bg-[#0D1117] border border-[#30363D] rounded p-1.5 font-mono text-[11px] text-slate-300">
                    <span className="flex-1 truncate">{cloneUrl}</span>
                    <button
                      onClick={() => copyText(cloneUrl, 'git')}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      {copiedClone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#30363D] text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Open in Terminal</span>
                  <span className="text-emerald-400 font-bold font-mono">dw pull</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GitHub Commit Summary Strip */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-t-lg p-3 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
              A
            </div>
            <span className="font-bold text-slate-200">AdhiShak3008</span>
            <span className="text-slate-300 truncate max-w-md">
              feat(ui): MAANG-grade Studio UI and Hugging Face Docker ready
            </span>
          </div>

          <div className="flex items-center space-x-3 text-slate-400 font-mono text-[11px] shrink-0">
            <span className="hover:text-emerald-400 cursor-pointer">c33dd31</span>
            <span>•</span>
            <span>14 mins ago</span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-slate-300 hover:text-white cursor-pointer font-sans font-bold">
              <History className="w-3.5 h-3.5" />
              <span>5 commits</span>
            </span>
          </div>
        </div>

        {/* File Table */}
        <div className="bg-[#0D1117] border-x border-b border-[#30363D] rounded-b-lg divide-y divide-[#21262D] text-xs">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#161B22]/60 transition">
              <div className="flex items-center space-x-2.5 w-1/3">
                {f.type === 'dir' ? (
                  <Folder className="w-4 h-4 text-sky-400 shrink-0" />
                ) : f.name.endsWith('.md') ? (
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <FileCode className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="text-slate-200 font-medium hover:text-sky-400 hover:underline cursor-pointer truncate">
                  {f.name}
                </span>
              </div>
              <div className="w-1/2 truncate text-slate-400 text-[11px]">
                {f.msg}
              </div>
              <div className="w-1/6 text-right text-slate-500 font-mono text-[11px] shrink-0">
                {f.time}
              </div>
            </div>
          ))}
        </div>

        {/* Rendered README Markdown Card */}
        <div className="bg-[#0D1117] border border-[#30363D] rounded-lg overflow-hidden shadow-xl">
          <div className="bg-[#161B22] border-b border-[#30363D] px-4 py-2.5 flex items-center space-x-2 text-xs font-bold text-slate-300">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>README.md</span>
          </div>

          <div className="p-6 md:p-8 space-y-6 text-slate-300 text-sm leading-relaxed">
            <div className="border-b border-[#21262D] pb-4">
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                <span>DiffWeave: Developer Platform for DocWeave</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Deterministic Git porcelain, semantic diff viewer, and policy CI linter for knowledge graph pipelines.
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                  FastMCP: 29 Tools Active
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-sky-500/10 text-sky-400 border border-sky-500/30 font-mono font-bold">
                  Docker: Port 7860
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono font-bold">
                  Hugging Face Spaces Ready
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold">
                  Policy-as-Code CI
                </span>
              </div>
            </div>

            {/* Architecture Overview */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">Architecture Decoupling</h3>
              <p className="text-xs text-slate-400">
                DiffWeave operates independently of DocWeave repository internals through standard Model Context Protocol (MCP) tool bindings.
              </p>
              <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-3 font-mono text-xs text-slate-300">
                <p className="text-emerald-400 font-bold">[DiffWeave CLI / Web Studio]</p>
                <p className="text-slate-500 pl-4">│  (HTTP / FastMCP JSON-RPC with Bearer Auth)</p>
                <p className="text-sky-400 font-bold pl-4">▼</p>
                <p className="text-sky-400 font-bold pl-4">[DocWeave FastMCP Server (29 Tools)]</p>
                <p className="text-slate-500 pl-8">│  (SQLite, Hybrid RAG, Knowledge DAG)</p>
                <p className="text-indigo-400 font-bold pl-8">▼</p>
                <p className="text-indigo-400 font-bold pl-8">[Deterministic Proposals & Knowledge Base]</p>
              </div>
            </div>

            {/* Quickstart commands */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">CLI Quickstart</h3>
              <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-3 font-mono text-xs space-y-1 text-slate-300">
                <p><span className="text-slate-500"># 1. Authenticate with DocWeave identity</span></p>
                <p className="text-emerald-400">$ dw login --demo</p>
                <p><span className="text-slate-500"># 2. Inspect active branch and status</span></p>
                <p className="text-emerald-400">$ dw whoami</p>
                <p><span className="text-slate-500"># 3. View semantic pull request diff</span></p>
                <p className="text-emerald-400">$ dw diff</p>
                <p><span className="text-slate-500"># 4. Run policy linter rules gate</span></p>
                <p className="text-emerald-400">$ dw rules</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: GitHub Sidebar (About, Releases, FastMCP Metrics) */}
      <div className="space-y-6 text-xs">
        {/* About Card */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white">About</h2>
          <p className="text-slate-400 leading-relaxed">
            Deterministic Git porcelain & semantic pull request platform for DocWeave knowledge graphs.
          </p>

          <div className="space-y-2 pt-1 text-slate-300">
            <div className="flex items-center space-x-2 text-slate-400 hover:text-emerald-400 cursor-pointer">
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="truncate">https://huggingface.co/spaces/docweave</span>
            </div>
          </div>

          {/* Topics */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {['docweave', 'fastmcp', 'semantic-diff', 'knowledge-graph', 'rag-ci-linter'].map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-[11px] font-medium border border-sky-500/20 cursor-pointer transition"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-[#30363D] pt-4 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Releases</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
              Latest
            </span>
          </h3>
          <div className="space-y-1">
            <p className="font-bold text-slate-200">v0.1.0-alpha</p>
            <p className="text-slate-500 text-[11px]">Hugging Face Spaces + FastMCP 29 Tools</p>
          </div>
        </div>

        {/* Knowledge Topology Counter */}
        <div className="border-t border-[#30363D] pt-4 space-y-3">
          <h3 className="text-sm font-bold text-white">Knowledge Topology</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Entities</span>
              </span>
              <span className="font-mono font-bold text-slate-200">{stats?.total_knowledge_items || 15}</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Pending PRs</span>
              </span>
              <span className="font-mono font-bold text-slate-200">{stats?.pending_proposals || 3}</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>FastMCP Tools</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">29 Active</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Navigation */}
        <div className="border-t border-[#30363D] pt-4 space-y-2">
          <button
            onClick={() => onNavigateTab('diff')}
            className="w-full py-2 px-3 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-slate-200 font-semibold text-xs transition flex items-center justify-between"
          >
            <span>Review Semantic Diff</span>
            <span className="font-mono text-emerald-400">→</span>
          </button>

          <button
            onClick={() => onNavigateTab('rules')}
            className="w-full py-2 px-3 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-slate-200 font-semibold text-xs transition flex items-center justify-between"
          >
            <span>Policy Rules CI</span>
            <span className="font-mono text-amber-400">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
