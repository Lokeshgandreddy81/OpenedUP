import assert from "node:assert/strict";
import { test } from "node:test";
import type { ProviderId } from "@charan-interiors/contracts";
import { fetchAccountProviders } from "./keyStore";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test("provider status requests stay isolated when the signed-in account changes", async () => {
  const accountA = deferred<Response>();
  const accountB = deferred<Response>();
  const fetchFor = (response: Promise<Response>) => async () => response;

  const requestA = fetchAccountProviders("customize-account-a", fetchFor(accountA.promise));
  const requestB = fetchAccountProviders("customize-account-b", fetchFor(accountB.promise));

  accountA.resolve(new Response(JSON.stringify({ providers: ["openai"] }), { status: 200 }));
  assert.deepEqual(await requestA, ["openai"] satisfies ProviderId[]);

  accountB.resolve(new Response(JSON.stringify({ providers: ["google"] }), { status: 200 }));
  assert.deepEqual(await requestB, ["google"] satisfies ProviderId[]);
});
