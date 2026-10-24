# Slice 04 — Organization

## Status: Implemented

## Contract

Owners can favorite an artifact, assign zero or one collection, and assign/remove tags. Those values sync across signed-in devices and survive the browser-local fallback. The library composes ownership, category, favorite, collection, tag, and text search, then sorts by updated time, created time, or title. Shared recipients can inspect organization metadata but cannot change it.

## API and ownership seam

- Contract: optional `isFavorite`, `collection`, and `tags` on artifact reads/writes. `collection: null` clears the collection. Tags are trimmed, case-insensitive unique labels with a conservative count/name limit.
- Account persistence: additive, idempotent SQLite columns and an authenticated organization update route. Organization-only writes do not snapshot content or alter content `updatedAt`.
- Local persistence: same defaults and semantics; old records read as unstarred, untagged, uncollected.
- One owner for behavior: repository writes/account checks; `useArtifacts` synchronizes and updates local storage; the page only invokes store methods.

## Playable checkpoint

Favorite an artifact, add a collection and several tags, then reload as the same account and see the state preserved. Combine tag/collection/favorite/search/category/ownership filters; exercise title, recently created, and recently updated sorting. Verify metadata changes don't add version history, alter content, or grant a recipient editing rights. Sign out and confirm local artifacts still render with the same controls.

## Verification

Frontend/backend/contracts typecheck and production build; manual checkpoint above. Do not add/run automated tests unless requested. Browser screenshot critique remains required before claiming visual acceptance, but browser access is currently unavailable.

## Delegated decisions

Internal component names and exact neutral palette values are flexible. Data defaults, ownership, case-insensitive tag de-duplication, collection cardinality, and sort/filter composition are fixed by this contract.
