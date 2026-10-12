"""
DiffWeave Template Catalog & Policy Rules Manifest
Parent Categories & Specialized Child Templates with domain-specific policy rules,
truth register configurations, and default access visibility.
"""

from typing import Any

TEMPLATES_CATALOG: dict[str, dict[str, Any]] = {
    # -------------------------------------------------------------------------
    # PARENT 1: Legal & Title Insurance
    # -------------------------------------------------------------------------
    "title-insurance": {
        "id": "title-insurance",
        "parent_id": "legal_title",
        "parent_name": "Legal & Title Insurance",
        "name": "Title Insurance & Settlement Delivery",
        "tagline": "Schedule B exceptions, tax parcel IDs & escrow clearance",
        "description": "Deterministic title insurance commitments, tax lien clearances, property boundary legal descriptions, and escrow settlement closing rules.",
        "default_visibility": "private",
        "recommended_files": [".pdf", ".docx", ".txt"],
        "policy_rules": [
            {
                "id": "rule-title-parcel-id",
                "name": "Mandatory County Tax Parcel ID Citation",
                "rule_type": "PROVENANCE_MANDATORY",
                "operator": "REGEX",
                "configuration": {"pattern": r"Parcel\s*(?:ID|Number|#)?:?\s*\d{3}-\d{3}-\d{3}"},
                "is_blocking": True,
                "description": "Blocks property boundary changes lacking certified County Parcel Tax ID citations."
            },
            {
                "id": "rule-schedule-b-clearance",
                "name": "Schedule B Lien Clearance Recording Receipt",
                "rule_type": "REQUIRED_FIELD",
                "operator": "EXISTS",
                "configuration": {"field": "lien_clearance_recording_id"},
                "is_blocking": True,
                "description": "Prevents removal of Schedule B tax liens without an official county recording receipt."
            },
            {
                "id": "rule-escrow-closing-window",
                "name": "Escrow Settlement Window (48h)",
                "rule_type": "TIMELINE_CONSTRAINT",
                "operator": "LTE",
                "configuration": {"max_hours": 48},
                "is_blocking": False,
                "description": "Flags settlement closing proration differences exceeding the 48-hour escrow window."
            },
            {
                "id": "rule-title-confidence-floor",
                "name": "Deed OCR Confidence Floor (90%)",
                "rule_type": "CONFIDENCE_THRESHOLD",
                "operator": "GTE",
                "configuration": {"min_confidence": 0.90},
                "is_blocking": True,
                "description": "Requires extraction confidence >= 90% for scanned deeds and municipal filings."
            }
        ],
        "truth_register": {
            "heading": "ASK THE TITLE & SETTLEMENT REGISTER",
            "subheading": "Query property legal descriptions, Schedule B exceptions, and escrow clearance conditions with zero hallucination.",
            "placeholder": "e.g. What are the active Schedule B tax exceptions for parcel 412-880-12?",
            "suggested_queries": [
                "Schedule B tax lien clearance conditions",
                "Parcel boundary and easement restrictions",
                "Escrow proration requirements before closing",
                "Mechanic's lien recording status"
            ]
        }
    },

    "legal-clm": {
        "id": "legal-clm",
        "parent_id": "legal_title",
        "parent_name": "Legal & Title Insurance",
        "name": "Legal Operations & Contract Lifecycle (CLM)",
        "tagline": "SaaS MSAs, indemnification caps & governing jurisdiction",
        "description": "Enterprise commercial agreements, vendor procurement MSAs, NDAs, liability caps, and counter-party redline governance.",
        "default_visibility": "private",
        "recommended_files": [".docx", ".pdf", ".md"],
        "policy_rules": [
            {
                "id": "rule-indemnity-cap-guard",
                "name": "Liability Cap Multiplier Guard (<= 2x ACV)",
                "rule_type": "INDEMNITY_CAP_LINT",
                "operator": "LTE",
                "configuration": {"max_multiple": 2},
                "is_blocking": True,
                "description": "Blocks contract revisions where liability caps exceed 2x annual contract value."
            },
            {
                "id": "rule-jurisdiction-whitelist",
                "name": "Approved Governing Jurisdiction Whitelist",
                "rule_type": "JURISDICTION_WHITELIST",
                "operator": "IN_SET",
                "configuration": {"allowed": ["Delaware", "New York", "California", "England and Wales"]},
                "is_blocking": True,
                "description": "Enforces governing law venue strictly matches authorized enterprise jurisdictions."
            },
            {
                "id": "rule-legal-provenance",
                "name": "Mandatory Contract Clause Citation",
                "rule_type": "PROVENANCE_MANDATORY",
                "operator": "EXISTS",
                "configuration": {"require_source": True},
                "is_blocking": True,
                "description": "Requires exact agreement section numbers for all extracted legal covenants."
            },
            {
                "id": "rule-legal-confidence",
                "name": "Legal Assertion Confidence Floor (88%)",
                "rule_type": "CONFIDENCE_THRESHOLD",
                "operator": "GTE",
                "configuration": {"min_confidence": 0.88},
                "is_blocking": True,
                "description": "Requires extraction confidence >= 88% for legal obligations and indemnities."
            }
        ],
        "truth_register": {
            "heading": "ASK THE CONTRACT TRUTH REGISTER",
            "subheading": "Query governing law, indemnification ceilings, and counter-party obligations with zero hallucination.",
            "placeholder": "e.g. What is the aggregate liability ceiling in the master services agreement?",
            "suggested_queries": [
                "Indemnification liability ceiling multiplier",
                "Governing jurisdiction and dispute venue",
                "IP ownership and confidentiality term",
                "Termination for convenience notice window"
            ]
        }
    },

    # -------------------------------------------------------------------------
    # PARENT 2: Healthcare & Life Sciences
    # -------------------------------------------------------------------------
    "clinical": {
        "id": "clinical",
        "parent_id": "healthcare",
        "parent_name": "Healthcare & Life Sciences",
        "name": "Clinical Operations & Healthcare Informatics",
        "tagline": "Standard of care protocols, diagnostic criteria & PHI redaction",
        "description": "Hospital clinical practice guidelines, dosing thresholds, clinical narratives, and HIPAA-compliant de-identification guardrails.",
        "default_visibility": "private",
        "recommended_files": [".pdf", ".docx"],
        "policy_rules": [
            {
                "id": "rule-phi-redaction-gate",
                "name": "Zero-Tolerance PHI / PII Redaction Gate",
                "rule_type": "PHI_PII_GUARD",
                "operator": "NOT_MATCH",
                "configuration": {"pattern": r"\b(?:\d{3}-\d{2}-\d{4}|MRN-\d{6,}|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)"},
                "is_blocking": True,
                "description": "Blocks any clinical claim containing unredacted SSN, MRN, or patient identifiers."
            },
            {
                "id": "rule-clinical-confidence-floor",
                "name": "Clinical Guideline Confidence Floor (85%)",
                "rule_type": "CONFIDENCE_THRESHOLD",
                "operator": "GTE",
                "configuration": {"min_confidence": 0.85},
                "is_blocking": True,
                "description": "Requires extraction confidence >= 85% before merge."
            },
            {
                "id": "rule-clinical-provenance",
                "name": "Mandatory Protocol Provenance Citation",
                "rule_type": "PROVENANCE_MANDATORY",
                "operator": "EXISTS",
                "configuration": {"require_source": True},
                "is_blocking": True,
                "description": "Blocks assertions lacking verifiable hospital protocol or clinical trial citations."
            }
        ],
        "truth_register": {
            "heading": "ASK THE CLINICAL PROTOCOL REGISTER",
            "subheading": "Test clinical guidelines, diagnostic thresholds, and dosing standards against verified truth.",
            "placeholder": "e.g. What is the severe aortic stenosis mean gradient threshold?",
            "suggested_queries": [
                "Aortic stenosis mean gradient threshold",
                "SGLT2 inhibitors recommendation in heart failure",
                "Standard DAPT duration for high bleeding risk",
                "Adverse event safety escalation timeframe"
            ]
        }
    },

    "trials": {
        "id": "trials",
        "parent_id": "healthcare",
        "parent_name": "Healthcare & Life Sciences",
        "name": "Clinical Trials & Oncology Protocols",
        "tagline": "Trial endpoints, RECIST criteria & 24h SAE adverse event safety",
        "description": "Clinical trial protocol endpoints, RECIST 1.1 oncology criteria, GCP adverse event reporting, and patient inclusion parameters.",
        "default_visibility": "private",
        "recommended_files": [".pdf", ".docx"],
        "policy_rules": [
            {
                "id": "rule-safety-escalation-sla",
                "name": "GCP Safety Reporting SLA (24h Window)",
                "rule_type": "TIMELINE_CONSTRAINT",
                "operator": "LTE",
                "configuration": {"max_hours": 24},
                "is_blocking": True,
                "description": "Enforces 24-hour reporting SLA for SAE clinical safety events under GCP."
            },
            {
                "id": "rule-statistical-claim-rigor",
                "name": "Statistical Significance Verification (p-value)",
                "rule_type": "STATISTICAL_VALIDATION",
                "operator": "REGEX",
                "configuration": {"pattern": r"p\s*[<>=]\s*0\.\d+|\d+%\s*CI"},
                "is_blocking": True,
                "description": "Verifies that quantitative efficacy claims include p-value or 95% confidence intervals."
            },
            {
                "id": "rule-trial-confidence-floor",
                "name": "Trial Protocol Confidence Floor (90%)",
                "rule_type": "CONFIDENCE_THRESHOLD",
                "operator": "GTE",
                "configuration": {"min_confidence": 0.90},
                "is_blocking": True,
                "description": "Requires extraction confidence >= 90% for trial outcome metrics."
            }
        ],
        "truth_register": {
            "heading": "ASK THE CLINICAL TRIALS REGISTER",
            "subheading": "Query primary trial endpoints, RECIST progression criteria, and SAE reporting protocols.",
            "placeholder": "e.g. What is the primary progression-free survival endpoint for Cohort B?",
            "suggested_queries": [
                "Primary progression-free survival endpoint",
                "RECIST v1.1 partial response threshold",
                "SAE reporting SLA escalation window",
                "Inclusion criteria absolute neutrophil count"
            ]
        }
    },

    # -------------------------------------------------------------------------
    # PARENT 3: Engineering & Developer Docs
    # -------------------------------------------------------------------------
    "api-docs": {
        "id": "api-docs",
        "parent_id": "engineering",
        "parent_name": "Engineering & Developer Docs",
        "name": "API Specifications & Developer Docs",
        "tagline": "SemVer deprecation warnings, broken anchors & OpenAPI schemas",
        "description": "Developer documentation, OpenAPI/Swagger contracts, breaking change deprecation schedules, and SDK reference guides.",
        "default_visibility": "public",
        "recommended_files": [".md", ".json", ".yaml", ".openapi"],
        "policy_rules": [
            {
                "id": "rule-semver-deprecation-gate",
                "name": "SemVer Sunset & Replacement Route Mandate",
                "rule_type": "SEMVER_DEPRECATION_GATE",
                "operator": "REQUIRED_FIELD",
                "configuration": {"field": "replacement_endpoint"},
                "is_blocking": True,
                "description": "Deprecated endpoints must include target replacement path and sunset version."
            },
            {
                "id": "rule-broken-anchor-gate",
                "name": "Documentation Anchor & Link Integrity Gate",
                "rule_type": "BROKEN_ANCHOR_GATE",
                "operator": "REGEX",
                "configuration": {"pattern": r"^https?://|#[a-z0-9_-]+$"},
                "is_blocking": True,
                "description": "Ensures internal header anchors and cross-reference doc links resolve cleanly."
            },
            {
                "id": "rule-api-confidence-floor",
                "name": "API Contract Confidence Floor (85%)",
                "rule_type": "CONFIDENCE_THRESHOLD",
                "operator": "GTE",
                "configuration": {"min_confidence": 0.85},
                "is_blocking": True,
                "description": "Requires extraction confidence >= 85% for API parameters and payload schemas."
            }
        ],
        "truth_register": {
            "heading": "ASK THE API SPECIFICATION REGISTER",
            "subheading": "Query REST/GraphQL endpoints, payload contracts, and error status codes with zero hallucination.",
            "placeholder": "e.g. What is the rate limit ceiling and retry-after header for /v2/query?",
            "suggested_queries": [
                "Rate limit ceiling and quota headers",
                "OAuth2 bearer token refresh endpoint",
                "Deprecated v1 endpoints and sunset dates",
                "JSON schema error response format"
            ]
        }
    },

    "engineering": {
        "id": "engineering",
        "parent_id": "engineering",
        "parent_name": "Engineering & Developer Docs",
        "name": "Architecture Decision Records (ADRs) & RFCs",
        "tagline": "Microservice contracts, security baselines & SLA limits",
        "description": "System architecture RFCs, distributed microservice contracts, zero-trust security baselines, and cloud SLA targets.",
        "default_visibility": "private",
        "recommended_files": [".md", ".txt"],
        "policy_rules": [
            {
                "id": "rule-adr-status-required",
                "name": "Mandatory RFC Decision Status Declaration",
                "rule_type": "REQUIRED_FIELD",
                "operator": "EXISTS",
                "configuration": {"field": "decision_status"},
                "is_blocking": True,
                "description": "Architecture RFC proposals must declare APPROVED, PROPOSED, or DEPRECATED status."
            },
            {
                "id": "rule-security-baseline-lint",
                "name": "Zero-Trust Encryption Baseline Advisory",
                "rule_type": "REGEX_FORMAT",
                "operator": "REGEX",
                "configuration": {"pattern": r"(?:mTLS|OAuth2|ZeroTrust|AES-256|TLS\s*1\.[23])"},
                "is_blocking": False,
                "description": "Advises if cross-service communication omits modern encryption protocols."
            },
            {
                "id": "rule-rfc-confidence",
                "name": "Architecture Fact Confidence Floor (85%)",
                "rule_type": "CONFIDENCE_THRESHOLD",
                "operator": "GTE",
                "configuration": {"min_confidence": 0.85},
                "is_blocking": True,
                "description": "Requires extraction confidence >= 85% for architectural invariants."
            }
        ],
        "truth_register": {
            "heading": "ASK THE ARCHITECTURE DECISION REGISTER",
            "subheading": "Query system architecture RFCs, service dependencies, and infrastructure SLAs with zero hallucination.",
            "placeholder": "e.g. What is the latency SLA requirement for the message ingestion pipeline?",
            "suggested_queries": [
                "Service ingestion latency SLA requirement",
                "Event broker partitioning strategy",
                "Database failover and RTO/RPO targets",
                "Zero-trust mTLS encryption requirement"
            ]
        }
    },

    # -------------------------------------------------------------------------
    # PARENT 4: HR & Workforce Compliance
    # -------------------------------------------------------------------------
    "employment-offers": {
        "id": "employment-offers",
        "parent_id": "hr_workforce",
        "parent_name": "HR & Corporate Workforce",
        "name": "Employment Agreements & Offer Letters",
        "tagline": "Salary band ceilings, state non-compete bans & equity vesting",
        "description": "Executive offer letters, compensation packages, statutory labor code compliance, and equity acceleration provisions.",
        "default_visibility": "private",
        "recommended_files": [".pdf", ".docx"],
        "policy_rules": [
            {
                "id": "rule-compensation-ceiling",
                "name": "Approved Salary Band Ceiling Gate",
                "rule_type": "COMPENSATION_BAND_GUARD",
                "operator": "LTE",
                "configuration": {"max_salary": 350000},
                "is_blocking": True,
                "description": "Flags offer proposals exceeding authorized band limits without executive override."
            },
            {
                "id": "rule-statutory-noncompete-ban",
                "name": "Statutory Non-Compete Prohibition Lint",
                "rule_type": "STATUTORY_LABOR_LINT",
                "operator": "NOT_MATCH",
                "configuration": {"disallow": "non-compete"},
                "is_blocking": True,
                "description": "Blocks non-compete covenants in California and statutory-restricted jurisdictions."
            },
            {
                "id": "rule-offer-confidence",
                "name": "Offer Terms Confidence Floor (90%)",
                "rule_type": "CONFIDENCE_THRESHOLD",
                "operator": "GTE",
                "configuration": {"min_confidence": 0.90},
                "is_blocking": True,
                "description": "Requires extraction confidence >= 90% for compensation, title, and start dates."
            }
        ],
        "truth_register": {
            "heading": "ASK THE WORKFORCE COMPLIANCE REGISTER",
            "subheading": "Query approved salary bands, state statutory labor clauses, and standard equity vesting terms with zero hallucination.",
            "placeholder": "e.g. What is the standard 4-year vesting schedule with 1-year cliff?",
            "suggested_queries": [
                "Standard 4-year equity vesting schedule",
                "California statutory non-compete prohibition",
                "Severance payout calculation formula",
                "IP assignment and invention disclosure terms"
            ]
        }
    },

    # -------------------------------------------------------------------------
    # PARENT 5: Financial & Regulatory Compliance
    # -------------------------------------------------------------------------
    "insurance-claims": {
        "id": "insurance-claims",
        "parent_id": "finance_compliance",
        "parent_name": "Financial & Regulatory Compliance",
        "name": "Insurance Claims & Loss Documentation",
        "tagline": "Loss date boundaries, policy coverage limits & evidence audit",
        "description": "Property & Casualty claims, adjuster narratives, date-of-loss policy verification, subrogation records, and fraud detection.",
        "default_visibility": "private",
        "recommended_files": [".pdf", ".docx", ".txt"],
        "policy_rules": [
            {
                "id": "rule-loss-date-boundary",
                "name": "Date-of-Loss Policy Coverage Window",
                "rule_type": "LOSS_DATE_BOUND_CHECK",
                "operator": "DATE_RANGE",
                "configuration": {"valid_range": "coverage_period"},
                "is_blocking": True,
                "description": "Verifies incident date of loss falls strictly within active policy effective dates."
            },
            {
                "id": "rule-claims-evidence-provenance",
                "name": "Mandatory Claim Adjuster Evidence Citation",
                "rule_type": "PROVENANCE_MANDATORY",
                "operator": "EXISTS",
                "configuration": {"require_source": True},
                "is_blocking": True,
                "description": "Requires certified adjuster report or evidence photo citation for every loss claim."
            },
            {
                "id": "rule-claims-confidence",
                "name": "Claim Statement Confidence Floor (88%)",
                "rule_type": "CONFIDENCE_THRESHOLD",
                "operator": "GTE",
                "configuration": {"min_confidence": 0.88},
                "is_blocking": True,
                "description": "Requires extraction confidence >= 88% for claim liability assessments."
            }
        ],
        "truth_register": {
            "heading": "ASK THE CLAIMS KNOWLEDGE REGISTER",
            "subheading": "Query policy coverage limits, deductible thresholds, and adjustor evidence requirements with zero hallucination.",
            "placeholder": "e.g. What is the collision deductible for commercial policy FL-882?",
            "suggested_queries": [
                "Commercial fleet collision deductible limit",
                "Loss date coverage verification rules",
                "Subrogation recovery protocol steps",
                "Third-party bodily injury liability caps"
            ]
        }
    },

    # -------------------------------------------------------------------------
    # PARENT 6: General / Blank
    # -------------------------------------------------------------------------
    "empty": {
        "id": "empty",
        "parent_id": "general",
        "parent_name": "General Knowledge",
        "name": "Blank Knowledge Register",
        "tagline": "Clean slate for custom documents, markdown files & specs",
        "description": "Unconfigured workspace with core baseline CI linting rules, ready for documents staged via CLI or drag-and-drop.",
        "default_visibility": "private",
        "recommended_files": [".txt", ".md", ".pdf", ".docx"],
        "policy_rules": [
            {
                "id": "rule-generic-confidence-floor",
                "name": "Extraction Confidence Floor (85%)",
                "rule_type": "CONFIDENCE_THRESHOLD",
                "operator": "GTE",
                "configuration": {"min_confidence": 0.85},
                "is_blocking": True,
                "description": "Requires extraction confidence >= 85% before merge."
            },
            {
                "id": "rule-generic-provenance-mandatory",
                "name": "Mandatory Provenance Citation",
                "rule_type": "PROVENANCE_MANDATORY",
                "operator": "EXISTS",
                "configuration": {"require_source": True},
                "is_blocking": True,
                "description": "Blocks assertions lacking verifiable document section citations."
            }
        ],
        "truth_register": {
            "heading": "ASK THE TRUTH REGISTER (GROUNDED RAG ASSISTANT)",
            "subheading": "Query verified document facts with deterministic grounding and zero hallucination.",
            "placeholder": "e.g. Search any verified fact, assertion, or document claim...",
            "suggested_queries": [
                "Summary of ingested document claims",
                "Highest confidence verified assertions",
                "Recent knowledge PR revisions",
                "Provenance source document citations"
            ]
        }
    }
}

