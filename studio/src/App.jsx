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
  const [activity, setActivity] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Initial load: workspaces
  useEffect(() => {
    async function init() {
      try {
        const wsList = await api.getWorkspaces();
        setWorkspaces(wsList);
        if (wsList.length > 0) {
          setCurrentWorkspace(wsList[0]);
        }
      } catch (err) {
        showToast(`Failed to connect to DiffWeave Bridge: ${err.message}`, 'error');
      }
    }
    init();
  }, []);

  // Fetch workspace details
  const refreshData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    const wsId = currentWorkspace.id;

    try {
      if (activeTab === 'diff') {
        const diffRes = await api.getSemanticDiff(wsId);
        setDiff(diffRes);
      } else if (activeTab === 'prs') {
        const prsRes = await api.getProposals(wsId);
        setProposals(prsRes);
      } else if (activeTab === 'staging') {
        const docsRes = await api.getDocuments(wsId);
        setDocuments(docsRes);
      } else if (activeTab === 'graph') {
        const graphRes = await api.getKnowledgeGraph(wsId);
        setGraphData(graphRes);
      } else if (activeTab === 'knowledge') {
        const kRes = await api.getKnowledge(wsId);
        setKnowledgeItems(kRes);
      } else if (activeTab === 'rules') {
        const rulesRes = await api.getRules(wsId);
        setRules(rulesRes);
      } else if (activeTab === 'audit') {
        const actRes = await api.getActivity(wsId);
        setActivity(actRes);
      }

      // Always fetch stats in background for badge updates
      const statusRes = await api.getWorkspaceStatus(wsId);
      setStats(statusRes.stats);
    } catch (err) {
      console.error('Error refreshing workspace data:', err);
    }
  }, [currentWorkspace, activeTab]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Actions
  const handleCreateWorkspace = async (name, desc) => {
    try {
      const newWs = await api.createWorkspace(name, desc);
      setWorkspaces([...workspaces, newWs]);
      setCurrentWorkspace(newWs);
      showToast(`Workspace "${name}" created!`);
    } catch (err) {
      showToast(`Create failed: ${err.message}`, 'error');
    }
  };

  const handleReview = async (proposalId, decision, comments = null) => {
    try {
      const res = await api.reviewProposal(currentWorkspace.id, proposalId, decision, comments);
      if (decision === 'APPROVED') {
        showToast(`Proposal approved! Commit ID: ${res.commit_id?.slice(0, 8)}`);
      } else if (decision === 'REJECTED') {
        showToast('Proposal rejected.', 'info');
      } else {
        showToast('Proposal stashed for later.', 'info');
      }
      refreshData();
    } catch (err) {
      showToast(`Review failed: ${err.message}`, 'error');
    }
  };

  const handleBatchReview = async (decision) => {
    try {
      const res = await api.batchReviewProposals(currentWorkspace.id, decision);
      showToast(`Batch ${decision.toLowerCase()} processed (${res.processed_count} items)!`);
      refreshData();
    } catch (err) {
      showToast(`Batch review failed: ${err.message}`, 'error');
    }
  };

  const handleUpload = async (file) => {
    try {
      const res = await api.uploadDocument(currentWorkspace.id, file);
      showToast(`Uploaded ${file.name}. Workflow ID: ${res.workflow_id?.slice(0, 8)}`);
      refreshData();
      return res;
    } catch (err) {
      showToast(`Upload failed: ${err.message}`, 'error');
      throw err;
    }
  };

  const handleToggleRule = async (ruleId, isCurrentlyEnabled) => {
    try {
      if (isCurrentlyEnabled) {
        await api.disableRule(ruleId);
        showToast('Rule disabled.');
      } else {
        await api.enableRule(ruleId);
        showToast('Rule enabled.');
      }
      refreshData();
    } catch (err) {
      showToast(`Rule update failed: ${err.message}`, 'error');
    }
  };

  const handleCreateRule = async (name, operator, config) => {
    try {
      await api.createRule(currentWorkspace.id, name, operator, config);
      showToast(`Rule "${name}" created.`);
      refreshData();
    } catch (err) {
      showToast(`Rule creation failed: ${err.message}`, 'error');
    }
  };

  const handleRunValidation = async () => {
    try {
      const valRes = await api.getValidation(currentWorkspace.id);
      setValidationResult(valRes);
      showToast(valRes.compliant ? 'Validation passed!' : 'Policy violations found.', valRes.compliant ? 'success' : 'error');
    } catch (err) {
      showToast(`Validation check failed: ${err.message}`, 'error');
    }
  };

  const handleSearchKnowledge = async (query) => {
    try {
      setLoading(true);
      const res = await api.searchKnowledge(currentWorkspace.id, query);
      setKnowledgeItems(res);
      showToast(`Found ${res.length} matches for "${query}"`);
    } catch (err) {
      showToast(`Search failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col">
      <Navbar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={(id) => setCurrentWorkspace(workspaces.find((w) => w.id === id))}
        onCreateWorkspace={handleCreateWorkspace}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        stats={stats}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'diff' && (
          <SemanticDiffViewer diff={diff} onReview={handleReview} loading={loading} />
        )}
        {activeTab === 'prs' && (
          <PRReviewDeck
            proposals={proposals}
            onReview={handleReview}
            onBatchReview={handleBatchReview}
            loading={loading}
          />
        )}
        {activeTab === 'staging' && (
          <IngestionStaging documents={documents} onUpload={handleUpload} loading={loading} />
        )}
        {activeTab === 'graph' && (
          <KnowledgeGraph graphData={graphData} loading={loading} />
        )}
        {activeTab === 'knowledge' && (
          <KnowledgeBase items={knowledgeItems} onSearch={handleSearchKnowledge} loading={loading} />
        )}
        {activeTab === 'rules' && (
          <PolicyRulesLab
            rules={rules}
            onToggleRule={handleToggleRule}
            onCreateRule={handleCreateRule}
            onRunValidation={handleRunValidation}
            validationResult={validationResult}
          />
        )}
        {activeTab === 'audit' && (
          <AuditLog activityFeed={activity} loading={loading} />
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center space-x-2 border animate-fade-in ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : toast.type === 'info'
              ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <span>{toast.type === 'error' ? '✖' : toast.type === 'info' ? 'ℹ' : '✔'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
