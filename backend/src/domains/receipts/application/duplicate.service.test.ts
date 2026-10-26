import assert from "node:assert/strict";
import test from "node:test";
import { CheckDuplicatesRequestSchema, type ReceiptRowInput } from "@charan-interiors/contracts";
import { checkDuplicates, parseDuplicateReviewResponse } from "./duplicate.service.js";

const rows: ReceiptRowInput[] = [
  { row: 4, photo_index: 1, merchant: "Cafe" },
  { row: 9, photo_index: 2, merchant: "Cafe" },
];

test("duplicate review API requires an explicit model selection", () => {
  assert.equal(CheckDuplicatesRequestSchema.safeParse({ rows }).success, false);
  assert.equal(
    CheckDuplicatesRequestSchema.safeParse({ rows, model: "gpt-6-astra" }).success,
    true
  );
});

test("duplicate review accepts valid pairs using receipt row numbers", () => {
  assert.deepEqual(
    parseDuplicateReviewResponse(
      '{"duplicates":[{"row":9,"duplicate_of":4,"reason":"Same cafe, amount, and date."}]}',
      rows
    ),
    { duplicates: [{ row: 9, duplicate_of: 4, reason: "Same cafe, amount, and date." }] }
  );
});

test("duplicate review sends the selected provider model through the shared adapter", async (t) => {
  const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: input instanceof Request ? input.url : String(input), init });
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: '{"duplicates":[{"row":9,"duplicate_of":4,"reason":"Same purchase."}]}',
            },
          },
        ],
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  });

  const result = await checkDuplicates(rows, {
    modelId: "deepseek-v4.1-flash",
    apiKey: "test-provider-key",
    baseUrl: "https://1.1.1.1/v1",
  });

  assert.deepEqual(result.duplicates, [{ row: 9, duplicate_of: 4, reason: "Same purchase." }]);
  assert.equal(requests[0]?.url, "https://1.1.1.1/v1/chat/completions");
  assert.equal(
    new Headers(requests[0]?.init?.headers).get("authorization"),
    "Bearer test-provider-key"
  );
  const body = JSON.parse(String(requests[0]?.init?.body)) as {
    model: string;
    messages: Array<{ role: string; content: string }>;
    response_format?: unknown;
  };
  assert.equal(body.model, "deepseek-flash");
  assert.equal(body.response_format, undefined);
  assert.ok(body.messages.some((message) => message.content.includes('"row":4')));
});

test("duplicate review rejects malformed JSON and row references outside the receipt set", () => {
  assert.throws(
    () => parseDuplicateReviewResponse("not json", rows),
    /invalid duplicate review data/i
  );
  assert.throws(
    () =>
      parseDuplicateReviewResponse(
        '{"duplicates":[{"row":10,"duplicate_of":4,"reason":"Looks similar."}]}',
        rows
      ),
    /invalid duplicate row references/i
  );
});

test("duplicate review rejects reversed, self-referential, and repeated pairs", () => {
  for (const duplicates of [
    [{ row: 4, duplicate_of: 9, reason: "reversed" }],
    [{ row: 9, duplicate_of: 9, reason: "self" }],
    [
      { row: 9, duplicate_of: 4, reason: "first" },
      { row: 9, duplicate_of: 4, reason: "repeated" },
    ],
  ]) {
    assert.throws(
      () => parseDuplicateReviewResponse(JSON.stringify({ duplicates }), rows),
      /invalid duplicate row references/i
    );
  }
});
