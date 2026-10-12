/**
 * DiffWeave Production-Grade Parent & Child Template Catalog
 * Accommodates diverse industries from SuperDocs use cases with domain-specific policy rules,
 * truth register configurations, and default visibility.
 */

export const PARENT_CATEGORIES = [
  {
    id: 'legal_title',
    name: 'Legal & Title Insurance',
    icon: 'Scale',
    badge: '2 Templates',
    tagline: 'Contracts, title deeds, Schedule B exceptions & CLM'
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Life Sciences',
    icon: 'Activity',
    badge: '2 Templates',
    tagline: 'Clinical protocols, oncology trials & PHI redaction'
  },
  {
    id: 'engineering',
    name: 'Engineering & Developer Docs',
    icon: 'Code2',
    badge: '2 Templates',
    tagline: 'API specs, OpenAPI sync & architecture RFCs'
  },
  {
    id: 'hr_workforce',
    name: 'HR & Corporate Workforce',
    icon: 'Users',
    badge: '1 Template',
    tagline: 'Offer letters, salary bands & statutory labor codes'
  },
  {
    id: 'finance_compliance',
    name: 'Financial & Regulatory Compliance',
    icon: 'ShieldCheck',
    badge: '1 Template',
    tagline: 'Insurance claims, P&C adjusting & audit trails'
  },
  {
    id: 'general',
    name: 'General Knowledge',
    icon: 'FolderPlus',
    badge: '1 Template',
    tagline: 'Blank slate repository with standard quality gates'
  }
];

