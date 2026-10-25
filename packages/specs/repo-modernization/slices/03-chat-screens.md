# Slice 03: Chat screen ownership

## Outcome

The chat workspace's secondary screens have named TSX owners, load independently, and fail inside their own screen boundary without clearing the active conversation. `ChatWindow` remains the session owner during this slice so anonymous in-memory messages and the existing sidebar navigation continue to work.

## Screen ownership

- `pages/ChatPage/screens/ArtifactsScreen.tsx` owns artifact browsing/editing UI.
- `pages/ChatPage/screens/CustomizeScreen.tsx` owns skills, connectors, and provider settings UI.
- `pages/ChatPage/screens/PluginsScreen.tsx` owns plugin catalog UI.
- `pages/ProjectsPage/ProjectsScreen.tsx` owns projects, project sessions, and project-file UI; both `/projects` and the chat workspace consume this feature screen.
- `pages/RoadmapPage/RoadmapsScreen.tsx` owns the roadmap route entry; `components/roadmap/RoadmapExplorer.tsx` owns the reusable explorer implementation used by the chat workspace and canvas.
- `pages/ChatPage/screens/BenchmarksScreen.tsx` and `ScheduledTasksScreen.tsx` adapt their existing multi-surface feature views to the chat workspace.
- `pages/ChatPage/ChatWorkspaceScreens.tsx` owns the chat secondary-screen registry and page-local loading/error boundaries.
- `ChatWindow` owns current chat/session data and navigation state for now; it composes the screen registry and renders the conversation canvas.

## Compatibility

- Keep the existing top-level URLs and sidebar actions unchanged.
- Keep the internal chat screen navigation state-based in this slice; no deep links or route-state redesign is introduced.
- Keep conversation state mounted while switching screens, including anonymous in-memory conversations.
- Keep project persistence, BYOK, artifact persistence, and skill/plugin behavior unchanged.

## Acceptance

- Each secondary screen implementation has a product-domain TSX owner.
- Screens load lazily and their boundaries are keyed by active screen so a prior screen error does not poison the next screen.
- A rejected lazy screen import leaves sibling UI and the chat session owner intact.
- Project, roadmap, provider-routing, artifact, plugin, and chat behavior is covered by the existing focused tests where available.
- Frontend typecheck/build pass; chunk output shows the large screen implementations are separate chunks.

## Next refinement

After these screen boundaries stabilize, split conversation/session lifecycle and provider request orchestration out of `ChatWindow` into cohesive chat-owned hooks/services. Do this behind the same UI behavior so this component becomes a composition root rather than a mixed view/state engine.
