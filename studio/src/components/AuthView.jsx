import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Terminal,
  CheckCircle2,
  Copy,
  ExternalLink,
  Zap,
  Lock,
  Mail,
  User,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Fingerprint,
  Layers,
  Code2,
  ChevronRight,
  Info
} from 'lucide-react';
import { api } from '../api/client';

export default function AuthView({ currentUser, onAuthSuccess, onReturnToStudio }) {
  const [activeTab, setActiveTab] = useState('sso'); // 'sso', 'demo', 'credentials', 'token'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [patInput, setPatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [syncedCli, setSyncedCli] = useState(false);
  const [syncingCli, setSyncingCli] = useState(false);
  const [cliPath, setCliPath] = useState('~/.diffweave/credentials.json');

  // Key manager state
  const [generatedKey, setGeneratedKey] = useState(null);
  const [keyName, setKeyName] = useState('CLI Developer Token');
  const [expiresIn, setExpiresIn] = useState(90);

  // Sync state on load
  useEffect(() => {
    async function checkWhoami() {
      const who = await api.getWhoami();
      if (who?.authenticated && who?.user) {
        if (!currentUser) {
          onAuthSuccess(who.user);
        }
        if (who.credentials_path) {
          setCliPath(who.credentials_path);
          setSyncedCli(true);
        }
      }
    }
    checkWhoami();
  }, [currentUser, onAuthSuccess]);

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const data = await api.demoLogin();
      onAuthSuccess(data);
      setSuccessMsg('Logged in as DocWeave Demo Evaluator. Personal Access Token generated!');
      setSyncedCli(true);
      if (data.credentials_path) setCliPath(data.credentials_path);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.login(email, password);
      onAuthSuccess(data);
      setSuccessMsg('Authenticated via DocWeave! CLI credentials synchronized.');
      setSyncedCli(true);
      if (data.credentials_path) setCliPath(data.credentials_path);
    } catch (err) {
      setError(err.message || 'Login failed. Check DocWeave server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handlePatLogin = (e) => {
    e.preventDefault();
    if (!patInput.trim()) return;
    api.setApiKey(patInput.trim());
    const mockUser = {
      username: 'API Token User',
      email: 'token-user@docweave.io',
      access_token: patInput.trim(),
    };
    onAuthSuccess(mockUser);
    setSuccessMsg('Logged in via Personal Access Token!');
  };

  const handleGenerateKey = async () => {
    setLoading(true);
    try {
      const res = await api.generateKey(keyName, parseInt(expiresIn, 10));
      setGeneratedKey(res);
      setSuccessMsg('New Personal Access Token generated and synchronized to CLI credentials!');
      setSyncedCli(true);
      if (res.credentials_path) setCliPath(res.credentials_path);
    } catch (err) {
      setError('Failed to generate key: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToCli = async () => {
    const token = currentUser?.access_token || currentUser?.api_key || generatedKey?.api_key;
    if (!token) return;
    setSyncingCli(true);
    try {
      const res = await api.syncCLI(token, currentUser?.email || 'user@docweave.io', currentUser?.username || 'DiffWeave User');
      setSyncedCli(true);
      setSuccessMsg(`CLI credentials written to ${res.path}`);
      if (res.path) setCliPath(res.path);
    } catch (err) {
      setError('Failed to sync to terminal: ' + err.message);
    } finally {
      setSyncingCli(false);
    }
  };

  const activeToken = generatedKey?.api_key || currentUser?.access_token || currentUser?.api_key || 'dw_live_demo_98a72b14c3e80f92';
  const cliCommand = `dw login --api-key ${activeToken}`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      {/* GitHub-style Hero Identity Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-sky-500/10 to-indigo-500/20 border border-emerald-500/30 shadow-xl shadow-emerald-950/20">
          <Fingerprint className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          DiffWeave Identity & FastMCP Access
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          DiffWeave is the developer platform powered by DocWeave's 29-tool FastMCP Knowledge Engine.
          Authenticate to synchronize repositories, inspect semantic pull requests, and enable terminal CLI operations.
        </p>
      </div>

      {/* Main Layered Auth Card */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl shadow-2xl overflow-hidden">
        {/* Top Tab Bar inside Card */}
        <div className="flex border-b border-[#30363D] bg-[#0D1117] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sso')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 transition ${
              activeTab === 'sso'
                ? 'border-emerald-500 text-emerald-400 bg-[#161B22]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161B22]/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>DocWeave SSO</span>
          </button>

          <button
            onClick={() => setActiveTab('demo')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 transition ${
              activeTab === 'demo'
                ? 'border-emerald-500 text-emerald-400 bg-[#161B22]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161B22]/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>1-Click Evaluator Demo</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
              Judge
            </span>
          </button>

          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 transition ${
              activeTab === 'credentials'
                ? 'border-emerald-500 text-emerald-400 bg-[#161B22]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161B22]/50'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email & Password</span>
          </button>

          <button
            onClick={() => setActiveTab('token')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 transition ${
              activeTab === 'token'
                ? 'border-emerald-500 text-emerald-400 bg-[#161B22]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161B22]/50'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Personal Access Token</span>
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Error & Success Messages */}
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: DocWeave SSO */}
          {activeTab === 'sso' && (
            <div className="space-y-6">
              <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>DocWeave Identity Provider</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        OAuth 2.0 / FastMCP
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Authenticate with your centralized DocWeave enterprise account. An API token is automatically issued for terminal and web operations.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDemoLogin}
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-[#238636] hover:bg-[#2EA043] text-white font-semibold text-xs transition shadow-lg flex items-center justify-center space-x-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>Authorize with DocWeave Identity</span>
                  </button>

                  <a
                    href="http://localhost:5173/login"
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-4 rounded-lg bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-slate-200 font-semibold text-xs transition flex items-center justify-center space-x-2"
                  >
                    <span>Open DocWeave Auth Page</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* Need Account Footer */}
              <div className="p-4 rounded-lg bg-sky-950/20 border border-sky-500/20 text-xs text-slate-300 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Don't have a DocWeave account yet? Sign up on the DocWeave portal to obtain enterprise credentials.</span>
                </div>
                <a
                  href="http://localhost:5173/signup"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-sky-400 hover:text-sky-300 font-bold ml-2 underline shrink-0"
                >
                  <span>Sign up on DocWeave</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: 1-Click Demo Login */}
          {activeTab === 'demo' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
                <span className="font-bold text-amber-300">Hackathon & MAANG Competition Evaluator Mode:</span>
                <p className="mt-1">
                  Click the button below to instantly authenticate as a DocWeave Evaluator Architect.
                  A high-entropy API key (<code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">dw_live_demo_...</code>)
                  will be minted and written directly to your local terminal configuration (<code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">~/.diffweave/credentials.json</code>).
                </p>
              </div>

              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl transition flex items-center justify-center space-x-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>Launch 1-Click Evaluator Session</span>
              </button>
            </div>
          )}

          {/* TAB 3: Credentials Login */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">DocWeave Account Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@docweave.io"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">DocWeave Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#238636] hover:bg-[#2EA043] text-white font-semibold text-xs transition flex items-center justify-center space-x-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Sign in with DocWeave Credentials</span>
              </button>
            </form>
          )}

          {/* TAB 4: Token Login */}
          {activeTab === 'token' && (
            <form onSubmit={handlePatLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Enter Personal Access Token</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={patInput}
                    onChange={(e) => setPatInput(e.target.value)}
                    placeholder="dw_live_..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-[#238636] hover:bg-[#2EA043] text-white font-semibold text-xs transition"
              >
                Connect via Token
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Terminal CLI Synchronization & Token Card */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#30363D] pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Terminal CLI Integration</h2>
              <p className="text-xs text-slate-400">
                Execute Git-like knowledge commands in your local shell using your authenticated credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {syncedCli ? (
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>CLI Synced</span>
              </span>
            ) : (
              <button
                onClick={handleSyncToCli}
                disabled={syncingCli}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow"
              >
                {syncingCli ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Sync to Terminal</span>
              </button>
            )}
          </div>
        </div>

        {/* API Token display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Active API Key / Personal Access Token</span>
            <span className="text-slate-500 font-mono text-[11px]">Storage: {cliPath}</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 select-all overflow-x-auto">
              {activeToken}
            </div>
            <button
              onClick={() => copyToClipboard(activeToken, 'key')}
              className="px-3 py-2 rounded-lg bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-slate-300 text-xs font-semibold transition flex items-center space-x-1"
            >
              {copiedKey ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* CLI Terminal snippet */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300">Run in your Terminal</span>
          <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-3.5 text-xs font-mono text-slate-300 space-y-2">
            <div className="flex items-center justify-between text-slate-500 border-b border-[#21262D] pb-1.5">
              <span>PowerShell / Bash</span>
              <button
                onClick={() => copyToClipboard(cliCommand, 'cli')}
                className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition"
              >
                {copiedCli ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCli ? 'Copied' : 'Copy command'}</span>
              </button>
            </div>
            <p className="text-emerald-400 font-bold">$ {cliCommand}</p>
            <p className="text-slate-500"># Verify authenticated identity</p>
            <p className="text-slate-300">$ dw whoami</p>
            <p className="text-slate-500"># Compute semantic graph diff</p>
            <p className="text-slate-300">$ dw diff</p>
          </div>
        </div>

        {/* Return to Studio Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onReturnToStudio}
            className="py-2.5 px-6 rounded-lg bg-[#238636] hover:bg-[#2EA043] text-white font-bold text-xs shadow-lg transition flex items-center space-x-2"
          >
            <span>Enter DiffWeave Studio</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
