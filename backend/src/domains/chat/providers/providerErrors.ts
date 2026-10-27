import { redactSecretsString } from "../../../platform/observability/logger.js";

export type ProviderFailureCategory =
  | "authentication"
  | "rate_limit"
  | "timeout"
  | "cancelled"
  | "malformed_stream"
  | "network"
  | "provider_unavailable"
  | "invalid_request"
  | "unknown";

/** Classify a failure into a low-cardinality diagnostic value without retaining its text. */
export function classifyProviderFailure(error: unknown, timedOut = false): ProviderFailureCategory {
  if (timedOut) return "timeout";
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error ?? "");
  const sanitized = redactSecretsString(message).toLowerCase();
  if (/malformed streaming data|unreadable response stream/.test(sanitized)) {
    return "malformed_stream";
  }
  if (/timed?\s*out|timeout|etimedout/.test(sanitized) || name === "TimeoutError") return "timeout";
  if (/aborterror|cancelled|canceled/.test(sanitized) || name === "AbortError") return "cancelled";

  const details =
    error && typeof error === "object"
      ? (error as { status?: unknown; statusCode?: unknown })
      : undefined;
  const structuredStatus =
    typeof details?.status === "number"
      ? details.status
      : typeof details?.statusCode === "number"
        ? details.statusCode
        : undefined;
  const parsedStatus = Number(
    sanitized.match(/(?:error\s*\(|http\s+|status(?:\s+code)?\s*[:=]?\s*)(\d{3})\)?/)?.[1]
  );
  const status = structuredStatus ?? (parsedStatus || undefined);
  if (
    status === 401 ||
    status === 403 ||
    /missing_api_key:|api_key_invalid|invalid[\s_-]*api[\s_-]*key|authentication_error|permission_(?:denied|error)|unauthenticated/.test(
      sanitized
    )
  ) {
    return "authentication";
  }
  if (
    status === 429 ||
    /rate[\s_-]*limit|quota|resource_exhausted|too many requests/.test(sanitized)
  ) {
    return "rate_limit";
  }
  if (status === 408 || status === 504) return "timeout";
  if (status && status >= 500) return "provider_unavailable";
  if (/api_error|overloaded_error|server_error|service_unavailable/.test(sanitized)) {
    return "provider_unavailable";
  }
  if (
    status === 400 ||
    status === 404 ||
    /unknown_model:|missing_custom_model:|invalid[\s_-]*request|not found|not supported|context (?:length|window|limit)|prompt is too long|input token count|must use https|must not contain credentials|valid hostname|valid url|private or local network|cannot be empty/.test(
      sanitized
    )
  ) {
    return "invalid_request";
  }
  if (/fetch failed|network|socket|dns|econnreset|econnrefused|enotfound/.test(sanitized)) {
    return "network";
  }
  return "unknown";
}

/** Convert upstream errors into safe guidance without exposing provider response bodies. */
export function actionableProviderError(message: string): string {
  const sanitized = redactSecretsString(message);
  if (sanitized.startsWith("MISSING_API_KEY:")) return sanitized;
  if (sanitized.startsWith("UNKNOWN_MODEL:") || sanitized.startsWith("MISSING_CUSTOM_MODEL:"))
    return sanitized;
  if (sanitized.startsWith("EMPTY_PROVIDER_RESPONSE:")) {
    return "The selected provider returned an empty response. Check the model and endpoint configuration, then retry.";
  }
  if (sanitized.includes("does not support image analysis")) {
    return sanitized;
  }

  if (/only available on agentic harnesses/i.test(sanitized)) {
    return "This model's free OpenRouter endpoint is limited to supported agentic apps and cannot be used in standard chat. Choose another model.";
  }

  if (/provider returned malformed streaming data/i.test(sanitized)) {
    return "The provider returned an unreadable response stream. Retry, or choose another model if this keeps happening.";
  }

  if (
    /maximum context(?: length| window)?|context (?:length|window|limit)|prompt is too long|input.{0,40}(?:too long|token count|exceeds? the maximum)|too many tokens/i.test(
      sanitized
    )
  ) {
    return "This conversation and its attached context exceed the provider's model limit. Remove older messages or attachments, or choose a model with a larger context window.";
  }

  if (/provider returned error/i.test(sanitized) && /\b404\b|not found/i.test(sanitized)) {
    return "This model's OpenRouter provider is currently unavailable. Choose another model and try again later.";
  }

  if (/provider(?: base)? url (?:must|cannot)|private or local network address/i.test(sanitized)) {
    return "The configured provider endpoint URL is invalid or points to a restricted local network address. Check the endpoint in Customize → Providers.";
  }

  const status =
    sanitized.match(/(?:error\s*\(|HTTP\s+|status(?:\s+code)?\s*[:=]?\s*)(\d{3})\)?/i)?.[1] ||
    sanitized.match(/\b(400|401|403|404|408|429|5\d\d)\b/)?.[1];
  if (/permission_(?:denied|error)/i.test(sanitized)) {
    return "The provider denied this API key's permissions. Check the key, selected provider, and model access in Customize → Providers.";
  }
  if (
    status === "401" ||
    status === "403" ||
    /api_key_invalid|invalid[\s_-]*api[\s_-]*key|authentication_error|permission_(?:denied|error)|unauthenticated/i.test(
      sanitized
    )
  ) {
    return "The provider rejected this API key. Check the key and selected provider in Customize → Providers, then verify the connection.";
  }
  if (
    status === "429" ||
    /rate[\s_-]*limit|quota|resource_exhausted|too many requests/i.test(sanitized)
  ) {
    return "The provider rate limit or quota was reached. Wait briefly, check your provider quota and billing, then retry.";
  }
  if (
    status === "408" ||
    status === "504" ||
    /timed?\s*out|timeout|etimedout|aborterror/i.test(sanitized)
  ) {
    return "The provider took too long to respond. Retry, or choose a faster model if this keeps happening.";
  }
  if (
    (status && Number(status) >= 500) ||
    /api_error|overloaded_error|server_error|service_unavailable/i.test(sanitized)
  ) {
    return "The provider is temporarily unavailable. Retry in a moment or check the provider’s status page.";
  }
  if (status === "400" || status === "404" || /invalid[\s_-]*request_error/i.test(sanitized)) {
    return "The provider rejected this model request. Check that the model ID is valid for the selected provider and endpoint.";
  }
  if (/fetch failed|network|socket|dns|econnreset|econnrefused|enotfound/i.test(sanitized)) {
    return "Could not reach the provider. Check the endpoint and your network connection, then retry.";
  }
  return "The provider request failed. Check the provider key, endpoint, and model selection, then retry.";
}
