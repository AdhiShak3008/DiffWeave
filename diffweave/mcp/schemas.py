"""
Pydantic schemas for DiffWeave data representations.
"""
from typing import Any, Optional
from pydantic import BaseModel, Field


class WorkspaceInfo(BaseModel):
    id: str
    name: str
    description: Optional[str] = None


class DocumentInfo(BaseModel):
    document_id: str
    filename: str
    version_id: Optional[str] = None
    file_type: Optional[str] = None
    created_at: Optional[str] = None
    status: Optional[str] = None
    workflow_id: Optional[str] = None
    workflow_status: Optional[str] = None


class ProposalInfo(BaseModel):
    proposal_id: str
    workspace_id: str
    knowledge_item_id: Optional[str] = None
    proposal_type: str
    status: str
    summary: str
    rationale: Optional[str] = None
    proposed_changes: dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[str] = None


class SemanticDiffSummary(BaseModel):
    total_pending_proposals: int = 0
    additions_count: int = 0
    changes_count: int = 0
    conflicts_count: int = 0
    removals_count: int = 0


class SemanticDiffResult(BaseModel):
    workspace_id: str
    summary: SemanticDiffSummary
    additions: list[dict[str, Any]] = Field(default_factory=list)
    changes: list[dict[str, Any]] = Field(default_factory=list)
    conflicts: list[dict[str, Any]] = Field(default_factory=list)
    removals: list[dict[str, Any]] = Field(default_factory=list)


class KnowledgeGraphNode(BaseModel):
    id: str
    title: str
    type: str
    value: Optional[str] = None
    summary: Optional[str] = None
    confidence: Optional[float] = 1.0
    status: Optional[str] = None
    filename: Optional[str] = None
    created_at: Optional[str] = None


class KnowledgeGraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str
    confidence: Optional[float] = 1.0


class KnowledgeGraphResult(BaseModel):
    workspace_id: str
    nodes: list[KnowledgeGraphNode] = Field(default_factory=list)
    edges: list[KnowledgeGraphEdge] = Field(default_factory=list)
    stats: dict[str, int] = Field(default_factory=dict)


class ValidationResult(BaseModel):
    workspace_id: str
    rules_total: int
    rules_enabled: int
    proposals_evaluated: int
    compliant: bool
    summary: dict[str, int] = Field(default_factory=dict)
    results: list[dict[str, Any]] = Field(default_factory=list)
