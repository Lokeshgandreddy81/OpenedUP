import assert from "node:assert/strict";
import test from "node:test";
import { authenticatedChatFetch } from "./chatApi";

test("authenticated requests retain the caller's account identity across token lookup", async () => {
  let request: { url: RequestInfo | URL; headers: Headers } | undefined;
  const response = await authenticatedChatFetch(
    "/api/conversations",
    { headers: { "X-Request-Tag": "chat-load" } },
    "account-a",
    async () => "token-for-the-current-session",
    async (url, init) => {
      request = { url, headers: new Headers(init?.headers) };
      return new Response("{}", { status: 200 });
    }
  );

  assert.equal(response.status, 200);
  assert.equal(request?.url, "/api/conversations");
  assert.equal(request?.headers.get("Authorization"), "Bearer token-for-the-current-session");
  assert.equal(request?.headers.get("X-Expected-User-Id"), "account-a");
  assert.equal(request?.headers.get("X-Request-Tag"), "chat-load");
});
