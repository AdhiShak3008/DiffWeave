# DiffWeave 🧶 — GitHub for Document Knowledge

> **A Git-like developer platform for AI document intelligence, turning unstructured document changes into semantic commits, pull requests, and 3-way fact diffs.**

DiffWeave is built on top of the **DocWeave** document intelligence engine via the **Model Context Protocol (MCP)**. Where DocWeave acts as the deep extraction and reconciliation engine ( Git plumbing), **DiffWeave** serves as the developer-facing platform (GitHub porcelain) comprising:

1. **dw (Command Line Interface)**: A high-velocity, Git-modeled CLI for staging documents, inspecting semantic diffs, validating CI policies, and committing approved facts to the Master Knowledge Register.
2. **DiffWeave Studio (Web UI)**: A modern, dark-mode visual interface with a 3-way Semantic Fact Diff viewer, Knowledge PR Review deck, interactive Knowledge Graph topology, and Policy Rules lab.

---

## Architecture Overview

`
                      +---------------------------------------+
                      |        DiffWeave Ecosystem            |
                      +-------------------+-------------------+
                                          |
               +--------------------------+--------------------------+
               |                                                     |
    +----------v----------+                               +----------v----------+
    |   DiffWeave CLI     |                               |  DiffWeave Studio   |
    |      (dw)         |                               |   (React 18 + Vite) |
    +----------+----------+                               +----------+----------+
               |                                                     |
               |                                          +----------v----------+
               |                                          |  FastAPI Bridge     |
               |                                          |  (REST Endpoints)   |
               |                                          +----------+----------+
               |                                                     |
               +--------------------------+--------------------------+
                                          |
                      +-------------------v-------------------+
                      |       DiffWeave MCP Client            |
                      |   (Stdio / In-Process Fast Adapter)   |
                      +-------------------+-------------------+
                                          |
                      +-------------------v-------------------+
                      |       DocWeave MCP Server             |
                      |      (29 Model Context Tools)         |
                      +-------------------+-------------------+
                                          |
               +--------------------------+--------------------------+
               |                                                     |
    +----------v----------+                               +----------v----------+
    |  Extraction Engine  |                               |  Neon PostgreSQL    |
    |  & Embedding Models |                               |  Master Knowledge   |
    +---------------------+                               +---------------------+
`

---

## Quickstart

### 1. Requirements
- Python 3.10+
- Node.js 18+ (for Studio UI)
- DocWeave engine backend

### 2. CLI Setup
Run diagnostic checks to verify connectivity to DocWeave:

`ash
# Verify system and MCP health
.\dw.bat doctor

# Initialize or bind your workspace
.\dw.bat init --workspace 4314fb04-95be-41a2-bef4-50bf27c9c363

# Check workspace status
.\dw.bat status
`

### 3. Stage & Ingest Documents (dw add)
Stage a document into the ingestion pipeline:

`ash
.\dw.bat add sample_test_docs\doc1_clinical_protocol_baseline.txt
`

### 4. Semantic Diffs & PR Reviews
Once DocWeave completes proposal extraction:

`ash
# Inspect pending proposals (PRs)
.\dw.bat proposals

# View 3-way semantic diff against committed master truth
.\dw.bat diff

# Run CI policy validation rules
.\dw.bat validate

# Interactively review proposals (approve / reject / archive)
.\dw.bat review

# Or commit all approved proposals
.\dw.bat commit --all-approved
`

---

## DiffWeave Studio (Web UI)

DiffWeave Studio offers a rich visual dashboard for team review:

- **3-Way Semantic Fact Diff**: Side-by-side view showing baseline truth, proposed extractions, and conflict highlights.
- **Knowledge PR Deck**: One-click approvals, rejections, or archival with confidence scores and reasoning.
- **Interactive Knowledge Graph**: SVG-based topological visualization of entities, relationships, and confidence thresholds.
- **Policy Rules Lab**: Add and test deterministic validation rules (e.g., regex constraints, type checks).
- **Master Knowledge Base**: Searchable register of all committed facts with audit trail logs.

### Running Studio
`ash
# Option A: Start the full-stack bridge server (Serves UI + API on port 8000)
python -m diffweave.bridge.app

# Option B: Run Vite development server with hot-module reloading
cd studio
npm run dev
`

Visit http://localhost:8000 (or http://localhost:5173 if running Vite dev server).

---

## CLI Command Reference

| Command | Description |
|---|---|
| dw init | Initialize .diffweave/ context or bind to existing workspace |
| dw add <path> | Stage and trigger document ingestion workflow |
| dw status | Display workspace summary, tracked documents, and pending reviews |
| dw proposals | List and inspect extracted knowledge proposals |
| dw diff | Render 3-way semantic fact diffs with confidence scoring |
| dw validate | Execute workspace policy rules and display pass/warn/fail lint table |
| dw review | Interactive terminal wizard to approve, reject, or archive proposals |
| dw commit | Promote approved proposals into Master Knowledge Register |
| dw log | Chronological audit trail of document updates and state transitions |
| dw search <query> | Hybrid search across committed knowledge entities |
| dw rules | List, add, or delete automated validation rules |
| dw doctor | Diagnose MCP connectivity, environment, and tool coverage |

---

## Directory Structure

`
DiffWeave/
├── diffweave/
│   ├── cli/             # dw command line tool (Click / Typer + Rich)
│   ├── mcp/             # MCP client adapter & DocWeave integration
│   └── bridge/          # FastAPI bridge server for Studio Web UI
├── studio/              # React 18 + TailwindCSS + Vite Web UI
│   ├── src/
│   │   ├── components/  # SemanticDiffViewer, PRReviewDeck, Graph, etc.
│   │   ├── api/         # Studio REST client
│   │   └── App.jsx      # Navigation, Workspace Switcher, State
│   └── dist/            # Production bundle (built and ready to serve)
├── sample_test_docs/    # Example documents for clinical trial protocol diffing
├── dw.bat               # Windows batch launcher for instant CLI access
├── pyproject.toml       # Python package configuration
└── README.md            # Platform documentation
`
