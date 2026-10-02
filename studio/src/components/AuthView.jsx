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
  ChevronRight,
  Info,
  Server,
  UserPlus
} from 'lucide-react';
import { api } from '../api/client';

export default function AuthView({ currentUser, onAuthSuccess, onReturnToStudio }) {
  const [activeTab, setActiveTab] = useState('signup'); // 'signup', 'login', 'demo', 'token'
  
  // Signup form
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Token form
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

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupUsername.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setError('Please fill in all registration fields.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const data = await api.signup(signupUsername.trim(), signupEmail.trim(), signupPassword.trim());
      onAuthSuccess(data);
      setSuccessMsg(`Welcome, ${data.username}! Account created & API Key synced to terminal.`);
      setSyncedCli(true);
      if (data.credentials_path) setCliPath(data.credentials_path);
    } catch (err) {
      setError(err.message || 'Account creation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please provide email and password.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const data = await api.login(loginEmail.trim(), loginPassword.trim());
      onAuthSuccess(data);
      setSuccessMsg(`Welcome back, ${data.username}! CLI credentials synchronized.`);
      setSyncedCli(true);
      if (data.credentials_path) setCliPath(data.credentials_path);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      {/* Identity Brand Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-sky-500/20 border border-emerald-500/30 shadow-xl shadow-emerald-950/20">
          <Fingerprint className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          DiffWeave Account & FastMCP Identity
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          Create an account or sign in to obtain your developer API key. Credentials automatically synchronize with your local terminal CLI for document git operations.
        </p>
      </div>

      {/* Main Layered Auth Card */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl shadow-2xl overflow-hidden">
        {/* Top Tab Bar inside Card */}
        <div className="flex border-b border-[#30363D] bg-[#0D1117] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 transition ${
              activeTab === 'signup'
                ? 'border-emerald-500 text-emerald-400 bg-[#161B22]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161B22]/50'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>

          <button
            onClick={() => setActiveTab('login')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 transition ${
              activeTab === 'login'
                ? 'border-emerald-500 text-emerald-400 bg-[#161B22]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161B22]/50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In</span>
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
            onClick={() => setActiveTab('token')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 transition ${
              activeTab === 'token'
                ? 'border-emerald-500 text-emerald-400 bg-[#161B22]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161B22]/50'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Paste API Token</span>
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

          {/* TAB 1: In-App Account Signup */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Create your DocWeave Knowledge Account</h3>
                <p className="text-xs text-slate-400">
                  Provision an account to mint Personal Access Tokens for the CLI and Web Studio.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Developer Username / Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    placeholder="Adhishak"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="developer@docweave.io"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#238636] hover:bg-[#2EA043] text-white font-semibold text-xs transition shadow-lg flex items-center justify-center space-x-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>Create Account & Mint API Key</span>
              </button>
            </form>
          )}

          {/* TAB 2: In-App Sign In */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Sign in to your DocWeave Account</h3>
                <p className="text-xs text-slate-400">
                  Authenticate to retrieve your active API key and synchronize your terminal environment.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="user@docweave.io"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
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
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Sign in & Synchronize CLI</span>
              </button>
            </form>
          )}

          {/* TAB 3: 1-Click Demo Login */}
          {activeTab === 'demo' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
                <span className="font-bold text-amber-300">Competition Evaluator & Judge Mode:</span>
                <p className="mt-1">
                  Click the button below to instantly authenticate as a DocWeave Evaluator Architect.
                  A high-entropy API key (<code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">dw_live_demo_...</code>)
                  is minted and written directly to your local terminal configuration (<code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">~/.diffweave/credentials.json</code>).
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
