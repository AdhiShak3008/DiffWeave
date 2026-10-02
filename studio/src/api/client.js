/**
 * DiffWeave Studio API Client
 * Talks directly to the FastAPI bridge, which delegates to DocWeave MCP Server.
 */

const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getMCPTools() {
    const res = await fetch(`${API_BASE}/mcp/tools`);
    return res.json();
  },

  async getWorkspaces() {
    const res = await fetch(`${API_BASE}/workspaces`);
    return res.json();
  },

  async createWorkspace(name, description = '') {
    const res = await fetch(`${API_BASE}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getWorkspaceStatus(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/status`);
    return res.json();
  },

  async getDocuments(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/documents`);
    return res.json();
  },

  async uploadDocument(workspaceId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getProposals(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/proposals`);
    return res.json();
  },

  async reviewProposal(workspaceId, proposalId, decision, comments = null) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/proposals/${proposalId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, comments }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async batchReviewProposals(workspaceId, decision, proposalIds = null, comments = null) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/proposals/batch-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, proposal_ids: proposalIds, comments }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getSemanticDiff(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/diff`);
    return res.json();
  },

  async getValidation(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/validate`);
    return res.json();
  },

  async getKnowledgeGraph(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/graph`);
    return res.json();
  },

  async getKnowledge(workspaceId, type = null, status = null) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/knowledge?${params.toString()}`);
    return res.json();
  },

  async searchKnowledge(workspaceId, query) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },

  async getRules(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/rules`);
    return res.json();
  },

  async createRule(workspaceId, name, operator, configuration) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, operator, configuration }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async enableRule(ruleId) {
    const res = await fetch(`${API_BASE}/rules/${ruleId}/enable`, { method: 'POST' });
    return res.json();
  },

  async disableRule(ruleId) {
    const res = await fetch(`${API_BASE}/rules/${ruleId}/disable`, { method: 'POST' });
    return res.json();
  },

  async getActivity(workspaceId, limit = 50) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/activity?limit=${limit}`);
    return res.json();
  },
};
