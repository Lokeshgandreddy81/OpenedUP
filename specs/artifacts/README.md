# Artifacts: from storage to a working library

## Current state

Slices 04–06 are implemented. Account-wide organization sync uses an additive SQLite migration; recoverable drafts remain local and are scoped by signed-in user and artifact. The existing signed-in-only sharing boundary and local fallback/import behavior remain.

- **Checks run:** `npm run typecheck` and `npm run build` pass. Automated tests were not run. Visual browser review is unavailable in this environment.
- **Next pickup:** manually verify new flows in a browser at desktop and narrow widths, especially recovery drafts, owner-only metadata edits, cross-device organization sync, and backup restore counts.
- **Known limitation:** backup restore currently skips records by stable backup ID, and file import saves before opening the item for preview/editing.
- **Do not add:** public links, seeded/demo artifacts, comments, collaborative editing, or extra artifact categories.

## Goal

Make saved documents and code earn their place in the product: students should be able to organize and find useful work, revise it safely, bring existing notes into Shoebox, and move a complete library in or out without losing content.

## Existing foundation (already implemented)

1. Create and revise documents/code with safe Markdown rendering and isolated HTML preview.
2. Search titles and content; filter by category and Yours/Shared; recent edits appear first.
3. Save assistant responses and continue an artifact in chat as an unsent, editable draft.
4. Copy/export one artifact, read up to 50 versions, restore a prior version, and share read-only with signed-in Shoebox users.
5. Persist to the authenticated account, with browser-local fallback and one-time import.

These are baseline capabilities, not counted among the ten additions.

## Ten new capabilities

### Organize and find

1. **Favorites:** pin useful artifacts and filter to them.
2. **Collections:** group artifacts into named, account-synced collections; an artifact belongs to zero or one collection.
3. **Tags:** apply multiple account-synced labels to an artifact and filter by one tag.
4. **Sort controls:** recent update, recent creation, and title order; search/category/owner/favorite/collection/tag filters compose together.

### Make changes safer

5. **Duplicate:** create a private independent copy from an owned or shared artifact; never mutate the source.
6. **Recoverable drafts:** restore unsaved editor work after reload, with explicit resume/discard and separate drafts per artifact/user.
7. **Version comparison:** compare a selected saved revision with current content before restoring it.

### Bring work in and out

8. **File import:** import text-based Markdown, plain text, and supported source-code files into the existing categories; the imported artifact opens in preview and can then be edited.
9. **Portable library backup:** export the student's actual library as a versioned JSON file that includes organization metadata.
10. **Backup restore:** validate a selected backup, show import counts before acting, and restore actual artifacts without overwriting existing records.

## Ownership and storage invariants

- `ArtifactRepository` owns account-synced organization values and owner checks; `useArtifacts` owns the frontend contract and local fallback. The page must not write directly to the API or localStorage.
- Organization-only changes do not create content-history versions or make content appear edited.
- Older rows default to unstarred, no tags, and no collection through an additive, idempotent SQLite schema upgrade. Older local artifacts remain readable and import with the same defaults.
- Restoring a content version preserves the artifact's current organization metadata.
- Duplicate/imported items are private by default and owned by the current user. A shared source remains read-only; a copy has no inherited share state.
- Drafts are browser-local recovery data, scoped by authenticated user when signed in and by local profile when signed out. They never silently save to the account or create a version.
- Backup restore never overwrites a current artifact. It validates the whole file before writes and skips entries whose stable backup IDs already exist; distinct artifacts with the same title remain distinct.
- Preserve existing signed-in-only sharing and no-public-link rules. Keep only the existing Documents and Code kinds.

## Slices

1. [01 — Library/editor baseline](slices/01-library-editor.md), [02 — Chat round trip](slices/02-chat-roundtrip.md), and [03 — Sharing](slices/03-sharing-release.md) define existing foundations.
2. [04 — Organization](slices/04-organization.md) ships favorites, collections, tags, and composable sorting/filtering.
3. [05 — Safe iteration](slices/05-safe-iteration.md) ships duplicate, draft recovery, and version compare.
4. [06 — Portable library](slices/06-portable-library.md) ships text file import and validated JSON backup/restore.

Each slice should finish with a runnable UI and frontend/backend typecheck/build. Do not add or run automated tests unless the user asks. Keep manual acceptance steps in the slice record.

## Visual and release review

The environment reports browser UI disabled. Do not say the visual gate passed without browser review. When browser access is restored, inspect library, organization controls, empty states, file import, backup restore, editor recovery, and version comparison at desktop and narrow widths. Check focus, touch target sizes, long content, and error/retry states. For a screenshot-produced visual result, use `screenshot-critique` as a fresh second look before acceptance.

## Non-goals

Public links, marketplace or seeded/demo artifacts, comments, live collaboration, extra artifact categories, arbitrary untrusted HTML in the application origin, and silent AI-driven mutation.