PARENT_CATEGORIES: list[dict[str, Any]] = [
    {
        "id": "legal_title",
        "name": "Legal & Title Insurance",
        "icon": "Scale",
        "tagline": "Contracts, title deeds, Schedule B exceptions & CLM",
        "count": 2,
    },
    {
        "id": "healthcare",
        "name": "Healthcare & Life Sciences",
        "icon": "Activity",
        "tagline": "Clinical protocols, oncology trials & PHI redaction",
        "count": 2,
    },
    {
        "id": "engineering",
        "name": "Engineering & Developer Docs",
        "icon": "Code2",
        "tagline": "API specs, OpenAPI sync & architecture RFCs",
        "count": 2,
    },
    {
        "id": "hr_workforce",
        "name": "HR & Corporate Workforce",
        "icon": "Users",
        "tagline": "Offer letters, salary bands & statutory labor codes",
        "count": 1,
    },
    {
        "id": "finance_compliance",
        "name": "Financial & Regulatory Compliance",
        "icon": "ShieldCheck",
        "tagline": "Insurance claims, P&C adjusting & audit trails",
        "count": 1,
    },
    {
        "id": "general",
        "name": "General Knowledge",
        "icon": "FolderPlus",
        "tagline": "Blank slate repository with standard quality gates",
        "count": 1,
    },
]


def get_template(template_id: str) -> dict[str, Any]:
    """Retrieve template definition by ID or return empty template default."""
    clean_id = (template_id or "").strip().lower()
    return TEMPLATES_CATALOG.get(clean_id) or TEMPLATES_CATALOG["empty"]


def get_template_policy_rules(template_id: str) -> list[dict[str, Any]]:
    """Get list of policy rules configured for a template."""
    tmpl = get_template(template_id)
    return tmpl.get("policy_rules", [])
