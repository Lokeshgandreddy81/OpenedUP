import assert from "node:assert/strict";
import test from "node:test";
import { isProjectDataReadyForIdentity, shouldPersistProjectsLocally } from "./projectIdentity";

test("account project data is unavailable to the anonymous identity during sign-out", () => {
  assert.equal(isProjectDataReadyForIdentity(null, "account-a"), false);
  assert.equal(shouldPersistProjectsLocally(null, "account-a"), false);
});

test("only a fully loaded anonymous project snapshot is persisted to browser-wide storage", () => {
  assert.equal(isProjectDataReadyForIdentity(null, null), true);
  assert.equal(shouldPersistProjectsLocally(null, null), true);
  assert.equal(shouldPersistProjectsLocally("account-a", "account-a"), false);
  assert.equal(shouldPersistProjectsLocally("account-b", "account-a"), false);
});