export const TEMPLATES_CATALOG = {
  // ---------------------------------------------------------------------------
  // PARENT 1: Legal & Title Insurance
  // ---------------------------------------------------------------------------
  'title-insurance': {
    id: 'title-insurance',
    parentId: 'legal_title',
    parentName: 'Legal & Title Insurance',
    name: 'Title Insurance & Settlement Delivery',
    tagline: 'Schedule B exceptions, tax parcel IDs & escrow clearance',
    description: 'Deterministic title insurance commitments, tax lien clearances, property boundary legal descriptions, and escrow settlement closing rules.',
    defaultVisibility: 'private',
    suggestedSlug: 'title-schedule-b-clearance',
    color: 'emerald',
    icon: 'Building2',
    recommendedFiles: ['.pdf', '.docx', '.txt'],
    policyRules: [
      {
        id: 'rule-title-parcel-id',
        name: 'Mandatory County Tax Parcel ID Citation',
        rule_type: 'PROVENANCE_MANDATORY',
        operator: 'REGEX',
        configuration: { pattern: 'Parcel\\s*(ID|Number|#)?:?\\s*\\d{3}-\\d{3}-\\d{3}' },
        is_blocking: true,
        description: 'Blocks property boundary changes lacking certified County Parcel Tax ID citations.'
      },
      {
        id: 'rule-schedule-b-clearance',
        name: 'Schedule B Lien Clearance Recording Receipt',
        rule_type: 'REQUIRED_FIELD',
        operator: 'EXISTS',
        configuration: { field: 'lien_clearance_recording_id' },
        is_blocking: true,
        description: 'Prevents removal of Schedule B tax liens without an official county recording receipt.'
      },
      {
        id: 'rule-escrow-closing-window',
        name: 'Escrow Settlement Window (48h)',
        rule_type: 'TIMELINE_CONSTRAINT',
        operator: 'LTE',
        configuration: { max_hours: 48 },
        is_blocking: false,
        description: 'Flags settlement closing proration differences exceeding the 48-hour escrow window.'
      },
      {
        id: 'rule-title-confidence-floor',
        name: 'Deed OCR Confidence Floor (90%)',
        rule_type: 'CONFIDENCE_THRESHOLD',
        operator: 'GTE',
        configuration: { min_confidence: 0.90 },
        is_blocking: true,
        description: 'Requires extraction confidence >= 90% for scanned deeds and municipal filings.'
      }
    ],
    truthRegister: {
      heading: 'ASK THE TITLE & SETTLEMENT REGISTER',
      subheading: 'Query property legal descriptions, Schedule B exceptions, and escrow clearance conditions with zero hallucination.',
      placeholder: 'e.g. What are the active Schedule B tax exceptions for parcel 412-880-12?',
      suggestedQueries: [
        'Schedule B tax lien clearance conditions',
        'Parcel boundary and easement restrictions',
        'Escrow proration requirements before closing',
        'Mechanic\'s lien recording status'
      ]
    }
  },

  'legal-clm': {
    id: 'legal-clm',
    parentId: 'legal_title',
    parentName: 'Legal & Title Insurance',
    name: 'Legal Operations & Contract Lifecycle (CLM)',
    tagline: 'SaaS MSAs, indemnification caps & governing jurisdiction',
    description: 'Enterprise commercial agreements, vendor procurement MSAs, NDAs, liability caps, and counter-party redline governance.',
    defaultVisibility: 'private',
    suggestedSlug: 'saas-commercial-msa-audit',
    color: 'amber',
    icon: 'Scale',
    recommendedFiles: ['.docx', '.pdf', '.md'],
    policyRules: [
      {
        id: 'rule-indemnity-cap-guard',
        name: 'Liability Cap Multiplier Guard (<= 2x ACV)',
        rule_type: 'INDEMNITY_CAP_LINT',
        operator: 'LTE',
        configuration: { max_multiple: 2 },
        is_blocking: true,
        description: 'Blocks contract revisions where liability caps exceed 2x annual contract value.'
      },
      {
        id: 'rule-jurisdiction-whitelist',
        name: 'Approved Governing Jurisdiction Whitelist',
        rule_type: 'JURISDICTION_WHITELIST',
        operator: 'IN_SET',
        configuration: { allowed: ['Delaware', 'New York', 'California', 'England and Wales'] },
        is_blocking: true,
        description: 'Enforces governing law venue strictly matches authorized enterprise jurisdictions.'
      },
      {
        id: 'rule-legal-provenance',
        name: 'Mandatory Contract Clause Citation',
        rule_type: 'PROVENANCE_MANDATORY',
        operator: 'EXISTS',
        configuration: { require_source: true },
        is_blocking: true,
        description: 'Requires exact agreement section numbers for all extracted legal covenants.'
      },
      {
        id: 'rule-legal-confidence',
        name: 'Legal Assertion Confidence Floor (88%)',
        rule_type: 'CONFIDENCE_THRESHOLD',
        operator: 'GTE',
        configuration: { min_confidence: 0.88 },
        is_blocking: true,
        description: 'Requires extraction confidence >= 88% for legal obligations and indemnities.'
      }
    ],
    truthRegister: {
      heading: 'ASK THE CONTRACT TRUTH REGISTER',
      subheading: 'Query governing law, indemnification ceilings, and counter-party obligations with zero hallucination.',
      placeholder: 'e.g. What is the aggregate liability ceiling in the master services agreement?',
      suggestedQueries: [
        'Indemnification liability ceiling multiplier',
        'Governing jurisdiction and dispute venue',
        'IP ownership and confidentiality term',
        'Termination for convenience notice window'
      ]
    }
  },

  // ---------------------------------------------------------------------------
  // PARENT 2: Healthcare & Life Sciences
  // ---------------------------------------------------------------------------
  'clinical': {
    id: 'clinical',
    parentId: 'healthcare',
    parentName: 'Healthcare & Life Sciences',
    name: 'Clinical Operations & Healthcare Informatics',
    tagline: 'Standard of care protocols, diagnostic criteria & PHI redaction',
    description: 'Hospital clinical practice guidelines, dosing thresholds, clinical narratives, and HIPAA-compliant de-identification guardrails.',
    defaultVisibility: 'private',
    suggestedSlug: 'hospital-clinical-guidelines',
    color: 'emerald',
    icon: 'HeartPulse',
    recommendedFiles: ['.pdf', '.docx'],
    policyRules: [
      {
        id: 'rule-phi-redaction-gate',
        name: 'Zero-Tolerance PHI / PII Redaction Gate',
        rule_type: 'PHI_PII_GUARD',
        operator: 'NOT_MATCH',
        configuration: { pattern: '\\b(?:\\d{3}-\\d{2}-\\d{4}|MRN-\\d{6,}|\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b)' },
        is_blocking: true,
        description: 'Blocks any clinical claim containing unredacted SSN, MRN, or patient identifiers.'
      },
      {
        id: 'rule-clinical-confidence-floor',
        name: 'Clinical Guideline Confidence Floor (85%)',
        rule_type: 'CONFIDENCE_THRESHOLD',
        operator: 'GTE',
        configuration: { min_confidence: 0.85 },
        is_blocking: true,
        description: 'Requires extraction confidence >= 85% before merge.'
      },
      {
        id: 'rule-clinical-provenance',
        name: 'Mandatory Protocol Provenance Citation',
        rule_type: 'PROVENANCE_MANDATORY',
        operator: 'EXISTS',
        configuration: { require_source: true },
        is_blocking: true,
        description: 'Blocks assertions lacking verifiable hospital protocol or clinical trial citations.'
      }
    ],
    truthRegister: {
      heading: 'ASK THE CLINICAL PROTOCOL REGISTER',
      subheading: 'Test clinical guidelines, diagnostic thresholds, and dosing standards against verified truth.',
      placeholder: 'e.g. What is the severe aortic stenosis mean gradient threshold?',
      suggestedQueries: [
        'Aortic stenosis mean gradient threshold',
        'SGLT2 inhibitors recommendation in heart failure',
        'Standard DAPT duration for high bleeding risk',
        'Adverse event safety escalation timeframe'
      ]
    }
  },

  'trials': {
    id: 'trials',
    parentId: 'healthcare',
    parentName: 'Healthcare & Life Sciences',
    name: 'Clinical Trials & Oncology Protocols',
    tagline: 'Trial endpoints, RECIST criteria & 24h SAE adverse event safety',
    description: 'Clinical trial protocol endpoints, RECIST 1.1 oncology criteria, GCP adverse event reporting, and patient inclusion parameters.',
    defaultVisibility: 'private',
    suggestedSlug: 'oncology-recist-trial-cohort',
    color: 'sky',
    icon: 'FlaskConical',
    recommendedFiles: ['.pdf', '.docx'],
    policyRules: [
      {
        id: 'rule-safety-escalation-sla',
        name: 'GCP Safety Reporting SLA (24h Window)',
        rule_type: 'TIMELINE_CONSTRAINT',
        operator: 'LTE',
        configuration: { max_hours: 24 },
        is_blocking: true,
        description: 'Enforces 24-hour reporting SLA for SAE clinical safety events under GCP.'
      },
      {
        id: 'rule-statistical-claim-rigor',
        name: 'Statistical Significance Verification (p-value)',
        rule_type: 'STATISTICAL_VALIDATION',
        operator: 'REGEX',
        configuration: { pattern: 'p\\s*[<>=]\\s*0\\.\\d+|\\d+%\\s*CI' },
        is_blocking: true,
        description: 'Verifies that quantitative efficacy claims include p-value or 95% confidence intervals.'
      },
      {
        id: 'rule-trial-confidence-floor',
        name: 'Trial Protocol Confidence Floor (90%)',
        rule_type: 'CONFIDENCE_THRESHOLD',
        operator: 'GTE',
        configuration: { min_confidence: 0.90 },
        is_blocking: true,
        description: 'Requires extraction confidence >= 90% for trial outcome metrics.'
      }
    ],
    truthRegister: {
      heading: 'ASK THE CLINICAL TRIALS REGISTER',
      subheading: 'Query primary trial endpoints, RECIST progression criteria, and SAE reporting protocols.',
      placeholder: 'e.g. What is the primary progression-free survival endpoint for Cohort B?',
      suggestedQueries: [
        'Primary progression-free survival endpoint',
        'RECIST v1.1 partial response threshold',
        'SAE reporting SLA escalation window',
        'Inclusion criteria absolute neutrophil count'
      ]
    }
  },

  // ---------------------------------------------------------------------------
  // PARENT 3: Engineering & Developer Docs
  // ---------------------------------------------------------------------------
  'api-docs': {
    id: 'api-docs',
    parentId: 'engineering',
    parentName: 'Engineering & Developer Docs',
    name: 'API Specifications & Developer Docs',
    tagline: 'SemVer deprecation warnings, broken anchors & OpenAPI schemas',
    description: 'Developer documentation, OpenAPI/Swagger contracts, breaking change deprecation schedules, and SDK reference guides.',
    defaultVisibility: 'public',
    suggestedSlug: 'public-api-openapi-spec',
    color: 'cyan',
    icon: 'Terminal',
    recommendedFiles: ['.md', '.json', '.yaml'],
    policyRules: [
      {
        id: 'rule-semver-deprecation-gate',
        name: 'SemVer Sunset & Replacement Route Mandate',
        rule_type: 'SEMVER_DEPRECATION_GATE',
        operator: 'REQUIRED_FIELD',
        configuration: { field: 'replacement_endpoint' },
        is_blocking: true,
        description: 'Deprecated endpoints must include target replacement path and sunset version.'
      },
      {
        id: 'rule-broken-anchor-gate',
        name: 'Documentation Anchor & Link Integrity Gate',
        rule_type: 'BROKEN_ANCHOR_GATE',
        operator: 'REGEX',
        configuration: { pattern: '^https?://|#[a-z0-9_-]+$' },
        is_blocking: true,
        description: 'Ensures internal header anchors and cross-reference doc links resolve cleanly.'
      },
      {
        id: 'rule-api-confidence-floor',
        name: 'API Contract Confidence Floor (85%)',
        rule_type: 'CONFIDENCE_THRESHOLD',
        operator: 'GTE',
        configuration: { min_confidence: 0.85 },
        is_blocking: true,
        description: 'Requires extraction confidence >= 85% for API parameters and payload schemas.'
      }
    ],
    truthRegister: {
      heading: 'ASK THE API SPECIFICATION REGISTER',
      subheading: 'Query REST/GraphQL endpoints, payload contracts, and error status codes with zero hallucination.',
      placeholder: 'e.g. What is the rate limit ceiling and retry-after header for /v2/query?',
      suggestedQueries: [
        'Rate limit ceiling and quota headers',
        'OAuth2 bearer token refresh endpoint',
        'Deprecated v1 endpoints and sunset dates',
        'JSON schema error response format'
      ]
    }
  },

  'engineering': {
    id: 'engineering',
    parentId: 'engineering',
    parentName: 'Engineering & Developer Docs',
    name: 'Architecture Decision Records (ADRs) & RFCs',
    tagline: 'Microservice contracts, security baselines & SLA limits',
    description: 'System architecture RFCs, distributed microservice contracts, zero-trust security baselines, and cloud SLA targets.',
    defaultVisibility: 'private',
    suggestedSlug: 'cloud-architecture-adr-ledger',
    color: 'indigo',
    icon: 'Cpu',
    recommendedFiles: ['.md', '.txt'],
    policyRules: [
      {
        id: 'rule-adr-status-required',
        name: 'Mandatory RFC Decision Status Declaration',
        rule_type: 'REQUIRED_FIELD',
        operator: 'EXISTS',
        configuration: { field: 'decision_status' },
        is_blocking: true,
        description: 'Architecture RFC proposals must declare APPROVED, PROPOSED, or DEPRECATED status.'
      },
      {
        id: 'rule-security-baseline-lint',
        name: 'Zero-Trust Encryption Baseline Advisory',
        rule_type: 'REGEX_FORMAT',
        operator: 'REGEX',
        configuration: { pattern: '(?:mTLS|OAuth2|ZeroTrust|AES-256|TLS\\s*1\\.[23])' },
        is_blocking: false,
        description: 'Advises if cross-service communication omits modern encryption protocols.'
      },
      {
        id: 'rule-rfc-confidence',
        name: 'Architecture Fact Confidence Floor (85%)',
        rule_type: 'CONFIDENCE_THRESHOLD',
        operator: 'GTE',
        configuration: { min_confidence: 0.85 },
        is_blocking: true,
        description: 'Requires extraction confidence >= 85% for architectural invariants.'
      }
    ],
    truthRegister: {
      heading: 'ASK THE ARCHITECTURE DECISION REGISTER',
      subheading: 'Query system architecture RFCs, service dependencies, and infrastructure SLAs with zero hallucination.',
      placeholder: 'e.g. What is the latency SLA requirement for the message ingestion pipeline?',
      suggestedQueries: [
        'Service ingestion latency SLA requirement',
        'Event broker partitioning strategy',
        'Database failover and RTO/RPO targets',
        'Zero-trust mTLS encryption requirement'
      ]
    }
  },

  // ---------------------------------------------------------------------------
  // PARENT 4: HR & Workforce Compliance
  // ---------------------------------------------------------------------------
  'employment-offers': {
    id: 'employment-offers',
    parentId: 'hr_workforce',
    parentName: 'HR & Corporate Workforce',
    name: 'Employment Agreements & Offer Letters',
    tagline: 'Salary band ceilings, state non-compete bans & equity vesting',
    description: 'Executive offer letters, compensation packages, statutory labor code compliance, and equity acceleration provisions.',
    defaultVisibility: 'private',
    suggestedSlug: 'executive-offer-letters-2026',
    color: 'violet',
    icon: 'Briefcase',
    recommendedFiles: ['.pdf', '.docx'],
    policyRules: [
      {
        id: 'rule-compensation-ceiling',
        name: 'Approved Salary Band Ceiling Gate',
        rule_type: 'COMPENSATION_BAND_GUARD',
        operator: 'LTE',
        configuration: { max_salary: 350000 },
        is_blocking: true,
        description: 'Flags offer proposals exceeding authorized band limits without executive override.'
      },
      {
        id: 'rule-statutory-noncompete-ban',
        name: 'Statutory Non-Compete Prohibition Lint',
        rule_type: 'STATUTORY_LABOR_LINT',
        operator: 'NOT_MATCH',
        configuration: { disallow: 'non-compete' },
        is_blocking: true,
        description: 'Blocks non-compete covenants in California and statutory-restricted jurisdictions.'
      },
      {
        id: 'rule-offer-confidence',
        name: 'Offer Terms Confidence Floor (90%)',
        rule_type: 'CONFIDENCE_THRESHOLD',
        operator: 'GTE',
        configuration: { min_confidence: 0.90 },
        is_blocking: true,
        description: 'Requires extraction confidence >= 90% for compensation, title, and start dates.'
      }
    ],
    truthRegister: {
      heading: 'ASK THE WORKFORCE COMPLIANCE REGISTER',
      subheading: 'Query approved salary bands, state statutory labor clauses, and standard equity vesting terms with zero hallucination.',
      placeholder: 'e.g. What is the standard 4-year vesting schedule with 1-year cliff?',
      suggestedQueries: [
        'Standard 4-year equity vesting schedule',
        'California statutory non-compete prohibition',
        'Severance payout calculation formula',
        'IP assignment and invention disclosure terms'
      ]
    }
  },

  // ---------------------------------------------------------------------------
  // PARENT 5: Financial & Regulatory Compliance
  // ---------------------------------------------------------------------------
  'insurance-claims': {
    id: 'insurance-claims',
    parentId: 'finance_compliance',
    parentName: 'Financial & Regulatory Compliance',
    name: 'Insurance Claims & Loss Documentation',
    tagline: 'Loss date boundaries, policy coverage limits & evidence audit',
    description: 'Property & Casualty claims, adjuster narratives, date-of-loss policy verification, subrogation records, and fraud detection.',
    defaultVisibility: 'private',
    suggestedSlug: 'pc-claims-adjuster-ledger',
    color: 'blue',
    icon: 'FileCheck2',
    recommendedFiles: ['.pdf', '.docx', '.txt'],
    policyRules: [
      {
        id: 'rule-loss-date-boundary',
        name: 'Date-of-Loss Policy Coverage Window',
        rule_type: 'LOSS_DATE_BOUND_CHECK',
        operator: 'DATE_RANGE',
        configuration: { valid_range: 'coverage_period' },
        is_blocking: true,
        description: 'Verifies incident date of loss falls strictly within active policy effective dates.'
      },
      {
        id: 'rule-claims-evidence-provenance',
        name: 'Mandatory Claim Adjuster Evidence Citation',
        rule_type: 'PROVENANCE_MANDATORY',
        operator: 'EXISTS',
        configuration: { require_source: true },
        is_blocking: true,
        description: 'Requires certified adjuster report or evidence photo citation for every loss claim.'
      },
      {
        id: 'rule-claims-confidence',
        name: 'Claim Statement Confidence Floor (88%)',
        rule_type: 'CONFIDENCE_THRESHOLD',
        operator: 'GTE',
        configuration: { min_confidence: 0.88 },
        is_blocking: true,
        description: 'Requires extraction confidence >= 88% for claim liability assessments.'
      }
    ],
    truthRegister: {
      heading: 'ASK THE CLAIMS KNOWLEDGE REGISTER',
      subheading: 'Query policy coverage limits, deductible thresholds, and adjustor evidence requirements with zero hallucination.',
      placeholder: 'e.g. What is the collision deductible for commercial policy FL-882?',
      suggestedQueries: [
        'Commercial fleet collision deductible limit',
        'Loss date coverage verification rules',
        'Subrogation recovery protocol steps',
        'Third-party bodily injury liability caps'
      ]
    }
  },

  // ---------------------------------------------------------------------------
  // PARENT 6: General / Blank
  // ---------------------------------------------------------------------------
  'empty': {
    id: 'empty',
    parentId: 'general',
    parentName: 'General Knowledge',
    name: 'Blank Knowledge Register',
    tagline: 'Clean slate for custom documents, markdown files & specs',
    description: 'Unconfigured workspace with core baseline CI linting rules, ready for documents staged via CLI or drag-and-drop.',
    defaultVisibility: 'private',
    suggestedSlug: 'verified-knowledge-vault',
    color: 'slate',
    icon: 'FolderPlus',
    recommendedFiles: ['.txt', '.md', '.pdf', '.docx'],
    policyRules: [
      {
        id: 'rule-generic-confidence-floor',
        name: 'Extraction Confidence Floor (85%)',
        rule_type: 'CONFIDENCE_THRESHOLD',
        operator: 'GTE',
        configuration: { min_confidence: 0.85 },
        is_blocking: true,
        description: 'Requires extraction confidence >= 85% before merge.'
      },
      {
        id: 'rule-generic-provenance-mandatory',
        name: 'Mandatory Provenance Citation',
        rule_type: 'PROVENANCE_MANDATORY',
        operator: 'EXISTS',
        configuration: { require_source: true },
        is_blocking: true,
        description: 'Blocks assertions lacking verifiable document section citations.'
      }
    ],
    truthRegister: {
      heading: 'ASK THE TRUTH REGISTER (GROUNDED RAG ASSISTANT)',
      subheading: 'Query verified document facts with deterministic grounding and zero hallucination.',
      placeholder: 'e.g. Search any verified fact, assertion, or document claim...',
      suggestedQueries: [
        'Summary of ingested document claims',
        'Highest confidence verified assertions',
        'Recent knowledge PR revisions',
        'Provenance source document citations'
      ]
    }
  }
};

/**
 * Helper to get template metadata safely
 */
export function getTemplateMeta(templateId) {
  const clean = (templateId || '').toLowerCase().trim();
  if (TEMPLATES_CATALOG[clean]) return TEMPLATES_CATALOG[clean];

  // Fuzzy match if needed
  if (clean.includes('title')) return TEMPLATES_CATALOG['title-insurance'];
  if (clean.includes('legal') || clean.includes('contract')) return TEMPLATES_CATALOG['legal-clm'];
  if (clean.includes('trial') || clean.includes('oncology')) return TEMPLATES_CATALOG['trials'];
  if (clean.includes('api') || clean.includes('openapi')) return TEMPLATES_CATALOG['api-docs'];
  if (clean.includes('engineer') || clean.includes('rfc')) return TEMPLATES_CATALOG['engineering'];
  if (clean.includes('offer') || clean.includes('hr')) return TEMPLATES_CATALOG['employment-offers'];
  if (clean.includes('claim') || clean.includes('insurance')) return TEMPLATES_CATALOG['insurance-claims'];
  if (clean.includes('clinical') || clean.includes('health')) return TEMPLATES_CATALOG['clinical'];

  return TEMPLATES_CATALOG['empty'];
}
