# Slice 06 — Portable library

## Contract

Students can import text-based `.md`, `.markdown`, `.txt`, and supported source-code files into their library; imported items open in preview and remain editable. They can export a versioned JSON backup of their own actual library and restore it after a validation/preview step. Restore never overwrites existing records; entries matching stable backup IDs are skipped, while same-title but distinct artifacts remain distinct. Malformed or unsupported files cause no partial import.

## Seams

- File import owns extension-to-kind/language mapping and a strict text size limit; after import, the saved artifact opens in preview for review and editing.
- Backup format has a version, export timestamp, and actual artifact data. Never include credentials or artifacts owned by another user. Organization metadata is included.
- Restore validates format/version, item count, content length, allowed categories, metadata bounds, and collection/tag values before starting. Show a summary first; create private items through the current artifact store. The backend import is transactional and idempotent by backup ID.
- No archive dependency is needed; backup is one downloadable JSON file. Individual artifact export remains available.

## Playable checkpoint

Import representative Markdown, plain-text, TypeScript, and Python files; confirm preview, category, language, and saved content. Export a library backup, restore it, and verify every artifact and organization field. Reject invalid JSON, unsupported versions, and oversized files without writing any items. Restore the same backup twice and confirm the second pass skips existing backup IDs.

## Verification

Frontend/backend/contracts typecheck and production build; manual checkpoint above. Do not add/run automated tests unless requested. Browser screenshot critique remains required for visual acceptance when browser access is available.

## Delegated decisions

Exact JSON property names may be chosen during implementation, then frozen in a documented format version. The file size/count limits can be conservative and must be visible before restore.
