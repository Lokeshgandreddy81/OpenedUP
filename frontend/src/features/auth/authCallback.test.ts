import assert from "node:assert/strict";
import test from "node:test";
import { callbackError, safeInternalPath } from "./authCallback";

test("callback redirect accepts only a same-origin path", () => {
  assert.equal(safeInternalPath("/chat?mode=recent#top"), "/chat?mode=recent#top");
  assert.equal(safeInternalPath("//example.com"), "/chat");
  assert.equal(safeInternalPath("https://example.com"), "/chat");
  assert.equal(safeInternalPath("/\\example.com"), "/chat");
  assert.equal(safeInternalPath(null), "/chat");
});

test("callback explains canceled or expired Google sign-in from query or fragment", () => {
  const message = "Google sign-in was canceled or expired. Please try again.";
  assert.equal(callbackError("?error_code=otp_expired", ""), message);
  assert.equal(callbackError("", "#error=access_denied"), message);
});

test("callback does not display provider-controlled error text", () => {
  assert.equal(
    callbackError("?error_description=<script>alert(1)</script>", ""),
    "We couldn’t complete Google sign-in. Please try again."
  );
  assert.equal(callbackError("", "#access_token=abc&type=email"), null);
});
