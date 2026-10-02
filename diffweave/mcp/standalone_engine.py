"""
DiffWeave Embedded Standalone Engine.

Provides an in-memory / local fallback implementation of the DocWeave MCP
toolset so that DiffWeave can run independently even if the DocWeave repository
is not present on the machine.
"""
from __future__ import annotations

import datetime
import os
import re
import uuid
from typing import Any, Optional

# Static demo IDs - stable across restarts
_DOC1 = "d0c00001-0000-0000-0000-000000000001"
_DOC2 = "d0c00002-0000-0000-0000-000000000002"
_DOC3 = "d0c00003-0000-0000-0000-000000000003"
_KI1  = "k1000001-0000-0000-0000-000000000001"
_KI2  = "k1000002-0000-0000-0000-000000000002"
_KI3  = "k1000003-0000-0000-0000-000000000003"
_KI4  = "k1000004-0000-0000-0000-000000000004"
_KI5  = "k1000005-0000-0000-0000-000000000005"
_PR1  = "p0000001-0000-0000-0000-000000000001"
_PR2  = "p0000002-0000-0000-0000-000000000002"
_PR3  = "p0000003-0000-0000-0000-000000000003"
_WS   = "default-standalone-workspace"


def _ts(days_ago=0, hours_ago=0) -> str:
    t = datetime.datetime.now() - datetime.timedelta(days=days_ago, hours=hours_ago)
    return t.isoformat()


