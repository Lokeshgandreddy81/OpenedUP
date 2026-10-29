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
    return "Google sign-in was canceled or expired. Please try again.";
  }
  if (code === "flow_state_expired" || code === "flow_state_not_found") {
    return "Google sign-in could not be completed in this browser. Please start again.";
  }
  return "We couldn’t complete Google sign-in. Please try again.";
}
