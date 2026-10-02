import React, { useState } from 'react';

export default function PolicyRulesLab({ rules, onToggleRule, onCreateRule, onRunValidation, validationResult }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [operator, setOperator] = useState('min_confidence');
  const [threshold, setThreshold] = useState(0.85);
  const [validating, setValidating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    let config = {};
    if (operator === 'min_confidence') {
      config = { value: parseFloat(threshold) };
    } else if (operator === 'allowed_proposal_types') {
      config = { values: ['CREATE', 'UPDATE'] };
    }

    await onCreateRule(ruleName.trim(), operator, config);
    setRuleName('');
    setShowAddModal(false);
  };

  const handleRunCheck = async () => {
    setValidating(true);
    try {
      await onRunValidation();
    } finally {
      setValidating(false);
    }
  };

  const ruleList = rules || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0E1524] border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Policy Rules & CI Linter</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
              {ruleList.length} Configured Rules
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic gates that validate extracted claims during ingestion. Failing rules automatically block auto-merge and open a Knowledge PR.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            + Add Rule
          </button>
          <button
            disabled={validating}
            onClick={handleRunCheck}
            className="px-4 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg transition shadow disabled:opacity-50"
          >
            {validating ? 'Evaluating...' : '▶ Run Compliance Check'}
          </button>
        </div>
      </div>

      {/* Validation Result Box */}
      {validationResult && (
        <div
          className={`p-5 rounded-xl border ${
            validationResult.compliant
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : 'bg-rose-950/20 border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Policy Evaluation Report</span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono ${
                  validationResult.compliant
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {validationResult.compliant ? '[PASS] Compliant' : '[FAIL] Violations Detected'}
              </span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Proposals Checked: {validationResult.proposals_evaluated || 0}
            </span>
          </div>

          <div className="space-y-2 mt-3">
            {(validationResult.results || []).map((r, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs p-2.5 rounded bg-slate-900/60 border border-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${
                      r.status === 'PASS'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : r.status === 'FAIL'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {r.status}
                  </span>
                  <span className="text-white font-medium">{r.rule_name}</span>
                </div>
                <span className="text-slate-400 italic text-[11px]">{r.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0F1524] overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#121A2C] text-slate-400 font-mono text-[11px] border-b border-slate-800">
            <tr>
              <th className="px-5 py-3 font-semibold">Rule Name</th>
              <th className="px-5 py-3 font-semibold">Operator</th>
              <th className="px-5 py-3 font-semibold">Configuration</th>
              <th className="px-5 py-3 font-semibold">Enforcement</th>
              <th className="px-5 py-3 font-semibold text-right">Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {ruleList.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/30 transition">
                <td className="px-5 py-3 font-semibold text-white">{r.name}</td>
                <td className="px-5 py-3 font-mono text-cyan-400">{r.operator}</td>
                <td className="px-5 py-3 font-mono text-slate-400">
                  {JSON.stringify(r.configuration || {})}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      r.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {r.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => onToggleRule(r.id, r.enabled)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${
                      r.enabled
                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                    }`}
                  >
                    {r.enabled ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#101726] border border-slate-700 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Add Validation Rule</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Strict Confidence Check"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">Operator</label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="min_confidence">min_confidence (Block low confidence extractions)</option>
                  <option value="required_evidence">required_evidence (Mandate verbatim quotes)</option>
                  <option value="allowed_proposal_types">allowed_proposal_types (Constrain types)</option>
                </select>
              </div>

              {operator === 'min_confidence' && (
                <div className="mb-6">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Minimum Confidence Threshold: {(threshold * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full accent-emerald-400"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg font-semibold"
                >
                  Add Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
