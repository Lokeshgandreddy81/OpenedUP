# Frontend

The frontend is a React single-page application. The app shell owns route composition and shared browser integrations; product screens, state, data, and UI belong to feature folders under `src/features/`. Feature-to-feature dependencies go through the owning feature's public entry point, and the browser imports shared schemas only from `backend/contracts/`.

Route-level screens and large catalog entries should load on demand. Keep loading and error states at the boundary where a user can recover without losing unrelated work.

Run Vite from the repository root with `npm run dev:frontend`. The root [README](../README.md) documents setup and verification; [the repository modernization plan](../specs/repo-modernization/README.md) tracks unfinished boundary and performance work.
