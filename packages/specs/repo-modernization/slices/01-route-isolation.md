# Slice 01: Route failure isolation

## Outcome

A lazy chunk failure or render exception displays a recovery panel inside its own route. Sibling route trees remain mounted and usable.

## Implementation

- Add one shared `PageRoute` wrapper with `ErrorBoundary` outside `Suspense`.
- Apply it to all nine lazy routes, preserving each existing loading skeleton and URL.
- Do not remove existing page-level boundaries in this slice; their fallbacks are part of current page behavior and can be consolidated in a later focused change.
- Route-boundary recovery reloads the app because React caches a rejected `lazy()` payload; resetting only the boundary would render the same rejected import again.

## Acceptance

- A rejected `React.lazy` import is caught by the route boundary.
- A healthy sibling route remains visible when another route's lazy import rejects.
- Existing route paths and loading skeletons are unchanged.
- Verify with focused frontend tests and frontend typecheck/build.

## Risks / limits

This boundary does not contain failures in providers or the shared workspace modal because those are outside the route tree. A later shell-isolation slice must define their recovery separately. A browser reload may be needed to retry a rejected cached chunk; retry UX should be addressed without pretending the route can recover its cached import promise.
