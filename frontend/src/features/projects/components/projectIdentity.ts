export function isProjectDataReadyForIdentity(
  userId: string | null,
  loadedAccountUid: string | null
): boolean {
  return loadedAccountUid === userId;
}

export function shouldPersistProjectsLocally(
  userId: string | null,
  loadedAccountUid: string | null
): boolean {
  return userId === null && isProjectDataReadyForIdentity(userId, loadedAccountUid);
}
