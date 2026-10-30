import assert from "node:assert/strict";
import test from "node:test";
import { commitForCurrentUser } from "./chapterChatIdentity.js";

test("chapter chat does not publish a response after the account changes", () => {
  const visibleHistory = ["Account B history"];

  const committed = commitForCurrentUser("account-a", "account-b", () => {
    visibleHistory.push("Account A response");
  });

  assert.equal(committed, false);
  assert.deepEqual(visibleHistory, ["Account B history"]);
});

test("chapter chat publishes a response while its captured account remains active", () => {
  const visibleHistory = ["Account A history"];

  const committed = commitForCurrentUser("account-a", "account-a", () => {
    visibleHistory.push("Account A response");
  });

  assert.equal(committed, true);
  assert.deepEqual(visibleHistory, ["Account A history", "Account A response"]);
});
