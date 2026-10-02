---
title: DiffWeave
emoji: 🧶
colorFrom: green
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# DiffWeave 🧶 — GitHub for Document Knowledge

> **A Git-like developer platform for AI document intelligence, turning unstructured document changes into semantic commits, pull requests, and 3-way fact diffs.**

DiffWeave is built on top of the **DocWeave** document intelligence engine via the **Model Context Protocol (MCP)**. Where DocWeave acts as the deep extraction and reconciliation engine ("Git plumbing"), **DiffWeave** serves as the developer-facing platform ("GitHub porcelain") comprising:

1. **`dw` (Command Line Interface)**: A high-velocity, Git-modeled CLI for staging documents, inspecting semantic diffs, validating CI policies, and committing approved facts to the Master Knowledge Register.
2. **DiffWeave Studio (Web UI)**: A MAANG-grade visual interface with a 3-way Semantic Fact Diff viewer, Knowledge PR Review deck, interactive Knowledge Graph topology, and Policy Rules lab.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |        DiffWeave Ecosystem            |
                      +-------------------+-------------------+
                                          |
               +--------------------------+--------------------------+
               |                                                     |
    +----------v----------+                               +----------v----------+
    |   DiffWeave CLI     |                               |  DiffWeave Studio   |
    |      (`dw`)         |                               |   (React 18 + Vite) |
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
                      |   (Stdio / Remote HTTPS / In-Process) |
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
```

---

## Quickstart

### 1. Requirements & Environment Configuration
- Python 3.10+
- Node.js 18+ (for Studio UI development)
- DocWeave engine backend (or run in standalone / remote cloud mode)

Copy `.env.example` to `.env` to configure your environment:
```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL connection string (shared with DocWeave) | `postgresql://...` |
| `SECRET_KEY` | JWT secret for token verification (shared with DocWeave) | `b1c482a...` |
| `DOCWEAVE_MCP_URL` | Remote DocWeave MCP server URL (for deployed cloud mode) | `https://your-docweave.hf.space` |
| `DOCWEAVE_API_KEY` | Personal Access Token (for CI/CD or automated pipelines) | `dw_pat_...` |
| `DOCWEAVE_BACKEND_DIR` | Path to local DocWeave backend (for in-process dev) | `../DocWeave/backend` |
| `DIFFWEAVE_WORKSPACE_ID`| Default workspace ID to bind | `3e24fa72-b6c2-4427-9e44-b26a997fd205` |
| `PORT` | DiffWeave Studio port | `7860` |

### 2. CLI Setup
Run diagnostic checks to verify connectivity to DocWeave:

```bash
# Verify system and MCP health
.\dw.bat doctor

# Authenticate session (or use 1-click demo login)
.\dw.bat login --demo

# Initialize or bind your workspace
.\dw.bat init --workspace 4314fb04-95be-41a2-bef4-50bf27c9c363

# Check workspace status
.\dw.bat status
```

### 3. Stage & Ingest Documents (`dw add`)
Stage a document into the ingestion pipeline:

```bash
.\dw.bat add sample_test_docs\doc1_clinical_protocol_baseline.txt
```

### 4. Semantic Diffs & PR Reviews
Once DocWeave completes proposal extraction:

```bash
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
```

---

## DiffWeave Studio (Web UI)

DiffWeave Studio offers a rich visual dashboard for team review:

- **3-Way Semantic Fact Diff**: Side-by-side view showing baseline truth, proposed extractions, and conflict highlights with word-level delta tags.
- **Knowledge PR Deck**: One-click approvals, rejections, or archival with confidence scores, reviewer notes, and celebratory confetti.
- **Interactive Knowledge Graph**: SVG-based topological visualization of entities, relationships, and confidence thresholds with zoom/pan and node inspector drawer.
- **Policy Rules Lab**: Policy-as-Code engine with dry-run CI linter suite.
- **Master Knowledge Base**: Searchable register of all committed facts with JSON export and instant copy.
- **Git Audit Trail**: Cryptographically verifiable commit timeline with verification badges.

### Running Studio
```bash
# Full-Stack Bridge Server (Serves UI + API on port 7860 or 8000)
python -m diffweave.bridge.app

# Vite Development Server (with hot-module reloading)
cd studio
npm run dev
```

Visit `http://localhost:7860` (or `http://localhost:5174` for Vite dev server).

---

## Hugging Face Spaces Deployment

DiffWeave is pre-configured for instant **1-click Docker deployment** on Hugging Face Spaces:

1. Create a new Space on [Hugging Face Spaces](https://huggingface.co/new-space).
2. Select **Docker** as the Space SDK.
3. Push or sync this repository to your Hugging Face Space git remote:
   ```bash
   git remote add hf https://huggingface.co/spaces/<your-username>/DiffWeave
   git push hf main
   ```
4. Configure Secrets / Environment Variables (optional, for remote DocWeave connection):
   - `DOCWEAVE_MCP_URL`: `https://<your-docweave-space>.hf.space`
   - `DOCWEAVE_API_KEY`: `<your_access_token>`
5. Your full-stack DiffWeave Studio will automatically build and launch on port `7860`!

---

## CLI Command Reference

| Command | Description |
|---|---|
| `dw login` | Authenticate with DocWeave via email/password, demo, or API token |
| `dw logout` | Log out and revoke stored session credentials |
| `dw whoami` | Display active user identity, token preview, and bound workspace |
| `dw init` | Initialize `.diffweave/` context or bind to existing workspace |
| `dw add <path>` | Stage and trigger document ingestion workflow |
| `dw status` | Display workspace summary, tracked documents, and pending reviews |
| `dw proposals` | List and inspect extracted knowledge proposals |
| `dw diff` | Render 3-way semantic fact diffs with confidence scoring |
| `dw validate` | Execute workspace policy rules and display pass/warn/fail lint table |
| `dw review` | Interactive terminal wizard to approve, reject, or archive proposals |
| `dw commit` | Promote approved proposals into Master Knowledge Register |
| `dw log` | Chronological audit trail of document updates and state transitions |
| `dw search <query>` | Hybrid search across committed knowledge entities |
| `dw rules` | List, add, or delete automated validation rules |
| `dw doctor` | Diagnose MCP connectivity, environment, and tool coverage |

---

## Directory Structure

```
DiffWeave/
├── Dockerfile           # Multi-stage production build for Hugging Face Spaces
├── .dockerignore        # Optimized Docker build context
├── diffweave/
│   ├── cli/             # dw command line tool (Click / Typer + Rich)
│   ├── mcp/             # MCP client adapter & DocWeave integration
│   └── bridge/          # FastAPI bridge server for Studio Web UI
├── studio/              # React 18 + TailwindCSS + Lucide Icons + Vite Web UI
│   ├── src/
│   │   ├── components/  # SemanticDiffViewer, PRReviewDeck, Graph, etc.
│   │   ├── api/         # Studio REST client with Bearer auth
│   │   └── App.jsx      # Navigation, Workspace Switcher, State
│   └── dist/            # Production bundle (compiled and ready to serve)
├── sample_test_docs/    # Example documents for clinical trial protocol diffing
├── dw.bat               # Windows batch launcher for instant CLI access
├── pyproject.toml       # Python package configuration
└── README.md            # Platform documentation with Hugging Face metadata
```