class StandaloneEngine:
    def __init__(self):
        self.workspaces: dict[str, dict[str, Any]] = {
            _WS: {
                "id": _WS,
                "name": "DiffWeave Standalone Workspace",
                "description": "Embedded standalone workspace for offline / decoupled operation",
                "created_at": _ts(days_ago=14),
            }
        }
        self.documents: list[dict[str, Any]] = [
            {"id": _DOC1, "workspace_id": _WS, "filename": "Q3-2025-Clinical-Trial-Report.pdf", "status": "PROCESSED", "page_count": 42, "created_at": _ts(days_ago=7), "knowledge_items_extracted": 18},
            {"id": _DOC2, "workspace_id": _WS, "filename": "Regulatory-Compliance-Framework-v4.docx", "status": "PROCESSED", "page_count": 103, "created_at": _ts(days_ago=3), "knowledge_items_extracted": 37},
            {"id": _DOC3, "workspace_id": _WS, "filename": "Safety-Protocol-Amendment-Draft.pdf", "status": "PENDING", "page_count": 17, "created_at": _ts(hours_ago=2), "knowledge_items_extracted": 0},
        ]
        self.knowledge_items: list[dict[str, Any]] = [
            {"id": _KI1, "workspace_id": _WS, "title": "Primary Efficacy Endpoint", "type": "CLAIM", "value": "Trial arm A demonstrated a 34.7% reduction in primary endpoint events vs placebo at 52-week follow-up (p < 0.001, 95% CI: 28.1-41.3%).", "confidence": 0.97, "status": "ACTIVE", "filename": "Q3-2025-Clinical-Trial-Report.pdf", "created_at": _ts(days_ago=7)},
            {"id": _KI2, "workspace_id": _WS, "title": "Median Overall Survival", "type": "METRIC", "value": "mOS = 18.4 months (95% CI: 15.9-21.2) in the treatment group versus 11.7 months in the control group (HR 0.64, p = 0.002).", "confidence": 0.99, "status": "ACTIVE", "filename": "Q3-2025-Clinical-Trial-Report.pdf", "created_at": _ts(days_ago=7)},
            {"id": _KI3, "workspace_id": _WS, "title": "GCP Audit Readiness Requirement", "type": "ENTITY", "value": "All sites must maintain source data verification (SDV) records for 15 years post-study closure per 21 CFR Part 11 and ICH E6(R2) Section 8.4.", "confidence": 0.96, "status": "ACTIVE", "filename": "Regulatory-Compliance-Framework-v4.docx", "created_at": _ts(days_ago=3)},
            {"id": _KI4, "workspace_id": _WS, "title": "SAE Reporting Window", "type": "CLAIM", "value": "Serious adverse events (SAEs) must be reported to the sponsor within 24 hours of site awareness and to the IRB within 5 working days.", "confidence": 0.94, "status": "ACTIVE", "filename": "Regulatory-Compliance-Framework-v4.docx", "created_at": _ts(days_ago=3)},
            {"id": _KI5, "workspace_id": _WS, "title": "Enrolment Milestone", "type": "METRIC", "value": "Target enrolment of 1,200 participants achieved as of 2025-09-15; 94.8% completion rate across 23 active sites.", "confidence": 0.91, "status": "ACTIVE", "filename": "Q3-2025-Clinical-Trial-Report.pdf", "created_at": _ts(days_ago=5)},
        ]
        self.proposals: list[dict[str, Any]] = [
            {"id": _PR1, "workspace_id": _WS, "summary": "Update mOS confidence interval from prelim to final analysis", "status": "PENDING", "proposal_type": "UPDATE", "rationale": "Final statistical analysis yields tighter 95% CI bounds.", "proposed_changes": {"existing": {"value": "mOS = 18.4 months (95% CI: 15.9-21.2)", "confidence": 0.91}, "proposed": {"value": "mOS = 18.4 months (95% CI: 16.2-20.8)", "confidence": 0.99}, "type": "METRIC", "title": "Median Overall Survival (Final)"}, "created_at": _ts(hours_ago=6)},
            {"id": _PR2, "workspace_id": _WS, "summary": "Add new safety finding: Grade 3 hepatotoxicity incidence", "status": "PENDING", "proposal_type": "CREATE", "rationale": "Post-hoc safety review identified hepatotoxicity signal requiring documentation.", "proposed_changes": {"type": "CLAIM", "title": "Grade 3 Hepatotoxicity Incidence", "value": "Grade >=3 hepatotoxicity was observed in 4.2% of treatment arm patients vs 0.8% in placebo (p = 0.04).", "confidence": 0.89, "evidence": ["Table 14, Q3-2025-Clinical-Trial-Report.pdf"]}, "created_at": _ts(hours_ago=3)},
            {"id": _PR3, "workspace_id": _WS, "summary": "Extend SDV retention period from 15 to 25 years per updated EU MDR", "status": "PENDING", "proposal_type": "UPDATE", "rationale": "EU MDR 2017/745 Article 87 requires 25-year post-market retention for Class III devices.", "proposed_changes": {"existing": {"value": "All sites must maintain SDV records for 15 years post-study closure.", "confidence": 0.96}, "proposed": {"value": "All sites must maintain SDV records for 25 years post-study closure per EU MDR 2017/745 Art. 87 and 21 CFR Part 11.", "confidence": 0.98}, "type": "ENTITY", "title": "SDV Retention Period (Updated)"}, "created_at": _ts(days_ago=1)},
        ]
        self.activity_log: list[dict[str, Any]] = [
            {"id": str(uuid.uuid4()), "type": "proposal_approved", "message": "Knowledge commit approved: 'Primary Efficacy Endpoint' merged into master truth register.", "timestamp": _ts(days_ago=7), "metadata": {"knowledge_item_id": _KI1}},
            {"id": str(uuid.uuid4()), "type": "proposal_approved", "message": "Knowledge commit approved: 'Median Overall Survival' merged into master truth register.", "timestamp": _ts(days_ago=7), "metadata": {"knowledge_item_id": _KI2}},
            {"id": str(uuid.uuid4()), "type": "workflow_completed", "message": "Document ingestion workflow completed for 'Q3-2025-Clinical-Trial-Report.pdf' - 18 facts extracted.", "timestamp": _ts(days_ago=7), "metadata": {"document_id": _DOC1}},
            {"id": str(uuid.uuid4()), "type": "proposal_approved", "message": "Knowledge commit approved: 'GCP Audit Readiness Requirement' merged into master truth register.", "timestamp": _ts(days_ago=3), "metadata": {"knowledge_item_id": _KI3}},
            {"id": str(uuid.uuid4()), "type": "workflow_completed", "message": "Document ingestion workflow completed for 'Regulatory-Compliance-Framework-v4.docx' - 37 facts extracted.", "timestamp": _ts(days_ago=3), "metadata": {"document_id": _DOC2}},
            {"id": str(uuid.uuid4()), "type": "proposal_created", "message": "Knowledge PR opened: 'Extend SDV retention period from 15 to 25 years per updated EU MDR'.", "timestamp": _ts(days_ago=1), "metadata": {"proposal_id": _PR3}},
            {"id": str(uuid.uuid4()), "type": "proposal_created", "message": "Knowledge PR opened: 'Update mOS confidence interval from prelim to final analysis'.", "timestamp": _ts(hours_ago=6), "metadata": {"proposal_id": _PR1}},
            {"id": str(uuid.uuid4()), "type": "proposal_created", "message": "Knowledge PR opened: 'Add new safety finding: Grade 3 hepatotoxicity incidence'.", "timestamp": _ts(hours_ago=3), "metadata": {"proposal_id": _PR2}},
            {"id": str(uuid.uuid4()), "type": "workflow_completed", "message": "Ingestion staging: 'Safety-Protocol-Amendment-Draft.pdf' queued for processing.", "timestamp": _ts(hours_ago=2), "metadata": {"document_id": _DOC3}},
        ]
        self.rules: list[dict[str, Any]] = [
            {"id": str(uuid.uuid4()), "workspace_id": _WS, "name": "Confidence Floor Check", "rule_type": "CONFIDENCE_THRESHOLD", "condition": {"min_confidence": 0.80}, "is_blocking": True, "enabled": True},
            {"id": str(uuid.uuid4()), "workspace_id": _WS, "name": "Protocol ID Format", "rule_type": "REGEX_FORMAT", "condition": {"pattern": "^PROTOCOL-[A-Z0-9-]+$"}, "is_blocking": False, "enabled": True},
            {"id": str(uuid.uuid4()), "workspace_id": _WS, "name": "Mandatory Provenance Citation", "rule_type": "PROVENANCE_MANDATORY", "condition": {"require_source_document": True}, "is_blocking": True, "enabled": True},
            {"id": str(uuid.uuid4()), "workspace_id": _WS, "name": "Statistical Claim Validation", "rule_type": "REGEX_FORMAT", "condition": {"pattern": "p\\s*[<>=]\\s*0\\.\\d+"}, "is_blocking": False, "enabled": True},
        ]
        self.workflows: list[dict[str, Any]] = []

    async def dispatch(self, tool_name: str, args: dict[str, Any]) -> Any:
        method = getattr(self, f"tool_{tool_name}", None)
        if not method:
            return {"status": "ok", "message": f"Tool {tool_name} executed in standalone mode"}
        return await method(args)

    async def tool_list_workspaces(self, args):
        return list(self.workspaces.values())

    async def tool_create_workspace(self, args):
        ws_id = str(uuid.uuid4())
        entry = {"id": ws_id, "name": args.get("name", "New Workspace"), "description": args.get("description", ""), "created_at": _ts()}
        self.workspaces[ws_id] = entry
        return entry

    async def tool_get_workspace(self, args):
        ws_id = args.get("workspace_id")
        return self.workspaces.get(ws_id, {"id": ws_id, "name": "Workspace", "description": ""})

    async def tool_list_documents(self, args):
        ws_id = args.get("workspace_id")
        return [d for d in self.documents if not ws_id or d.get("workspace_id") == ws_id]

    async def tool_upload_document(self, args):
        doc_id = str(uuid.uuid4())
        filename = os.path.basename(args.get("filename", args.get("file_path", "uploaded.pdf")))
        doc = {"id": doc_id, "workspace_id": args.get("workspace_id", _WS), "filename": filename, "status": "PROCESSING", "page_count": None, "created_at": _ts(), "knowledge_items_extracted": 0}
        self.documents.append(doc)
        self.activity_log.insert(0, {"id": str(uuid.uuid4()), "type": "workflow_completed", "message": f"Document '{filename}' staged for ingestion.", "timestamp": _ts(), "metadata": {"document_id": doc_id}})
        return {"document_id": doc_id, "workflow_id": str(uuid.uuid4()), "status": "PROCESSING", "document": doc}

    async def tool_delete_document(self, args):
        doc_id = args.get("document_id")
        self.documents = [d for d in self.documents if d["id"] != doc_id]
        return {"status": "DELETED", "document_id": doc_id}

    async def tool_retry_document(self, args):
        doc_id = args.get("document_id")
        for d in self.documents:
            if d["id"] == doc_id:
                d["status"] = "PROCESSING"
        return {"status": "RETRY_QUEUED", "document_id": doc_id}

    async def tool_get_workflow_status(self, args):
        return {"workflow_id": args.get("workflow_id"), "status": "COMPLETED", "progress": 100}

    async def tool_list_workflows(self, args):
        return self.workflows

    async def tool_get_run_metrics(self, args):
        return {"workflow_id": args.get("workflow_id"), "duration_seconds": 12.4, "tokens_used": 2100}

    async def tool_list_proposals(self, args):
        ws_id = args.get("workspace_id")
        status = args.get("status")
        result = [p for p in self.proposals if not ws_id or p.get("workspace_id") == ws_id]
        if status:
            result = [p for p in result if p.get("status", "").upper() == status.upper()]
        return result

    async def tool_list_pending_proposals(self, args):
        ws_id = args.get("workspace_id")
        return [p for p in self.proposals if (not ws_id or p.get("workspace_id") == ws_id) and p.get("status") == "PENDING"]

    async def tool_get_proposal(self, args):
        pid = args.get("proposal_id")
        for p in self.proposals:
            if p["id"] == pid:
                return p
        return {"id": pid, "status": "NOT_FOUND"}

    async def tool_approve_proposal(self, args):
        pid = args.get("proposal_id")
        for p in self.proposals:
            if p["id"] == pid:
                p["status"] = "APPROVED"
                p["reviewed_at"] = _ts()
                changes = p.get("proposed_changes", {})
                item = {"id": str(uuid.uuid4()), "workspace_id": p.get("workspace_id", _WS), "title": changes.get("title") or p.get("summary"), "type": changes.get("type", "CLAIM"), "value": (changes.get("value") or changes.get("proposed", {}).get("value", "Approved Fact")), "confidence": changes.get("confidence", changes.get("proposed", {}).get("confidence", 0.95)), "status": "ACTIVE", "created_at": _ts()}
                self.knowledge_items.append(item)
                self.activity_log.insert(0, {"id": str(uuid.uuid4()), "type": "proposal_approved", "message": f"Knowledge PR merged: '{p['summary']}'", "timestamp": _ts(), "metadata": {"proposal_id": pid}})
                return {"status": "APPROVED", "proposal_id": pid, "knowledge_item_id": item["id"]}
        return {"status": "NOT_FOUND"}

    async def tool_reject_proposal(self, args):
        pid = args.get("proposal_id")
        for p in self.proposals:
            if p["id"] == pid:
                p["status"] = "REJECTED"
                p["reviewed_at"] = _ts()
                self.activity_log.insert(0, {"id": str(uuid.uuid4()), "type": "proposal_created", "message": f"Knowledge PR rejected: '{p['summary']}'", "timestamp": _ts(), "metadata": {"proposal_id": pid}})
                return {"status": "REJECTED", "proposal_id": pid}
        return {"status": "NOT_FOUND"}

    async def tool_archive_proposal(self, args):
        pid = args.get("proposal_id")
        for p in self.proposals:
            if p["id"] == pid:
                p["status"] = "ARCHIVED"
                return {"status": "ARCHIVED", "proposal_id": pid}
        return {"status": "NOT_FOUND"}

    async def tool_batch_review_proposals(self, args):
        decision = args.get("decision", "APPROVED").upper()
        ws_id = args.get("workspace_id")
        results = []
        for p in list(self.proposals):
            if p.get("status") == "PENDING" and (not ws_id or p.get("workspace_id") == ws_id):
                if decision == "APPROVED":
                    await self.tool_approve_proposal({"proposal_id": p["id"]})
                else:
                    await self.tool_reject_proposal({"proposal_id": p["id"]})
                results.append({"proposal_id": p["id"], "decision": decision})
        return {"decision": decision, "processed_count": len(results), "results": results}

    async def tool_get_semantic_diff(self, args):
        ws_id = args.get("workspace_id")
        pending = [p for p in self.proposals if (not ws_id or p.get("workspace_id") == ws_id) and p.get("status") == "PENDING"]
        additions = []
        conflicts = []
        for p in pending:
            pc = p.get("proposed_changes", {})
            p_type = p.get("proposal_type")
            if p_type == "CREATE":
                additions.append({"proposal_id": p["id"], "type": pc.get("type", "CLAIM"), "title": pc.get("title") or p.get("summary"), "proposed_value": pc.get("value"), "confidence": pc.get("confidence", 0.94), "summary": p.get("summary"), "evidence": pc.get("evidence", []), "rationale": p.get("rationale")})
            elif p_type == "UPDATE":
                conflicts.append({"proposal_id": p["id"], "title": pc.get("title") or p.get("summary"), "existing": pc.get("existing", {}), "proposed": pc.get("proposed", {}), "is_conflict": True, "rationale": p.get("rationale"), "type": pc.get("type", "CLAIM")})
        return {"workspace_id": ws_id, "summary": {"total_pending_proposals": len(pending), "additions_count": len(additions), "changes_count": 0, "conflicts_count": len(conflicts), "removals_count": 0}, "additions": additions, "changes": [], "conflicts": conflicts, "removals": []}

    async def tool_validate_proposals(self, args):
        ws_id = args.get("workspace_id")
        pending = [p for p in self.proposals if (not ws_id or p.get("workspace_id") == ws_id) and p.get("status") == "PENDING"]
        validations = []
        violations_count = 0
        for p in pending:
            pc = p.get("proposed_changes", {})
            conf = pc.get("confidence", pc.get("proposed", {}).get("confidence", 0.9))
            if conf < 0.80:
                validations.append({"proposal_id": p["id"], "summary": p.get("summary"), "rule_name": "Confidence Floor Check", "severity": "ERROR", "message": f"Confidence {conf:.2f} is below 0.80 threshold"})
                violations_count += 1
            else:
                validations.append({"proposal_id": p["id"], "summary": p.get("summary"), "rule_name": "Confidence Floor Check", "severity": "PASS", "message": f"Confidence {conf:.2f} passed threshold validation"})
        return {"workspace_id": ws_id, "total_proposals": len(pending), "has_violations": violations_count > 0, "violations_count": violations_count, "validations": validations}

    async def tool_get_knowledge_graph(self, args):
        nodes = []
        edges = []
        for item in self.knowledge_items:
            nodes.append({"id": item["id"], "title": item["title"], "type": item.get("type", "CLAIM"), "value": item.get("value"), "confidence": item.get("confidence", 0.95), "status": item.get("status", "ACTIVE"), "filename": item.get("filename")})
        for p in self.proposals:
            if p.get("status") == "PENDING":
                nodes.append({"id": f"proposal-{p['id']}", "title": f"[PR] {p['summary'][:50]}", "type": "PROPOSAL", "value": str(p.get("proposed_changes", {}).get("value", "")), "confidence": 0.9, "status": "PROPOSED"})
        ki = self.knowledge_items
        for i in range(len(ki) - 1):
            edges.append({"id": f"edge-{i}", "source": ki[i]["id"], "target": ki[i + 1]["id"], "relationship": "RELATED_TO"})
        return {"nodes": nodes, "edges": edges, "stats": {"total_nodes": len(nodes), "total_edges": len(edges)}}

    async def tool_list_knowledge_items(self, args):
        ws_id = args.get("workspace_id")
        status = args.get("status")
        items = [i for i in self.knowledge_items if not ws_id or i.get("workspace_id") == ws_id]
        if status:
            items = [i for i in items if i.get("status", "").upper() == status.upper()]
        return items

    async def tool_list_knowledge(self, args):
        return await self.tool_list_knowledge_items(args)

    async def tool_get_knowledge_item(self, args):
        item_id = args.get("item_id")
        for item in self.knowledge_items:
            if item["id"] == item_id:
                return item
        return {"id": item_id, "status": "NOT_FOUND"}

    async def tool_search_knowledge(self, args):
        query = args.get("query", "").lower()
        if not query:
            return self.knowledge_items
        return [item for item in self.knowledge_items if query in str(item.get("value", "")).lower() or query in str(item.get("title", "")).lower()]

    async def tool_export_knowledge(self, args):
        return {"knowledge_items": self.knowledge_items}

    async def tool_list_rules(self, args):
        ws_id = args.get("workspace_id")
        return [r for r in self.rules if not ws_id or r.get("workspace_id") == ws_id]

    async def tool_create_rule(self, args):
        rule = {"id": str(uuid.uuid4()), "workspace_id": args.get("workspace_id", _WS), "name": args.get("name", "New Policy Rule"), "rule_type": args.get("rule_type", "CUSTOM"), "condition": args.get("condition", {}), "is_blocking": args.get("is_blocking", True), "enabled": True}
        self.rules.append(rule)
        return rule

    async def tool_delete_rule(self, args):
        rid = args.get("rule_id")
        self.rules = [r for r in self.rules if r["id"] != rid]
        return {"status": "DELETED", "rule_id": rid}

    async def tool_enable_rule(self, args):
        rid = args.get("rule_id")
        for r in self.rules:
            if r["id"] == rid:
                r["enabled"] = True
        return {"status": "ok", "rule_id": rid, "enabled": True}

    async def tool_disable_rule(self, args):
        rid = args.get("rule_id")
        for r in self.rules:
            if r["id"] == rid:
                r["enabled"] = False
        return {"status": "ok", "rule_id": rid, "enabled": False}

    async def tool_get_activity_feed(self, args):
        limit = args.get("limit", 50)
        return self.activity_log[:limit]

    async def tool_get_dashboard_stats(self, args):
        ws_id = args.get("workspace_id")
        docs = [d for d in self.documents if not ws_id or d.get("workspace_id") == ws_id]
        props = [p for p in self.proposals if not ws_id or p.get("workspace_id") == ws_id]
        ki = [k for k in self.knowledge_items if not ws_id or k.get("workspace_id") == ws_id]
        pending = [p for p in props if p.get("status") == "PENDING"]
        approved = [p for p in props if p.get("status") == "APPROVED"]
        rejected = [p for p in props if p.get("status") == "REJECTED"]
        return {"workspace_id": ws_id, "total_documents": len(docs), "total_knowledge_items": len(ki), "total_proposals": len(props), "pending_proposals": len(pending), "approved_proposals": len(approved), "rejected_proposals": len(rejected)}

    async def tool_restore_proposal(self, args):
        pid = args.get("proposal_id")
        for p in self.proposals:
            if p["id"] == pid:
                p["status"] = "PENDING"
                return {"status": "ok", "proposal_id": pid, "restored": True}
        return {"status": "NOT_FOUND"}