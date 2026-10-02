import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Play,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sliders,
  Filter,
  Code2,
  FileCheck2
} from 'lucide-react';
import { api } from '../api/client';

export default function PolicyRulesLab({ rules, currentWorkspace, onCreateRule, onDeleteRule, onValidate, loading }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState('CONFIDENCE_THRESHOLD');
  const [conditionVal, setConditionVal] = useState('0.85');
  const [isBlocking, setIsBlocking] = useState(true);

  const [lintResults, setLintResults] = useState(null);
  const [validating, setValidating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    let condition = {};
    if (ruleType === 'CONFIDENCE_THRESHOLD') {
      condition = { min_confidence: parseFloat(conditionVal) || 0.85 };
    } else if (ruleType === 'REGEX_FORMAT') {
      condition = { pattern: conditionVal };
    } else {
      condition = { field: conditionVal };
    }

    await onCreateRule(ruleName.trim(), ruleType, condition, isBlocking);
    setRuleName('');
    setShowAddModal(false);
  };

  const runLinter = async () => {
    if (!currentWorkspace?.id) return;
    setValidating(true);
    try {
      const res = await onValidate();
      setLintResults(res);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Policy Rules Lab Header */}
      <div className="bg-[#0C101A] border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">Policy as Code (CI Linting Engine)</h2>
            <p className="text-[11px] text-slate-400">Automated quality gates and regulatory guardrails executed before knowledge merges.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={runLinter}
            disabled={validating}
            className="px-3.5 py-1.5 rounded-lg bg-[#141B2D] hover:bg-[#1E2740] border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
          >
            <Play className={`w-3.5 h-3.5 text-emerald-400 ${validating ? 'animate-spin' : ''}`} />
            <span>{validating ? 'Linting PRs...' : 'Dry-Run CI Check'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm shadow-emerald-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Policy Rule</span>
          </button>
        </div>
      </div>

      {/* Lint Results Suite (GitHub Actions Style) */}
      {lintResults && (
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                CI Check Suite Summary
              </span>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                lintResults.has_violations
                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {lintResults.has_violations
                ? `FAILED: ${lintResults.violations_count} Violations`
                : 'ALL CHECKS PASSED'}
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 text-xs font-mono">
            {(lintResults.validations || []).map((val, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  {val.severity === 'PASS' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <span className="text-white font-medium">{val.rule_name}</span>
                    <span className="text-slate-400 ml-2 font-sans text-[11px]">{val.message}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    val.severity === 'PASS' ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                  }`}
                >
                  {val.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-[#0D121F] border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white tracking-wide">{rule.name}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    rule.is_blocking
                      ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  }`}
                >
                  {rule.is_blocking ? 'BLOCKING GATE' : 'ADVISORY'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono text-slate-400">
                <div className="flex justify-between text-[11px]">
                  <span>Type:</span>
                  <span className="text-slate-200">{rule.rule_type}</span>
                </div>
                <div className="bg-[#141B2D] p-2 rounded border border-slate-800/80 text-[11px] text-slate-300">
                  {JSON.stringify(rule.condition || {})}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-[10px] text-slate-500 font-mono">ID: {rule.id.slice(0, 8)}</span>
              <button
                onClick={() => onDeleteRule(rule.id)}
                className="text-slate-500 hover:text-rose-400 transition p-1"
                title="Delete Rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="bg-[#0D121F] border border-slate-700/80 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4">Add Validation Policy Rule</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clinical Endpoint Floor Check"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-[#141B2D] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Rule Condition Type</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value)}
                  className="w-full bg-[#141B2D] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="CONFIDENCE_THRESHOLD">Confidence Threshold Floor</option>
                  <option value="REGEX_FORMAT">RegEx Format Validator</option>
                  <option value="REQUIRED_FIELD">Required Field Presence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Threshold / Pattern Value</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0.85 or ^PROTOCOL-[A-Z0-9-]+$"
                  value={conditionVal}
                  onChange={(e) => setConditionVal(e.target.value)}
                  className="w-full bg-[#141B2D] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="blockingCheck"
                  checked={isBlocking}
                  onChange={(e) => setIsBlocking(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-[#141B2D]"
                />
                <label htmlFor="blockingCheck" className="text-xs text-slate-300 font-medium">
                  Enforce as Blocking Gate (Prevents PR Merge if failed)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  Save Policy Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
