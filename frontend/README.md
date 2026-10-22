# @charan-interiors/frontend

Enterprise React 19 Single Page Application for receipt reconciliation, AI document segmentation, interactive roadmap visualization, and model intelligence benchmarks.

## Architecture

```
frontend/
├── src/
│   ├── assets/          # SVG icons and static branding assets
│   ├── components/      # React components (Landing, Results, ProofPanel, Roadmap, Chat)
│   ├── utils/           # Client-side engine, image pre-processor, workspace sync
│   ├── test/            # Vitest + React Testing Library unit tests
│   ├── types.ts         # Frontend application types
│   ├── App.tsx          # Root application component
│   └── main.tsx         # React root mounting
├── public/              # Static assets, creator logos, icons
├── tests/
│   └── e2e/             # Playwright browser end-to-end smoke tests
├── Dockerfile           # Multi-stage production container with Nginx
├── index.html           # HTML5 shell
├── package.json
├── tsconfig.json
└── vite.config.ts       # Vite 8 build & reverse proxy configuration
```

## Available Scripts

- `npm run dev` - Start local Vite development server with HMR on `http://localhost:5173`
- `npm run build` - Bundle client application for production into `dist/`
- `npm run preview` - Serve local production build preview
- `npm run typecheck` - Run TypeScript compiler checks (`tsc --noEmit`)
- `npm run test` - Run unit tests with Vitest and JSDOM
- `npm run test:coverage` - Run unit tests with V8 coverage reporting
- `npm run e2e` - Run Playwright end-to-end tests across browser engines

## Features

- **Shoebox Engine**: Instant client-side deduplication, category totals, and tax invoice reconciliation.
- **Multimodal Document Canvas**: View side-by-side bounding boxes for every extracted receipt line item.
- **Interactive Roadmap**: Visual graph canvas with XYFlow displaying chapter progression and milestones.
- **Benchmarks Suite**: Frontier LLM comparison, coding agent latency/cost tradeoff, and Pareto frontiers.
