export function safeInternalPath(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/chat";
}

export function callbackError(search: string, hash: string): string | null {
  const params = new URLSearchParams(`${search.replace(/^\?/, "")}&${hash.replace(/^#/, "")}`);
  const code = params.get("error_code") || params.get("error");
  if (!code && !params.has("error_description")) return null;

  if (code === "otp_expired" || code === "access_denied") {
    return "This confirmation link has expired or was already used. Request a fresh email and open its link once.";
  }
  if (code === "flow_state_expired" || code === "flow_state_not_found") {
    return "This sign-in link could not be completed in this browser. Request a new confirmation email and open it in the same browser where you started.";
  }
  return "We couldn’t complete email confirmation. Request a fresh confirmation email and try again.";
}
