# Frontend Client Application

The frontend client application is a modern, responsive single-page web app built with **React 19**, **Vite 8**, **Tailwind CSS 4**, and **TypeScript**. It provides a comprehensive interface for expense tracking, receipt analysis, interactive roadmaps, and LLM frontier benchmarks.

---

## Architecture & Directory Layout

```
frontend/
├── index.html           # HTML entry point & font links
├── metadata.json        # App metadata and icon configuration
├── public/              # Static public assets (vendor logos, brand icons)
│   └── img/logos/       # Comprehensive AI provider & model logos
├── src/
│   ├── assets/          # Internal SVG and PNG artwork
│   ├── components/      # Modular view components
│   │   ├── benchmarks/  # LLM leaderboards, Pareto curves, model modal
│   │   ├── chat/        # Assistant chat, artifact inspector, attachments
│   │   ├── projects/    # Project sessions & workspace views
│   │   ├── roadmap/     # XYFlow interactive roadmap nodes & canvas
│   │   ├── scheduled/   # Automated scheduled tasks & cron monitors
│   │   └── ui/          # Reusable design primitives (buttons, tooltips, cards)
│   ├── utils/           # Client-side algorithms & processing utilities
│   │   ├── chapterSorting.ts    # Document chapter hierarchy sorting
│   │   ├── engine.ts            # Client analytics calculation engine
│   │   ├── imageProcessor.ts    # Client-side image prep & HEIC conversion
│   │   ├── roadmapEngine.ts     # Dagre auto-layout graph solver
│   │   └── workspaceLiveSync.ts # Real-time state synchronization
│   ├── App.tsx          # Root routing and navigation shell
│   ├── main.tsx         # DOM mount and root entry point
│   ├── index.css        # Tailwind CSS 4 theme and global tokens
│   └── types.ts         # Central TypeScript interfaces & view contracts
├── tests/
│   ├── unit/            # Vitest component & hook tests
│   └── e2e/             # Playwright browser end-to-end scenarios
└── README.md            # Frontend client documentation
```

---

## Key Feature Modules

### 1. Frontier Intelligence & LLM Benchmarks (`components/benchmarks/`)

- Interactive leaderboards ranking state-of-the-art models (OpenAI, Anthropic, Google, DeepSeek, Meta, Mistral, and more).
- Multimodal Image Arena with side-by-side generation and evaluation comparisons.
- Interactive Pareto frontier charts plotting price vs. coding and reasoning performance.
- Search and filtering across provider, modality, release date, and context window.

### 2. Expense & Receipts Assistant (`components/chat/`)

- Shoebox receipt parsing: upload receipts, invoices, or utility bills for instant OCR analysis.
- Multi-turn conversational interface with document context retention.
- Artifact inspector panel displaying rendered JSON data tables, markdown summaries, and financial charts.

### 3. Interactive Roadmap Canvas (`components/roadmap/`)

- Node-and-edge visual graph powered by `@xyflow/react` and `@dagrejs/dagre`.
- Automatic hierarchical layout computation for complex dependency trees.
- Topic nodes, milestone checkpoints, and interactive progress tracking.

### 4. Scheduled Workflows (`components/scheduled/`)

- Schedule automated financial audits and receipt summarizations.
- Status badges and execution history logs.

---

## Tech Stack & Dependencies

| Layer         | Technology                | Details                                                       |
| :------------ | :------------------------ | :------------------------------------------------------------ |
| **Framework** | React 19                  | Leveraging Actions, optimistic updates, and strict typing     |
| **Bundler**   | Vite 8                    | Ultra-fast Hot Module Replacement (HMR) and roll-up packaging |
| **Styling**   | Tailwind CSS 4            | Utility-first CSS using the new lightningcss engine           |
| **Graphing**  | XYFlow + Dagre            | Declarative canvas node rendering and DAG layout computation  |
| **Animation** | Motion (Framer)           | Spring physics and transition primitives                      |
| **Icons**     | Lucide React              | Clean, tree-shakeable SVG icon set                            |
| **Testing**   | Vitest + RTL + Playwright | Unit, DOM integration, and end-to-end browser coverage        |

---

## Environment Configuration

Configure client environment variables in `.env` (or pass via build environment):

| Variable                | Default                 | Description                                  |
| :---------------------- | :---------------------- | :------------------------------------------- |
| `VITE_API_BASE_URL`     | `http://localhost:3000` | Target URL for backend API requests          |
| `VITE_ENABLE_MOCK_DATA` | `false`                 | Enable fallback local mock data when offline |

---

## Development Scripts

Run the following commands from the workspace root or inside `frontend/`:

```bash
# Start Vite development server with HMR
npm run dev

# Run TypeScript compilation check
npm run typecheck

# Run unit tests
npm test

# Run component test suite with coverage
npm run test:coverage

# Build optimized client assets to dist/
npm run build:client

# Preview local production build
npm run preview
```
