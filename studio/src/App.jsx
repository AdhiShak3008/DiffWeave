import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import Navbar from './components/Navbar';
import SemanticDiffViewer from './components/SemanticDiffViewer';
import PRReviewDeck from './components/PRReviewDeck';
import IngestionStaging from './components/IngestionStaging';
import KnowledgeGraph from './components/KnowledgeGraph';
import KnowledgeBase from './components/KnowledgeBase';
import PolicyRulesLab from './components/PolicyRulesLab';
import AuditLog from './components/AuditLog';
import { RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [activeTab, setActiveTab] = useState('diff');

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

  // Initial load: fetch workspaces
  useEffect(() => {
    async function init() {
      try {
        const wsList = await api.getWorkspaces();
        setWorkspaces(wsList);
        if (wsList && wsList.length > 0) {
          setCurrentWorkspace(wsList[0]);
        }
      } catch (err) {
        showToast(`Connecting to DiffWeave Bridge...`, 'info');
      }
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
      } else if (activeTab === 'prs') {
        const prsRes = await api.getProposals(wsId);
        setProposals(prsRes || []);
      } else if (activeTab === 'staging') {
        const docsRes = await api.getDocuments(wsId);
        setDocuments(docsRes || []);
      } else if (activeTab === 'graph') {
        const graphRes = await api.getKnowledgeGraph(wsId);
        setGraphData(graphRes);
      } else if (activeTab === 'knowledge') {
        const kRes = await api.getKnowledgeItems(wsId);
        setKnowledgeItems(kRes || []);
      } else if (activeTab === 'rules') {
        const rulesRes = await api.getRules(wsId);
        setRules(rulesRes || []);
      } else if (activeTab === 'audit') {
        const actRes = await api.getActivityFeed(wsId);
        setActivity(actRes || []);
      }

      // Background status fetch for navbar counters
      try {
        const statusRes = await api.getWorkspaceStatus(wsId);
        if (statusRes?.stats) {
          setStats(statusRes.stats);
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

  // Actions
  const handleCreateWorkspace = async (name, desc) => {
    try {
      const newWs = await api.createWorkspace(name, desc);
      setWorkspaces((prev) => [...prev, newWs]);
      setCurrentWorkspace(newWs);
      showToast(`Workspace "${name}" initialized!`);
    } catch (err) {
      showToast(`Create failed: ${err.message}`, 'error');
    }
  };

  const handleReview = async (proposalId, decision, comments = '') => {
    try {
      await api.reviewProposal(proposalId, decision, comments);
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

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Navbar */}
      <Navbar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={(id) => setCurrentWorkspace(workspaces.find((w) => w.id === id))}
        onCreateWorkspace={handleCreateWorkspace}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        stats={stats}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Workspace Quick Action Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-white">Active Branch:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20 font-bold">
              main
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono text-[11px]">
              Workspace: {currentWorkspace?.id || '4314fb04-95be-41a2-bef4-50bf27c9c363'}
            </span>
          </div>

          <button
            onClick={() => refreshData()}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#0E1422] hover:bg-[#141B2D] border border-slate-800 text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>

        {/* Tab View Switcher */}
        {activeTab === 'diff' && (
          <SemanticDiffViewer
            diffData={diff}
            onReviewProposal={handleReview}
            onBatchReview={handleBatchReview}
            loading={loading}
          />
        )}

        {activeTab === 'prs' && (
          <PRReviewDeck
            proposals={proposals}
            onReviewProposal={handleReview}
            onBatchReview={handleBatchReview}
            loading={loading}
          />
        )}

        {activeTab === 'staging' && (
          <IngestionStaging
            documents={documents}
            onUploadDocument={handleUpload}
            currentWorkspace={currentWorkspace}
            loading={loading}
          />
        )}

        {activeTab === 'graph' && (
          <KnowledgeGraph graphData={graphData} loading={loading} />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeBase
            knowledgeItems={knowledgeItems}
            currentWorkspace={currentWorkspace}
            loading={loading}
          />
        )}

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

        {activeTab === 'audit' && (
          <AuditLog activityFeed={activity} loading={loading} />
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
