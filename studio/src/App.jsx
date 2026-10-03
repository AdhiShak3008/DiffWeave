import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import Navbar from './components/Navbar';
import WorkspaceHub from './components/WorkspaceHub';
import WorkspaceEmptyState from './components/WorkspaceEmptyState';
import SemanticDiffViewer from './components/SemanticDiffViewer';
import PRReviewDeck from './components/PRReviewDeck';
import IngestionStaging from './components/IngestionStaging';
import KnowledgeGraph from './components/KnowledgeGraph';
import KnowledgeBase from './components/KnowledgeBase';
import PolicyRulesLab from './components/PolicyRulesLab';
import AuditLog from './components/AuditLog';
import { RefreshCw, CheckCircle2, AlertCircle, Sparkles, GitBranch, ArrowLeft } from 'lucide-react';

export default function App() {
  const { isAuthenticated, logout: authLogout, user: authUser } = useAuth();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null); // Defaults to null -> shows WorkspaceHub!
  const [activeTab, setActiveTab] = useState('diff');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dismissedEmptyStateFor, setDismissedEmptyStateFor] = useState(null);

  // State data
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [diff, setDiff] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [rules, setRules] = useState([]);
  const [activity, setActivity] = useState([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Initial load: fetch workspaces & user identity
  useEffect(() => {
    async function init() {
      try {
        const wsList = await api.getWorkspaces();
        setWorkspaces(Array.isArray(wsList) ? wsList : []);
      } catch (err) {
        showToast(`Connecting to DiffWeave FastMCP Bridge...`, 'info');
      }

      const localUser = api.getCurrentUser();
      if (localUser) setCurrentUser(localUser);
    }
    init();
  }, []);

  // Fetch workspace details based on active tab
  const refreshData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    const wsId = currentWorkspace.id;
    setRefreshing(true);

    try {
      if (activeTab === 'diff') {
        const diffRes = await api.getSemanticDiff(wsId);
        setDiff(diffRes);
      }
      if (activeTab === 'prs') {
        const prsRes = await api.getProposals(wsId);
        setProposals(Array.isArray(prsRes) ? prsRes : []);
      }
      if (activeTab === 'staging') {
        const docsRes = await api.getDocuments(wsId);
        setDocuments(Array.isArray(docsRes) ? docsRes : []);
      }
      if (activeTab === 'graph') {
        const graphRes = await api.getKnowledgeGraph(wsId);
        setGraphData(graphRes);
      }
      if (activeTab === 'knowledge') {
        const kRes = await api.getKnowledgeItems(wsId);
        setKnowledgeItems(Array.isArray(kRes) ? kRes : []);
      }
      if (activeTab === 'rules') {
        const rulesRes = await api.getRules(wsId);
        setRules(Array.isArray(rulesRes) ? rulesRes : []);
      }
      if (activeTab === 'audit') {
        const actRes = await api.getActivityFeed(wsId);
        setActivity(Array.isArray(actRes) ? actRes : []);
      }

      // Background status fetch for navbar counters
      try {
        const statusRes = await api.getWorkspaceStatus(wsId);
        if (statusRes?.stats) {
          setStats(statusRes.stats);
          // Also update counts in current workspace object
          if (statusRes.stats.total_documents !== undefined || statusRes.stats.knowledge_items !== undefined) {
            setCurrentWorkspace((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                d_count: statusRes.stats.total_documents ?? prev.d_count,
                k_count: statusRes.stats.knowledge_items ?? prev.k_count
              };
            });
          }
        }
      } catch {
        // silent fallback
      }
    } catch (err) {
      console.error('Error refreshing workspace data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [currentWorkspace, activeTab]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
    } else {
      const u = api.getCurrentUser();
      if (u) setCurrentUser(u);
    }
  }, [authUser]);

  // Actions
  const handleCreateWorkspace = async (name, desc) => {
    try {
      const newWs = await api.createWorkspace(name, desc);
      const wsItem = {
        ...newWs,
        name: newWs.name || name,
        description: newWs.description || desc,
        d_count: 0,
        k_count: 0
      };
      setWorkspaces((prev) => [wsItem, ...prev]);
      setCurrentWorkspace(wsItem);
      setActiveTab('quickstart'); // Automatically shows GitHub-style CLI instructions!
      showToast(`Workspace "${name}" created! Follow CLI instructions to populate.`);
    } catch (err) {
      showToast(`Create failed: ${err.message}`, 'error');
    }
  };

  const handleSelectWorkspace = (ws) => {
    setCurrentWorkspace(ws);
    // If workspace is brand new / has 0 docs and 0 facts, show quickstart CLI guide by default
    if ((ws.d_count === 0 && ws.k_count === 0) || ws.is_new) {
      setActiveTab('quickstart');
    } else {
      setActiveTab('diff');
    }
  };

  const handleReview = async (proposalId, decision, comments = '') => {
    try {
      await api.reviewProposal(currentWorkspace?.id, proposalId, decision, comments);
      showToast(`Proposal ${decision.toLowerCase()}!`);
      refreshData();
    } catch (err) {
      showToast(`Review failed: ${err.message}`, 'error');
    }
  };

  const handleBatchReview = async (decision) => {
    try {
      const res = await api.batchReview(currentWorkspace.id, decision);
      showToast(`Batch ${decision.toLowerCase()} processed (${res.processed_count} items)!`);
      refreshData();
    } catch (err) {
      showToast(`Batch review failed: ${err.message}`, 'error');
    }
  };

  const handleUpload = async (file) => {
    try {
      const res = await api.uploadDocument(currentWorkspace.id, file);
      showToast(`Document ${file.name} staged!`);
      // Update local workspace count
      setCurrentWorkspace((prev) => prev ? { ...prev, d_count: (prev.d_count || 0) + 1 } : prev);
      refreshData();
      return res;
    } catch (err) {
      showToast(`Upload failed: ${err.message}`, 'error');
      throw err;
    }
  };

  const handleCreateRule = async (name, operator, condition, isBlocking) => {
    try {
      await api.createRule(currentWorkspace.id, name, operator, condition, isBlocking);
      showToast(`Policy rule "${name}" created.`);
      refreshData();
    } catch (err) {
      showToast(`Rule creation failed: ${err.message}`, 'error');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await api.deleteRule(ruleId);
      showToast('Rule deleted.');
      refreshData();
    } catch (err) {
      showToast(`Rule deletion failed: ${err.message}`, 'error');
    }
  };

  const handleValidate = async () => {
    try {
      const valRes = await api.validateProposals(currentWorkspace.id);
      showToast(valRes.has_violations ? 'Policy violations detected!' : 'All CI policy checks passed!');
      return valRes;
    } catch (err) {
      showToast(`Validation check failed: ${err.message}`, 'error');
      throw err;
    }
  };

  const handleLogout = () => {
    api.logout();
    authLogout();
    navigate('/login', { replace: true });
  };

  // If user is not authenticated, strictly redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if current workspace is completely empty
  const isWorkspaceEmpty = currentWorkspace && 
    (currentWorkspace.d_count === 0 && currentWorkspace.k_count === 0) &&
    dismissedEmptyStateFor !== currentWorkspace.id;

  return (
    <div className="min-h-screen bg-[#0D1117] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Platform Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onOpenHub={() => setCurrentWorkspace(null)}
        onCreateWorkspace={handleCreateWorkspace}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        stats={stats}
        currentUser={currentUser}
        onLogout={handleLogout}
        onRefresh={() => refreshData()}
        refreshing={refreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* =================================================================== */}
        {/* VIEW 1: Hugging Face Style Workspaces Hub (When no ws is selected) */}
        {/* =================================================================== */}
        {!currentWorkspace && (
          <WorkspaceHub
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
            onSelectWorkspace={handleSelectWorkspace}
            onCreateWorkspace={handleCreateWorkspace}
            currentUser={currentUser}
          />
        )}

        {/* =================================================================== */}
        {/* VIEW 2: Inside a Workspace                                         */}
        {/* =================================================================== */}
        {currentWorkspace && (
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Workspace Context Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentWorkspace(null)}
                  className="hover:text-emerald-400 transition flex items-center space-x-1 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Workspaces</span>
                </button>
                <span className="text-slate-600">/</span>
                <span className="font-semibold text-white flex items-center space-x-1">
                  <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Knowledge Branch:</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20 font-bold">
                  main
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 font-mono text-[11px] truncate max-w-[200px] sm:max-w-none">
                  Workspace: {currentWorkspace.id}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('staging')}
                  className="px-2.5 py-1 rounded-md bg-[#238636] hover:bg-[#2EA043] text-white font-semibold text-xs transition"
                >
                  + Stage Document
                </button>
                <button
                  onClick={() => refreshData()}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-slate-300 hover:text-white transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Sync</span>
                </button>
              </div>
            </div>

            {/* If workspace is empty or user is on quickstart tab, show GitHub-style CLI instructions */}
            {(isWorkspaceEmpty || activeTab === 'quickstart') ? (
              <WorkspaceEmptyState
                workspace={currentWorkspace}
                currentUser={currentUser}
                onUploadDocument={handleUpload}
                onRefresh={refreshData}
                onDismissEmptyState={() => {
                  setDismissedEmptyStateFor(currentWorkspace.id);
                  setActiveTab('diff');
                }}
              />
            ) : (
              <>
                {/* TAB 1: Semantic Diff Viewer (Default!) */}
                {activeTab === 'diff' && (
                  <SemanticDiffViewer
                    diffData={diff}
                    onReviewProposal={handleReview}
                    onBatchReview={handleBatchReview}
                    loading={loading}
                  />
                )}

                {/* TAB 2: Pull Requests Deck */}
                {activeTab === 'prs' && (
                  <PRReviewDeck
                    proposals={proposals}
                    onReviewProposal={handleReview}
                    onBatchReview={handleBatchReview}
                    loading={loading}
                  />
                )}

                {/* TAB 3: Knowledge Graph DAG Canvas */}
                {activeTab === 'graph' && (
                  <KnowledgeGraph graphData={graphData} loading={loading} />
                )}

                {/* TAB 4: Documents & Ingestion Staging */}
                {activeTab === 'staging' && (
                  <IngestionStaging
                    documents={documents}
                    onUploadDocument={handleUpload}
                    currentWorkspace={currentWorkspace}
                    loading={loading}
                  />
                )}

                {/* TAB 5: Policy Rules CI Lab */}
                {activeTab === 'rules' && (
                  <PolicyRulesLab
                    rules={rules}
                    currentWorkspace={currentWorkspace}
                    onCreateRule={handleCreateRule}
                    onDeleteRule={handleDeleteRule}
                    onValidate={handleValidate}
                    loading={loading}
                  />
                )}

                {/* TAB 6: Master Truth Register */}
                {activeTab === 'knowledge' && (
                  <KnowledgeBase
                    knowledgeItems={knowledgeItems}
                    currentWorkspace={currentWorkspace}
                    loading={loading}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                )}

                {/* TAB 7: Audit Timeline Log */}
                {activeTab === 'audit' && (
                  <AuditLog activityFeed={activity} loading={loading} />
                )}

              </>
            )}
          </div>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-xl border shadow-2xl flex items-center space-x-2 text-xs font-medium backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
