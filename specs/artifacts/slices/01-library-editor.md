# Slice 01 — Library and editor

## Contract

The library lists actual saved artifacts, supports category and text search, and makes create, open, edit, copy, export, history, restore, delete, and sharing state explicit. Documents are readable Markdown; code is shown as source with its language. HTML preview is isolated from the app origin.

## Boundaries

- Reuse `useArtifacts`, account API, SQLite repository, and the current artifact/version contracts.
- Remove the no-op filter control; don't replace it with fake behavior.
- Keep ownership enforcement server-side. Shared items remain read-only for recipients.
- Code language and extension must agree. Unknown languages export as `.txt` rather than pretending to be TypeScript.

## Checkpoint

Open an existing artifact, switch between preview/edit, save a revision, restore an earlier version, copy and export it; create a new document and code artifact; verify empty, loading, signed-out, and sync/save error states.
