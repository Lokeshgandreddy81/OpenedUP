# Slice 05 — Safe iteration

## Status: Implemented

## Contract

From an artifact the student can make a private copy, recover an interrupted editor draft after reload, and compare any retained version to current content before restoring it. These actions preserve the original and keep drafts separate from the saved history.

## Seams

- Duplicate uses the existing create operation and the current user's ownership. The copy starts private, unstarred, with no tags/collection; source remains unchanged.
- Draft recovery is a feature-owned localStorage record keyed by user/profile and artifact ID (or a unique create-draft key). Persist title, kind, language, and content. Resume/discard is explicit; discard removes only the draft. Saving clears it only after API success.
- Version comparison is a bounded pure line-diff utility consuming the existing version payload. Restoring still calls the existing update path so current content remains recoverable; organization metadata is preserved.

## Playable checkpoint

Duplicate a shared/read-only artifact and confirm only the private copy is editable. Change content, reload, resume the unsaved draft, save, then compare with a prior revision and restore it. Confirm no draft appears in account sync or saved history and failed saves retain recoverable text.

## Verification

Frontend typecheck and production build; manual checkpoint above. Do not add/run automated tests unless requested. Browser screenshot critique remains a visual acceptance gate when browser access is available.

## Delegated decisions

Use a readable unified diff or side-by-side line diff; don't introduce a heavyweight diff dependency. Draft expiry/cleanup may be bounded, but drafts must survive ordinary reloads and remain isolated by account.
