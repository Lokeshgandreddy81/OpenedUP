import { getFirebaseIdToken } from "../integrations/workspaceLiveSync";

export async function authenticatedChatFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await getFirebaseIdToken();
  if (!token) throw new Error("Sign in to access your saved chats and artifacts.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export async function consumeChatStream(
  response: Response,
  onDelta: (delta: string) => void,
  onEvent: (event: { type: string; data: Record<string, unknown> }) => void = () => undefined
) {
  if (!response.body) throw new Error("Chat service did not return a response stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let content = "";
  let streamError: string | null = null;
  const handleEvent = (event: string) => {
    const eventName = event.match(/^event:\s*(.+)$/m)?.[1]?.trim();
    const rawData = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");
    if (!rawData) return;
    const data = JSON.parse(rawData) as Record<string, unknown>;
    onEvent({ type: eventName || "message", data });
    if (eventName === "token" && typeof data.delta === "string") {
      content += data.delta;
      onDelta(data.delta);
    }
    if (eventName === "error") streamError = String(data.error || "Chat stream failed.");
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const events = pending.split(/\r?\n\r?\n/);
      pending = events.pop() || "";
      for (const event of events) handleEvent(event);
      if (done) {
        if (pending.trim()) handleEvent(pending);
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }
  if (streamError) throw new Error(streamError);
  if (!content) throw new Error("The model returned an empty response.");
  return content;
}
