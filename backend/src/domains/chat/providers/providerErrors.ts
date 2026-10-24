/** Convert upstream errors into safe guidance without exposing provider response bodies. */
export function actionableProviderError(message: string): string {
  if (message.startsWith("MISSING_API_KEY:")) return message;
  if (message.startsWith("UNKNOWN_MODEL:") || message.startsWith("MISSING_CUSTOM_MODEL:"))
    return message;

  if (/only available on agentic harnesses/i.test(message)) {
    return "This model's free OpenRouter endpoint is limited to supported agentic apps and cannot be used in standard chat. Choose another model.";
  }

  if (/provider returned error/i.test(message) && /\b404\b|not found/i.test(message)) {
    return "This model's OpenRouter provider is currently unavailable. Choose another model and try again later.";
  }

  const status =
    message.match(/(?:error\s*\(|HTTP\s+|status(?:\s+code)?\s*[:=]?\s*)(\d{3})\)?/i)?.[1] ||
    message.match(/\b(400|401|403|404|408|429|5\d\d)\b/)?.[1];
  if (status === "401" || status === "403") {
    return "The provider rejected this API key. Check the key and selected provider in Customize → Providers, then verify the connection.";
  }
  if (status === "429") {
    return "The provider rate limit or quota was reached. Wait briefly, check your provider quota and billing, then retry.";
  }
  if (status === "408" || status === "504" || /timed?\s*out|timeout|aborterror/i.test(message)) {
    return "The provider took too long to respond. Retry, or choose a faster model if this keeps happening.";
  }
  if (status && Number(status) >= 500) {
    return "The provider is temporarily unavailable. Retry in a moment or check the provider’s status page.";
  }
  if (status === "400" || status === "404") {
    return "The provider rejected this model request. Check that the model ID is valid for the selected provider and endpoint.";
  }
  if (/fetch failed|network|socket|dns/i.test(message)) {
    return "Could not reach the provider. Check the endpoint and your network connection, then retry.";
  }
  return "The provider request failed. Check the provider key, endpoint, and model selection, then retry.";
}
