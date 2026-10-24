import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChapterChatPanel } from "../features/chapters/components/ChapterChatPanel";

vi.mock("../app/auth/ChatAuthContext", () => ({ useChatAuth: () => ({ user: null }) }));
vi.mock("../features/customize/publicApi", () => ({
  getKeyForModel: () => ({ provider: "custom" }),
  getProviderChatRequestConfig: () => ({ headers: {}, customModelFields: {} }),
  useProviderKeys: () => ({ hasKey: () => false }),
}));
vi.mock("../features/chapters/services/chapterSource", () => ({
  extractChapterSource: async () => ({
    documentId: "doc-1",
    chapterId: "chapter-1:1:2",
    title: "Chapter One",
    startPage: 1,
    endPage: 2,
    pages: [
      {
        id: "doc-1:chapter-1:1:2:page-1",
        pageNumber: 1,
        text: "Clear boundaries contain failures.",
      },
      {
        id: "doc-1:chapter-1:1:2:page-2",
        pageNumber: 2,
        text: "Observability helps teams detect failures.",
      },
    ],
  }),
  renderChapterPageImages: async () => [],
}));
vi.mock("../features/chat/components/ChatInput", () => ({
  ChatInput: ({
    onSendMessage,
    isThinking,
  }: {
    onSendMessage: (text: string, model: string) => void;
    isThinking: boolean;
  }) => (
    <button
      type="button"
      disabled={isThinking}
      onClick={() =>
        onSendMessage("Why are boundaries important?", "openrouter-nemotron-3.5-lightning-free")
      }
    >
      Send chapter question
    </button>
  ),
}));
vi.mock("../features/chat/components/ChatMessages", () => ({
  ChatMessages: ({
    messages,
    isThinking,
    thinkingLabel,
    onSelectActionChip,
    renderMessageSupplement,
  }: {
    messages: Array<{ id: string; role: string; content: string; actionChips?: string[] }>;
    isThinking: boolean;
    thinkingLabel: string;
    onSelectActionChip?: (chip: string, messageId: string) => void;
    renderMessageSupplement?: (message: { id: string }) => React.ReactNode;
  }) => (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          <p>{message.content}</p>
          {renderMessageSupplement?.(message)}
          {message.actionChips?.map((chip) => (
            <button key={chip} onClick={() => onSelectActionChip?.(chip, message.id)}>
              {chip}
            </button>
          ))}
        </div>
      ))}
      {isThinking && <p role="status">{thinkingLabel}</p>}
    </div>
  ),
}));

function ChapterChatHarness({
  onOpenCitation,
  onHistoryChange,
  chapterId = "chapter-1",
}: {
  onOpenCitation: (page: number) => void;
  onHistoryChange: React.ComponentProps<typeof ChapterChatPanel>["onHistoryChange"];
  chapterId?: string;
}) {
  const [history, setHistory] = React.useState<
    React.ComponentProps<typeof ChapterChatPanel>["history"]
  >([]);
  return (
    <ChapterChatPanel
      pdfUrl="blob:chapter.pdf"
      documentId="doc-1"
      chapterId={chapterId}
      title="Chapter One"
      startPage={1}
      endPage={2}
      history={history}
      onHistoryChange={(nextHistory) => {
        setHistory(nextHistory);
        onHistoryChange(nextHistory);
      }}
      onOpenProviders={vi.fn()}
      onOpenCitation={onOpenCitation}
    />
  );
}

describe("chapter chat panel request flow", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("streams a grounded answer and exposes its page citation", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          [
            'event: phase\ndata: {"phase":"responding"}\n\n',
            'event: done\ndata: {"answer":"Boundaries contain failures.","abstained":false,"citations":[{"id":"doc-1:chapter-1:1:2:page-1:chunk-1","pageNumber":1,"excerpt":"Clear boundaries contain failures."}]}\n\n',
          ].join(""),
          { status: 200, headers: { "Content-Type": "text/event-stream" } }
        )
      );
    const onHistoryChange = vi.fn();
    const onOpenCitation = vi.fn();

    render(
      <ChapterChatHarness onOpenCitation={onOpenCitation} onHistoryChange={onHistoryChange} />
    );

    await screen.findByRole("button", { name: "Explain a key idea" });
    fireEvent.click(screen.getByRole("button", { name: "Send chapter question" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/chat/chapter/stream",
        expect.objectContaining({ method: "POST" })
      )
    );
    await screen.findByText("Boundaries contain failures.");
    fireEvent.click(screen.getByRole("button", { name: "Go to page 1" }));
    expect(onOpenCitation).toHaveBeenCalledWith(1);
    await waitFor(() =>
      expect(onHistoryChange).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: "assistant", content: "Boundaries contain failures." }),
        ])
      )
    );
  });

  it("cancels the active provider request when the selected chapter changes", async () => {
    let requestSignal: AbortSignal | undefined;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          requestSignal = init?.signal as AbortSignal;
          requestSignal.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true }
          );
        })
    );
    const onHistoryChange = vi.fn();
    const onOpenCitation = vi.fn();
    const { rerender } = render(
      <ChapterChatHarness onOpenCitation={onOpenCitation} onHistoryChange={onHistoryChange} />
    );

    await screen.findByRole("button", { name: "Explain a key idea" });
    fireEvent.click(screen.getByRole("button", { name: "Send chapter question" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(requestSignal?.aborted).toBe(false);

    rerender(
      <ChapterChatHarness
        chapterId="chapter-2"
        onOpenCitation={onOpenCitation}
        onHistoryChange={onHistoryChange}
      />
    );
    await waitFor(() => expect(requestSignal?.aborted).toBe(true));
  });
});
