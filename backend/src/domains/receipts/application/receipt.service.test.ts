import assert from "node:assert/strict";
import test from "node:test";
import { ReadReceiptsRequestSchema } from "@charan-interiors/contracts";
import { readReceipts } from "./receipt.service.js";

const photos = [
  {
    globalIndex: 3,
    totalPhotos: 4,
    mimeType: "image/jpeg",
    base64Data: "dGVzdA==",
  },
];

const validResponse = {
  receipts: [
    {
      photo_index: 3,
      box_2d: [100, 100, 900, 900],
      merchant: "Cafe",
      date: "2026-10-26",
      time: null,
      item_count: null,
      printed_total: 12.5,
      handwritten_tip: null,
      final_total: 12.5,
      currency: "USD",
      tax: null,
      tax_label: null,
      category: "Meals",
      card_last4: null,
      confidence: {
        merchant: 0.9,
        date: 0.9,
        printed_total: 0.9,
        handwritten_tip: 0.9,
        currency: 0.9,
        tax: 0.9,
      },
      flags: [],
    },
  ],
};

test("receipt extraction API requires an explicit model and caps a batch", () => {
  assert.equal(ReadReceiptsRequestSchema.safeParse({ photos }).success, false);
  assert.equal(ReadReceiptsRequestSchema.safeParse({ photos, model: "gpt-6-astra" }).success, true);
  assert.equal(
    ReadReceiptsRequestSchema.safeParse({ photos: Array(11).fill(photos[0]), model: "gpt-6-astra" })
      .success,
    false
  );
  assert.equal(
    ReadReceiptsRequestSchema.safeParse({
      photos: [
        { ...photos[0], base64Data: "a".repeat(17_000_000) },
        { ...photos[0], base64Data: "b".repeat(17_000_000) },
        { ...photos[0], base64Data: "c".repeat(17_000_000) },
      ],
      model: "gpt-6-astra",
    }).success,
    false
  );
});

test("receipt extraction sends images through the selected shared provider adapter", async (t) => {
  const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: input instanceof Request ? input.url : String(input), init });
    return new Response(
      JSON.stringify({ choices: [{ message: { content: JSON.stringify(validResponse) } }] }),
      { headers: { "Content-Type": "application/json" } }
    );
  });

  const result = await readReceipts(photos, {
    modelId: "gpt-6-astra",
    apiKey: "test-provider-key",
    baseUrl: "https://1.1.1.1/v1",
  });

  assert.deepEqual(result, validResponse);
  assert.equal(requests[0]?.url, "https://1.1.1.1/v1/chat/completions");
  assert.equal(
    new Headers(requests[0]?.init?.headers).get("authorization"),
    "Bearer test-provider-key"
  );
  const body = JSON.parse(String(requests[0]?.init?.body)) as {
    model: string;
    messages: Array<{
      role: string;
      content: Array<{ type: string; image_url?: { url: string } }>;
    }>;
  };
  assert.equal(body.model, "gpt-6-astra");
  const image = body.messages
    .flatMap((message) => message.content)
    .find((part) => part.type === "image_url");
  assert.equal(image?.image_url?.url, "data:image/jpeg;base64,dGVzdA==");
});

test("receipt extraction rejects malformed data and references to photos outside the batch", async (t) => {
  let responseBody = "not-json";
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: responseBody } }] }), {
        headers: { "Content-Type": "application/json" },
      })
  );
  const model = {
    modelId: "gpt-6-astra",
    apiKey: "test-provider-key",
    baseUrl: "https://1.1.1.1/v1",
  };

  await assert.rejects(() => readReceipts(photos, model), /invalid receipt data/i);
  responseBody = JSON.stringify({
    receipts: [{ ...validResponse.receipts[0], photo_index: 99 }],
  });
  await assert.rejects(() => readReceipts(photos, model), /unknown photo/i);
});
