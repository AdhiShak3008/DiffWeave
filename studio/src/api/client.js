/**
 * DiffWeave Studio API Client
 * Talks directly to the FastAPI bridge, which delegates to DocWeave MCP Server.
 * Supports Bearer token authentication and user sessions.
 */

export const CLOUD_BACKEND_URL = 'https://shak3008-diffweave.hf.space';

export function getApiBase() {
  if (typeof window !== 'undefined') {
    // If running on Vercel or any external static preview, route to HF Space backend
    if (window.location.hostname.includes('vercel.app')) {
      return `${CLOUD_BACKEND_URL}/api`;
    }
  }
  return '/api';
}

export const API_BASE = getApiBase();

function getHeaders(custom = {}) {
  const token = localStorage.getItem('diffweave_token');
  const headers = { 'Content-Type': 'application/json', ...custom };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // -------------------------------------------------------------------------
  // Authentication & Session
  // -------------------------------------------------------------------------
  async signup(username, email, password) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('diffweave_token', data.access_token);
      localStorage.setItem('diffweave_user', JSON.stringify(data));
    }
    return data;
  },

  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('diffweave_token', data.access_token);
      localStorage.setItem('diffweave_user', JSON.stringify(data));
    }
    return data;
  },

  async demoLogin() {
    const res = await fetch(`${API_BASE}/auth/demo-login`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('diffweave_token', data.access_token);
      localStorage.setItem('diffweave_user', JSON.stringify(data));
    }
    return data;
  },

  setApiKey(token) {
    localStorage.setItem('diffweave_token', token);
    localStorage.setItem('diffweave_user', JSON.stringify({ email: 'api-key-user', username: 'API Key User' }));
  },

  logout() {
    localStorage.removeItem('diffweave_token');
    localStorage.removeItem('diffweave_user');
  },

  async generateKey(name = 'CLI Personal Access Token', expiresInDays = 90) {
    const res = await fetch(`${API_BASE}/auth/generate-key`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, expires_in_days: expiresInDays }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async syncCLI(token, email, username) {
    const res = await fetch(`${API_BASE}/auth/sync-cli`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ access_token: token, email, username }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getWhoami() {
    try {
      const res = await fetch(`${API_BASE}/auth/whoami`, { headers: getHeaders() });
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  },

  getCurrentUser() {
    try {
      const u = localStorage.getItem('diffweave_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  // -------------------------------------------------------------------------
  // Health & MCP
  // -------------------------------------------------------------------------
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`, { headers: getHeaders() });
    return res.json();
  },

  async getMCPTools() {
    const res = await fetch(`${API_BASE}/mcp/tools`, { headers: getHeaders() });
    return res.json();
  },

  // -------------------------------------------------------------------------
  // Workspaces
  // -------------------------------------------------------------------------
  async getWorkspaces() {
    const res = await fetch(`${API_BASE}/workspaces`, { headers: getHeaders() });
    return res.json();
  },

  async createWorkspace(name, description = '') {
    const res = await fetch(`${API_BASE}/workspaces`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getWorkspaceStatus(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/status`, { headers: getHeaders() });
    return res.json();
  },

  // -------------------------------------------------------------------------
  // Documents
  // -------------------------------------------------------------------------
  async getDocuments(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/documents`, { headers: getHeaders() });
    return res.json();
  },

  async uploadDocument(workspaceId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('diffweave_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // -------------------------------------------------------------------------
  // Proposals & PRs
  // -------------------------------------------------------------------------
  async getProposals(workspaceId, status) {
    const url = status
      ? `${API_BASE}/workspaces/${workspaceId}/proposals?status=${status}`
      : `${API_BASE}/workspaces/${workspaceId}/proposals`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },

  async reviewProposal(workspaceId, proposalId, decision, comments = '') {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/proposals/${proposalId}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ decision, comments }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async batchReview(workspaceId, decision, proposalIds = null, comments = '') {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/proposals/batch-review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ decision, proposal_ids: proposalIds, comments }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // -------------------------------------------------------------------------
  // Semantic Diff
  // -------------------------------------------------------------------------
  async getSemanticDiff(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/diff`, { headers: getHeaders() });
    return res.json();
  },

  // -------------------------------------------------------------------------
  // Policy Rules
  // -------------------------------------------------------------------------
  async getRules(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/rules`, { headers: getHeaders() });
    return res.json();
  },

  async createRule(workspaceId, name, operator, configuration) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/rules`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, operator, configuration }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteRule(ruleId) {
    const res = await fetch(`${API_BASE}/rules/${ruleId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  async validateProposals(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/validate`, { headers: getHeaders() });
    return res.json();
  },

  // -------------------------------------------------------------------------
  // Knowledge Register & Graph
  // -------------------------------------------------------------------------
  async getKnowledgeItems(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/knowledge`, { headers: getHeaders() });
    return res.json();
  },

  async searchKnowledge(workspaceId, query) {
    const res = await fetch(
      `${API_BASE}/workspaces/${workspaceId}/knowledge/search?q=${encodeURIComponent(query)}`,
      { headers: getHeaders() }
    );
    return res.json();
  },

  async getKnowledgeGraph(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/graph`, { headers: getHeaders() });
    return res.json();
  },

  // -------------------------------------------------------------------------
  // Audit Trail & Metrics
  // -------------------------------------------------------------------------
  async getActivityFeed(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/activity`, { headers: getHeaders() });
    return res.json();
  },

  async getWorkflows(workspaceId) {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/workflows`, { headers: getHeaders() });
    return res.json();
  },
};
