export function commitForCurrentUser(
  requestUserId: string | null,
  currentUserId: string | null,
  commit: () => void
): boolean {
  if (requestUserId !== currentUserId) return false;
  commit();
  return true;
}
