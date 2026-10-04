import React, { useState, useMemo } from 'react';
import {
  Terminal,
  Copy,
  Check,
  UploadCloud,
  FileText,
  GitBranch,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  Sparkles,
  ExternalLink,
  Code2,
  CheckCircle2,
  Globe,
  Layers,
  Cpu,
  Info,
  Search,
  Filter,
  Sliders,
  History,
  Activity,
  UserCheck,
  CheckSquare
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
  const [activeTab, setActiveTab] = useState('workflow'); // 'workflow' | 'all_commands'
  const [commandCategory, setCommandCategory] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Human-readable workspace name (unique identifier)
  const wsName = workspace?.name || 'my-workspace';

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
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // 1. Core Onboarding 7-Step Workflow
  const onboardingSteps = [
    {
      id: 'step_install',
      stepNum: '1',
      title: 'Install DiffWeave CLI',
      desc: 'Installs the dw command-line utility globally on your workstation via pip. Compatible across Windows, macOS, Linux, and automated CI/CD runners.',
      command: 'pip install git+https://github.com/AdhiShak3008/DiffWeave.git',
      details: 'Registers the dw binary in your system PATH with full support for semantic diffs, staging, and policy rules.'
    },
    {
      id: 'step_auth',
      stepNum: '2',
      title: 'Authenticate CLI Session',
      desc: 'Stores an authenticated session in ~/.diffweave/credentials.json. You can copy your personal API token anytime from the visible "Copy API Key" button in the Studio header.',
      command: 'dw login --token <YOUR_DIFFWEAVE_API_KEY>',
      details: 'Alternatively, sign in with your email and password via: dw login --email developer@example.com'
    },
    {
      id: 'step_dir',
      stepNum: '3',
      title: 'Create & Enter Local Document Directory',
      desc: 'Create a local folder on your filesystem to organize the specifications, policy files, or markdown documentation you want to track.',
      command: 'mkdir my-docs && cd my-docs',
      details: 'Navigating into a dedicated directory ensures DiffWeave tracks only the intended documentation files.'
    },
    {
      id: 'step_init',
      stepNum: '4',
      title: 'Initialize Workspace by Name',
      desc: `Binds your current directory to the "${wsName}" workspace by its unique name. No database UUIDs required.`,
      command: `dw init --workspace "${wsName}"`,
      details: 'Generates a local .diffweave/ configuration file binding this repository to the remote cloud workspace.'
    },
    {
      id: 'step_stage',
      stepNum: '5',
      title: 'Stage Documents for Parsing & Extraction',
      desc: 'Ingests your local documents into the deterministic parsing engine to extract verifiable facts, claims, and semantic relationships.',
      command: 'dw add ./sample_policy.txt',
      details: 'Supports PDF, DOCX, Markdown, and TXT files. The extraction pipeline automatically isolates facts and creates knowledge proposals.'
    },
    {
      id: 'step_diff',
      stepNum: '6',
      title: 'Inspect Semantic Fact Diff',
      desc: 'Computes a semantic delta comparing extracted claims against the Master Knowledge Register to detect additions, conflicts, and policy violations.',
      command: 'dw diff',
      details: 'Displays high-confidence facts, confidence scores, and potential contradictions with your current committed baseline.'
    },
    {
      id: 'step_push',
      stepNum: '7',
      title: 'Push Verified Knowledge to Cloud',
      desc: 'Commits approved knowledge proposals to the cloud Master Truth register, updating your Knowledge Graph and Studio in real time.',
      command: 'dw push',
      details: 'Synchronizes your local review state with the remote register, creating an immutable audit trail entry.'
    }
  ];

  // 2. Complete Reference of all 20 CLI Commands
  const allCommands = [
    // Lifecycle & Workspace
    {
      name: 'dw init',
      category: 'workspace',
      categoryLabel: 'Workspace & Setup',
      command: `dw init --workspace "${wsName}"`,
      desc: 'Initializes a local .diffweave/ project configuration and binds it to a workspace by name or UUID.',
      flags: '--workspace <name|id>, --create <name>'
    },
    {
      name: 'dw status',
      category: 'workspace',
      categoryLabel: 'Workspace & Setup',
      command: 'dw status',
      desc: 'Displays the local directory staging state, bound workspace details, and counts of pending review proposals.',
      flags: '--json'
    },
    {
      name: 'dw doctor',
      category: 'workspace',
      categoryLabel: 'Workspace & Setup',
      command: 'dw doctor',
      desc: 'Runs automated diagnostic health checks on FastMCP bridge connectivity, local configuration, and backend services.',
      flags: 'None'
    },
    {
      name: 'dw version',
      category: 'workspace',
      categoryLabel: 'Workspace & Setup',
      command: 'dw version',
      desc: 'Prints the currently installed version of the DiffWeave CLI tool.',
      flags: 'None'
    },

    // Authentication
    {
      name: 'dw login (token)',
      category: 'auth',
      categoryLabel: 'Authentication',
      command: 'dw login --token <YOUR_DIFFWEAVE_API_KEY>',
      desc: 'Authenticates a CLI session using your DiffWeave API bearer token and stores credentials in ~/.diffweave/credentials.json.',
      flags: '--token <jwt_token>, --url <mcp_endpoint>'
    },
    {
      name: 'dw login (email)',
      category: 'auth',
      categoryLabel: 'Authentication',
      command: 'dw login --email developer@example.com',
      desc: 'Authenticates with email and password interactively.',
      flags: '--email <email>, --password <pwd>'
    },
    {
      name: 'dw whoami',
      category: 'auth',
      categoryLabel: 'Authentication',
      command: 'dw whoami',
      desc: 'Displays current authenticated user username, email address, role, and the active workspace binding.',
      flags: '--json'
    },
    {
      name: 'dw logout',
      category: 'auth',
      categoryLabel: 'Authentication',
      command: 'dw logout',
      desc: 'Logs out of the current session and securely removes saved tokens from your local machine.',
      flags: 'None'
    },

    // Ingestion & Staging
    {
      name: 'dw add',
      category: 'ingestion',
      categoryLabel: 'Ingestion & Staging',
      command: 'dw add ./specifications/system-architecture.pdf',
      desc: 'Stages local documentation files (PDF, DOCX, Markdown, TXT) and triggers deterministic claim extraction.',
      flags: '--workspace <id>, --wait / --no-wait, --json'
    },
    {
      name: 'dw proposals',
      category: 'ingestion',
      categoryLabel: 'Ingestion & Staging',
      command: 'dw proposals',
      desc: 'Lists and inspects all extracted knowledge proposals (PRs) pending review for the current workspace.',
      flags: '--status <PENDING|APPROVED|REJECTED|ALL>, --json'
    },
    {
      name: 'dw diff',
      category: 'ingestion',
      categoryLabel: 'Ingestion & Staging',
      command: 'dw diff',
      desc: 'Computes a semantic fact delta comparing staged document claims against the committed Master Truth Register.',
      flags: '--workspace <id>, --json'
    },

    // Validation & Review
    {
      name: 'dw validate',
      category: 'validation',
      categoryLabel: 'Validation & CI/CD',
      command: 'dw validate --strict',
      desc: 'CI/CD policy compliance linter. Validates proposals against workspace policy rules; exits with code 1 on violations.',
      flags: '--strict / --no-strict, --proposal <id>, --json'
    },
    {
      name: 'dw review',
      category: 'validation',
      categoryLabel: 'Validation & CI/CD',
      command: 'dw review',
      desc: 'Launches an interactive terminal review wizard to inspect, approve, reject, or comment on pending fact proposals.',
      flags: '--proposal <id>'
    },
    {
      name: 'dw commit',
      category: 'validation',
      categoryLabel: 'Validation & CI/CD',
      command: 'dw commit -m "Approved Q3 regulatory compliance baseline"',
      desc: 'Commits approved knowledge proposals into the active workspace register with an audit message.',
      flags: '-m <message>, --proposal <id>, --all-approved, --json'
    },
    {
      name: 'dw push',
      category: 'validation',
      categoryLabel: 'Validation & CI/CD',
      command: 'dw push',
      desc: 'Publishes and synchronizes all staged and approved knowledge proposals to the cloud Master Truth register in real time.',
      flags: '-m <message>, --workspace <id>, --json'
    },

    // Knowledge Search & Audit
    {
      name: 'dw search',
      category: 'search',
      categoryLabel: 'Search & Audit',
      command: 'dw search "data retention policy 90 days"',
      desc: 'Performs hybrid lexical and vector semantic search across all verified facts and documents in the workspace.',
      flags: '--workspace <id>, --limit <n>, --json'
    },
    {
      name: 'dw log',
      category: 'search',
      categoryLabel: 'Search & Audit',
      command: 'dw log',
      desc: 'Displays the chronological, tamper-evident audit trail showing who staged, modified, or approved each claim.',
      flags: '--limit <n>, --json'
    },

    // Policy Rules Management
    {
      name: 'dw rules list',
      category: 'rules',
      categoryLabel: 'Policy Rules',
      command: 'dw rules list',
      desc: 'Lists all active and inactive policy rules, conditions, and enforcement levels configured for this workspace.',
      flags: '--json'
    },
    {
      name: 'dw rules add',
      category: 'rules',
      categoryLabel: 'Policy Rules',
      command: 'dw rules add --name "Require ISO Citation" --operator "must_contain" --condition "ISO-27001"',
      desc: 'Creates a new compliance lint rule to automatically check incoming document claims before merging.',
      flags: '--name <str>, --operator <str>, --condition <str>, --blocking'
    },
    {
      name: 'dw rules enable',
      category: 'rules',
      categoryLabel: 'Policy Rules',
      command: 'dw rules enable <RULE_ID>',
      desc: 'Activates an existing policy rule for strict evaluation during dw validate.',
      flags: '<rule_id>'
    },
    {
      name: 'dw rules disable',
      category: 'rules',
      categoryLabel: 'Policy Rules',
      command: 'dw rules disable <RULE_ID>',
      desc: 'Temporarily disables an active policy rule without deleting it from the registry.',
      flags: '<rule_id>'
    }
  ];

  // Filter commands by category and search keyword
  const filteredCommands = useMemo(() => {
    return allCommands.filter((cmd) => {
      const matchesCategory = commandCategory === 'all' || cmd.category === commandCategory;
      const matchesSearch =
        searchFilter.trim() === '' ||
        cmd.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        cmd.desc.toLowerCase().includes(searchFilter.toLowerCase()) ||
        cmd.command.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allCommands, commandCategory, searchFilter]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* GitHub-style Quick Setup Header Card */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-[#21262D]/70 border-b border-[#30363D] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">CLI Developer Workspace Setup</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Initialize this workspace in your local terminal using the steps below, or drag and drop files directly in the browser.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-[#161B22] border border-[#30363D] text-slate-300">
              Workspace: <span className="text-emerald-400 font-bold">{wsName}</span>
            </span>
            <button
              onClick={() => copyToClipboard(`dw init --workspace "${wsName}"`, 'init_badge')}
              className="p-1.5 rounded bg-[#21262D] hover:bg-[#30363D] text-slate-300 transition"
              title="Copy dw init command for this workspace"
            >
              {copiedId === 'init_badge' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Professional Enterprise Client Notice */}
        <div className="mx-6 mt-6 rounded-xl bg-gradient-to-r from-emerald-950/30 via-[#0D1117] to-sky-950/20 border border-emerald-500/20 p-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xs font-bold text-white">Cross-Platform Terminal Client</h4>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  CLI &bull; MCP &bull; Studio
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Install and run the DiffWeave CLI across any developer workstation, local environment, or CI/CD runner to stage documentation, inspect semantic diffs, and synchronize verified knowledge with the cloud register.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* View Mode Tabs: Workflow vs Full Reference */}
          <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('workflow')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  activeTab === 'workflow'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#21262D]'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Quickstart Workflow (7 Steps)</span>
              </button>

              <button
                onClick={() => setActiveTab('all_commands')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  activeTab === 'all_commands'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#21262D]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>All CLI Commands ({allCommands.length})</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Every command is individually copyable
            </span>
          </div>

          {/* VIEW 1: Onboarding 7-Step Workflow */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Standard Ingestion &amp; Review Workflow
                </h4>
              </div>

              <div className="space-y-3">
                {onboardingSteps.map((step) => {
                  const isCopied = copiedId === step.id;
                  return (
                    <div
                      key={step.id}
                      className="rounded-xl bg-[#0D1117] border border-[#30363D] hover:border-slate-600 transition p-4 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#161B22] border border-[#30363D] text-emerald-400">
                              Step {step.stepNum}
                            </span>
                            <h5 className="text-xs font-bold text-white">{step.title}</h5>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {step.desc}
                          </p>
                        </div>

                        {/* Dedicated Individual Copy Button */}
                        <button
                          onClick={() => copyToClipboard(step.command, step.id)}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                            isCopied
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                              : 'bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-slate-300 hover:text-white'
                          }`}
                          title="Copy command to clipboard"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy Command</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Code Snippet Box */}
                      <div className="rounded-lg bg-[#010409] border border-[#21262D] px-3.5 py-2.5 font-mono text-xs text-slate-200 overflow-x-auto select-all">
                        <code>{step.command}</code>
                      </div>

                      {/* Deep Feature Details */}
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-sans">
                        <Info className="w-3 h-3 text-sky-400 shrink-0" />
                        <span>{step.details}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: Complete CLI Command Reference (All 20 Commands) */}
          {activeTab === 'all_commands' && (
            <div className="space-y-4">
              {/* Category Filter Pills & Search */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {[
                      { id: 'all', label: 'All Commands' },
                      { id: 'workspace', label: 'Workspace' },
                      { id: 'auth', label: 'Authentication' },
                      { id: 'ingestion', label: 'Ingestion' },
                      { id: 'validation', label: 'Validation & CI' },
                      { id: 'search', label: 'Search & Audit' },
                      { id: 'rules', label: 'Policy Rules' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCommandCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-md transition font-medium ${
                          commandCategory === cat.id
                            ? 'bg-[#21262D] text-white border border-[#30363D]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search commands..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Grid of All Commands */}
              <div className="space-y-3">
                {filteredCommands.map((cmd, idx) => {
                  const isCopied = copiedId === `all_${idx}`;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl bg-[#0D1117] border border-[#30363D] hover:border-slate-600 transition p-4 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-emerald-400">
                              {cmd.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#161B22] border border-[#30363D] text-slate-400">
                              {cmd.categoryLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            {cmd.desc}
                          </p>
                        </div>

                        {/* Dedicated Individual Copy Button */}
                        <button
                          onClick={() => copyToClipboard(cmd.command, `all_${idx}`)}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                            isCopied
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                              : 'bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-slate-300 hover:text-white'
                          }`}
                          title="Copy command to clipboard"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy Command</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Code Snippet Box */}
                      <div className="rounded-lg bg-[#010409] border border-[#21262D] px-3.5 py-2 font-mono text-xs text-slate-200 overflow-x-auto select-all">
                        <code>{cmd.command}</code>
                      </div>

                      {cmd.flags && cmd.flags !== 'None' && (
                        <div className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
                          <span className="text-slate-400">Options:</span>
                          <span>{cmd.flags}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredCommands.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-500 font-mono">
                    No commands matching &quot;{searchFilter}&quot; in this category.
                  </div>
                )}
              </div>
            </div>
          )}

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
          <span>Need diagnostic information? Run <code className="text-emerald-400 font-mono">dw doctor</code> in your terminal</span>
          {onDismissEmptyState && (
            <button
              onClick={onDismissEmptyState}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition flex items-center space-x-1"
            >
              <span>Continue to Workspace Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
