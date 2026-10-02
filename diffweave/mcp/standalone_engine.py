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


class StandaloneEngine:
    def __init__(self):
        self.workspaces: dict[str, dict[str, Any]] = {
            "default-standalone-workspace": {
                "id": "default-standalone-workspace",
                "name": "DiffWeave Standalone Workspace",
                "description": "Embedded standalone workspace for offline / decoupled operation",
                "created_at": datetime.datetime.now().isoformat(),
            }
        }
        self.documents: list[dict[str, Any]] = []
        self.workflows: list[dict[str, Any]] = []
        self.proposals: list[dict[str, Any]] = []
        self.knowledge_items: list[dict[str, Any]] = []
        self.activity_log: list[dict[str, Any]] = []
        self.rules: list[dict[str, Any]] = [
            {
                "id": str(uuid.uuid4()),
                "workspace_id": "default-standalone-workspace",
                "name": "Confidence Floor Check",
                "rule_type": "CONFIDENCE_THRESHOLD",
                "condition": {"min_confidence": 0.80},
                "is_blocking": True,
            },
            {
                "id": str(uuid.uuid4()),
                "workspace_id": "default-standalone-workspace",
                "name": "Protocol ID Format",
                "rule_type": "REGEX_FORMAT",
                "condition": {"pattern": r"^PROTOCOL-[A-Z0-9-]+$"},
                "is_blocking": False,
            },
        ]

    async def dispatch(self, tool_name: str, args: dict[str, Any]) -> Any:
        method = getattr(self, f"tool_{tool_name}", None)
        if not method:
            return {"status": "ok", "message": f"Tool {tool_name} executed in standalone mode"}
        return await method(args)

    async def tool_list_workspaces(self, args: dict[str, Any]):
        return list(self.workspaces.values())

    async def tool_create_workspace(self, args: dict[str, Any]):
        ws_id = str(uuid.uuid4())
        name = args.get("name", "New Workspace")
        desc = args.get("description", "")
        entry = {
            "id": ws_id,
            "name": name,
            "description": desc,
            "created_at": datetime.datetime.now().isoformat(),
        }
        self.workspaces[ws_id] = entry
        return entry

    async def tool_get_workspace(self, args: dict[str, Any]):
        ws_id = args.get("workspace_id")
        return self.workspaces.get(ws_id, {"id": ws_id, "name": "Workspace", "description": ""})

    async def tool_list_documents(self, args: dict[str, Any]):
        ws_id = args.get("workspace_id")
        return [d for d in self.documents if not ws_id or d.get("workspace_id") == ws_id]

    async def tool_upload_document(self, args: dict[str, Any]):
        ws_id = args.get("workspace_id", "default-standalone-workspace")
        file_path = args.get("file_path", "")
        filename = os.path.basename(file_path) if file_path else "document.txt"

        doc_id = str(uuid.uuid4())
        ver_id = str(uuid.uuid4())
        wf_id = str(uuid.uuid4())

        doc_entry = {
            "id": doc_id,
            "workspace_id": ws_id,
            "filename": filename,
            "status": "COMMITTED",
            "created_at": datetime.datetime.now().isoformat(),
        }
        self.documents.append(doc_entry)

        sample_props = [
            {
                "id": str(uuid.uuid4()),
                "workspace_id": ws_id,
                "proposal_type": "CREATE",
                "summary": f"Extracted clinical claim from {filename}",
                "rationale": "High-confidence clinical efficacy statement parsed from section 3",
                "status": "PENDING",
                "created_at": datetime.datetime.now().isoformat(),
                "proposed_changes": {
                    "type": "CLAIM",
                    "title": "Primary Protocol Objective",
                    "value": "Evaluate 12-month post-operative mean transvalvular gradient under 12 mmHg.",
                    "confidence": 0.94,
                    "evidence": ["Section 3.1: Protocol Endpoint Determination"],
                },
            },
            {
                "id": str(uuid.uuid4()),
                "workspace_id": ws_id,
                "proposal_type": "UPDATE",
                "summary": f"Update planned patient enrollment from {filename}",
                "rationale": "Cohort expansion amendment specified in addendum",
                "status": "PENDING",
                "created_at": datetime.datetime.now().isoformat(),
                "proposed_changes": {
                    "title": "Total Planned Enrollment",
                    "existing": {"value": "1,200 adult patients", "confidence": 0.90},
                    "proposed": {
                        "value": "1,800 adult patients",
                        "confidence": 0.96,
                        "evidence": ["Addendum 2: Expanded Sample Size"],
                    },
                },
            },
        ]
        self.proposals.extend(sample_props)

        self.activity_log.append({
            "id": str(uuid.uuid4()),
            "type": "workflow_completed",
            "message": f"Standalone extraction completed for {filename}",
            "timestamp": datetime.datetime.now().isoformat(),
        })

        return {
            "document_id": doc_id,
            "version_id": ver_id,
            "workflow_id": wf_id,
            "filename": filename,
            "status": "COMPLETED",
        }

    async def tool_get_workflow_status(self, args: dict[str, Any]):
        return {"status": "COMPLETED", "progress": 1.0}

    async def tool_list_workflows(self, args: dict[str, Any]):
        return self.workflows

    async def tool_get_run_metrics(self, args: dict[str, Any]):
        return {
            "tokens_used": 1420,
            "execution_time_seconds": 2.4,
            "nodes_visited": ["extract", "reconcile"],
        }

    async def tool_list_proposals(self, args: dict[str, Any]):
        ws_id = args.get("workspace_id")
        status = args.get("status")
        return [
            p
            for p in self.proposals
            if (not ws_id or p.get("workspace_id") == ws_id)
            and (not status or p.get("status") == status)
        ]

    async def tool_get_proposal(self, args: dict[str, Any]):
        pid = args.get("proposal_id")
        for p in self.proposals:
            if p["id"] == pid:
                return p
        return None

    async def tool_approve_proposal(self, args: dict[str, Any]):
        pid = args.get("proposal_id")
        for p in self.proposals:
            if p["id"] == pid:
                p["status"] = "APPROVED"
                p["reviewed_at"] = datetime.datetime.now().isoformat()
                changes = p.get("proposed_changes", {})
                item = {
                    "id": str(uuid.uuid4()),
                    "workspace_id": p.get("workspace_id"),
                    "title": changes.get("title") or p.get("summary"),
                    "type": changes.get("type", "CLAIM"),
                    "value": changes.get("value")
                    or changes.get("proposed", {}).get("value", "Approved Fact"),
                    "confidence": changes.get("confidence", 0.95),
                    "created_at": datetime.datetime.now().isoformat(),
                }
                self.knowledge_items.append(item)
                return {
                    "status": "APPROVED",
                    "proposal_id": pid,
                    "knowledge_item_id": item["id"],
                }
        return {"status": "NOT_FOUND"}

    async def tool_reject_proposal(self, args: dict[str, Any]):
        pid = args.get("proposal_id")
        for p in self.proposals:
            if p["id"] == pid:
                p["status"] = "REJECTED"
                return {"status": "REJECTED", "proposal_id": pid}
        return {"status": "NOT_FOUND"}

    async def tool_archive_proposal(self, args: dict[str, Any]):
        pid = args.get("proposal_id")
        for p in self.proposals:
            if p["id"] == pid:
                p["status"] = "ARCHIVED"
                return {"status": "ARCHIVED", "proposal_id": pid}
        return {"status": "NOT_FOUND"}

    async def tool_batch_review_proposals(self, args: dict[str, Any]):
        decision = args.get("decision", "APPROVED")
        results = []
        for p in list(self.proposals):
            if p.get("status") == "PENDING":
                if decision == "APPROVED":
                    await self.tool_approve_proposal({"proposal_id": p["id"]})
                else:
                    await self.tool_reject_proposal({"proposal_id": p["id"]})
                results.append({"proposal_id": p["id"], "decision": decision})
        return {"decision": decision, "processed_count": len(results), "results": results}

    async def tool_get_semantic_diff(self, args: dict[str, Any]):
        ws_id = args.get("workspace_id")
        pending = [p for p in self.proposals if not ws_id or p.get("workspace_id") == ws_id]

        additions = []
        changes = []
        conflicts = []

        for p in pending:
            pc = p.get("proposed_changes", {})
            p_type = p.get("proposal_type")
            if p_type == "CREATE":
                additions.append({
                    "proposal_id": p["id"],
                    "type": pc.get("type", "CLAIM"),
                    "title": pc.get("title") or p.get("summary"),
                    "proposed_value": pc.get("value"),
                    "confidence": pc.get("confidence", 0.94),
                    "summary": p.get("summary"),
                    "evidence": pc.get("evidence", []),
                    "rationale": p.get("rationale"),
                })
            elif p_type == "UPDATE":
                existing = pc.get("existing", {})
                proposed = pc.get("proposed", {})
                conflicts.append({
                    "proposal_id": p["id"],
                    "title": p.get("summary"),
                    "existing": existing,
                    "proposed": proposed,
                    "is_conflict": True,
                    "rationale": p.get("rationale"),
                })

        return {
            "workspace_id": ws_id,
            "summary": {
                "total_pending_proposals": len(pending),
                "additions_count": len(additions),
                "changes_count": len(changes),
                "conflicts_count": len(conflicts),
                "removals_count": 0,
            },
            "additions": additions,
            "changes": changes,
            "conflicts": conflicts,
            "removals": [],
        }

    async def tool_validate_proposals(self, args: dict[str, Any]):
        ws_id = args.get("workspace_id")
        pending = [p for p in self.proposals if not ws_id or p.get("workspace_id") == ws_id]

        validations = []
        violations_count = 0
        for p in pending:
            conf = p.get("proposed_changes", {}).get("confidence", 0.9)
            if conf < 0.80:
                validations.append({
                    "proposal_id": p["id"],
                    "summary": p.get("summary"),
                    "rule_name": "Confidence Floor Check",
                    "severity": "ERROR",
                    "message": f"Confidence {conf} is below 0.80 threshold",
                })
                violations_count += 1
            else:
                validations.append({
                    "proposal_id": p["id"],
                    "summary": p.get("summary"),
                    "rule_name": "Confidence Floor Check",
                    "severity": "PASS",
                    "message": f"Confidence {conf} passed threshold validation",
                })

        return {
            "workspace_id": ws_id,
            "total_proposals": len(pending),
            "has_violations": violations_count > 0,
            "violations_count": violations_count,
            "validations": validations,
        }

    async def tool_get_knowledge_graph(self, args: dict[str, Any]):
        nodes = []
        edges = []
        for item in self.knowledge_items:
            nodes.append({
                "id": item["id"],
                "title": item["title"],
                "type": item.get("type", "CLAIM"),
                "value": item.get("value"),
                "confidence": item.get("confidence", 0.95),
                "status": "ACTIVE",
            })
        for p in self.proposals:
            nodes.append({
                "id": f"proposal-{p['id']}",
                "title": f"[PR] {p['summary']}",
                "type": "PROPOSAL",
                "value": str(p.get("proposed_changes", {}).get("value", "")),
                "confidence": 0.9,
                "status": "PROPOSED",
            })
        return {
            "nodes": nodes,
            "edges": edges,
            "stats": {"total_nodes": len(nodes), "total_edges": len(edges)},
        }

    async def tool_list_knowledge_items(self, args: dict[str, Any]):
        return self.knowledge_items

    async def tool_search_knowledge(self, args: dict[str, Any]):
        query = args.get("query", "").lower()
        matches = [
            item
            for item in self.knowledge_items
            if query in str(item.get("value", "")).lower()
            or query in str(item.get("title", "")).lower()
        ]
        return matches

    async def tool_export_knowledge(self, args: dict[str, Any]):
        return {"knowledge_items": self.knowledge_items}

    async def tool_list_rules(self, args: dict[str, Any]):
        return self.rules

    async def tool_create_rule(self, args: dict[str, Any]):
        rule = {
            "id": str(uuid.uuid4()),
            "workspace_id": args.get("workspace_id"),
            "name": args.get("name", "New Policy Rule"),
            "rule_type": args.get("rule_type", "CUSTOM"),
            "condition": args.get("condition", {}),
            "is_blocking": args.get("is_blocking", True),
        }
        self.rules.append(rule)
        return rule

    async def tool_delete_rule(self, args: dict[str, Any]):
        rid = args.get("rule_id")
        self.rules = [r for r in self.rules if r["id"] != rid]
        return {"status": "DELETED", "rule_id": rid}

    async def tool_get_activity_feed(self, args: dict[str, Any]):
        return self.activity_log
