# Slice 04 — Executable skills and bounded tools

## Contract

The Skills UI exposes versioned server-owned skill definitions. A selected skill enables a bounded pre-inference context action and response policy over request-supplied context. No skill text is executed as code.

## API and ownership seam

- `GET /api/chat/skills` returns stable IDs, version, description, and bounded context-action IDs; registry is canonical in backend.
- Chat request includes selected `skillIds`; the shared schema rejects unknown IDs, duplicates, and excess entries.
- `document-grounding` searches only request-supplied chapter metadata and passes bounded matches to the model as untrusted data; `workspace-context` inspects only request-supplied instructions and filenames; `executive-directness` applies a response-format policy.
- No iterative provider tool-call loop, server filesystem access, network access, mutations, or model-defined tool arguments are in scope.

## Human-visible surface

Users activate/deactivate skills per chat. The chat displays bounded execution traces. Customize separately labels saved instructions as prompt templates.

## Verification

Unsupported skill IDs and duplicate IDs are schema-rejected. Unit coverage verifies selected-only execution, matching and fallback chapter selection, missing context, and bounded context handling. Provider-driven iterative tool calls remain a future capability.

## Delegated choices

Tool internals and wording are delegated within the fixed read-only capability boundary. No shell, arbitrary filesystem, external network, provider credential access, or mutating tools.

## Must stay green

Regular chat works with zero skills selected. Existing chapter and project context remains available.
