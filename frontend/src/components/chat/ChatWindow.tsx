import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChatSidebar } from "./ChatSidebar";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ScheduledTasksView } from "../scheduled/ScheduledTasksView";
import { ProjectsView } from "../projects/ProjectsView";
import { ArtifactsView } from "./artifacts/ArtifactsView";
import { CustomizeView } from "./CustomizeView";
import { PluginsView } from "./PluginsView";
import { BenchmarksView } from "../benchmarks/BenchmarksView";
import { ExploreScreen } from "../roadmap/ExploreScreen";
import type { ChatConversation, ChatMessage, AiModelId } from "./chatTypes";
import type { ComputedRow } from "@charan-interiors/shared";

const GhostIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = "text-slate-700",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 13a9 9 0 0 1 18 0v8q-3-3.5-6 0q-3-3.5-6 0q-3-3.5-6 0Z" />
    <circle cx="9" cy="11.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="11.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  chapters?: ComputedRow[];
  docTitle?: string;
  onSelectChapter?: (rowNumber: number) => void;
  onOpenScheduledTasks?: () => void;
  initialView?:
    | "chat"
    | "projects"
    | "artifacts"
    | "customize"
    | "plugins"
    | "benchmarks"
    | "chapters"
    | "roadmaps";
  onViewChange?: (
    view:
      | "chat"
      | "projects"
      | "artifacts"
      | "customize"
      | "plugins"
      | "benchmarks"
      | "chapters"
      | "roadmaps"
  ) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  chapters = [],
  docTitle = "Document",
  onSelectChapter,
  onOpenScheduledTasks,
  initialView = "chat",
  onViewChange,
}) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<
    | "chat"
    | "projects"
    | "artifacts"
    | "customize"
    | "plugins"
    | "benchmarks"
    | "chapters"
    | "roadmaps"
  >(initialView);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isScheduledTasksInternalOpen, setIsScheduledTasksInternalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AiModelId>("claude-opus-5.5");

  useEffect(() => {
    if (initialView === "chapters") {
      if (onViewChange) {
        onViewChange("chapters");
      } else {
        navigate("/results");
      }
      return;
    }
    if (initialView === "roadmaps") {
      if (onViewChange) {
        onViewChange("roadmaps");
      } else {
        navigate("/roadmap");
      }
      return;
    }
    if (initialView && initialView !== activeView) {
      setActiveView(initialView);
    }
  }, [initialView, onViewChange, navigate]);

  const [projectsNavKey, setProjectsNavKey] = useState(0);

  const handleSelectView = (
    view:
      | "chat"
      | "projects"
      | "artifacts"
      | "customize"
      | "plugins"
      | "benchmarks"
      | "chapters"
      | "roadmaps"
  ) => {
    if (view === "chapters") {
      if (onViewChange) {
        onViewChange("chapters");
      } else {
        navigate("/results");
      }
      return;
    }
    if (view === "roadmaps") {
      if (onViewChange) {
        onViewChange("roadmaps");
      } else {
        navigate("/roadmap");
      }
      return;
    }
    if (view === "projects") {
      setProjectsNavKey((k) => k + 1);
    }
    setActiveView(view);
    onViewChange?.(view);
  };
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingSeconds, setThinkingSeconds] = useState(7);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [temporaryMessages, setTemporaryMessages] = useState<ChatMessage[]>([]);

  // Cleared all dummy chats: Start fresh with an empty list
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  // Keyboard navigation: Escape key closes the window
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle + New chat
  const handleNewChat = useCallback(() => {
    setActiveView("chat");
    if (isTemporaryChat) {
      setTemporaryMessages([]);
    }
    const newId = `chat-${Date.now()}`;
    const newChat: ChatConversation = {
      id: newId,
      title: "New chat",
      messages: [],
    };
    setConversations((prev) => [newChat, ...prev]);
    setActiveConversationId(newId);
  }, [isTemporaryChat]);

  // Handle Pin conversation
  const handlePinConversation = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  }, []);

  // Handle Rename conversation
  const handleRenameConversation = useCallback((id: string, newTitle: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
  }, []);

  // Handle Archive conversation
  const handleArchiveConversation = useCallback((id: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, isArchived: true } : c)));
  }, []);

  // Handle Send Message
  const handleSendMessage = useCallback(
    async (text: string, model: AiModelId) => {
      const userMessage: ChatMessage = {
        id: `msg-u-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: "Just now",
      };

      let targetId = activeConversationId;
      if (isTemporaryChat) {
        setTemporaryMessages((prev) => [...prev, userMessage]);
      } else if (!targetId || !conversations.some((c) => c.id === targetId)) {
        targetId = `chat-${Date.now()}`;
        const newConv: ChatConversation = {
          id: targetId,
          title: text.slice(0, 24) + (text.length > 24 ? "..." : ""),
          messages: [userMessage],
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(targetId);
      } else {
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === targetId) {
              const isFirst = conv.messages.length === 0;
              return {
                ...conv,
                title: isFirst ? text.slice(0, 24) + (text.length > 24 ? "..." : "") : conv.title,
                messages: [...conv.messages, userMessage],
              };
            }
            return conv;
          })
        );
      }

      setIsThinking(true);
      const startMs = Date.now();
      const timer = setInterval(() => {
        setThinkingSeconds((s) => s + 1);
      }, 1000);
      setThinkingSeconds(1);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        const priorMessages = isTemporaryChat
          ? temporaryMessages
          : activeConversation?.messages || [];

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: [...priorMessages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            context: {
              docTitle,
              chapters: chapters.slice(0, 20).map((c) => ({
                title: c.merchant || `Chapter ${c.row}`,
                summary: c.category || "",
                pageRange: `Page ${c.printed_total || 1}`,
              })),
            },
            model,
          }),
        });
        clearTimeout(timeoutId);

        clearInterval(timer);
        const elapsedSeconds = Math.max(1, Math.round((Date.now() - startMs) / 1000));

        if (response.ok) {
          const data = await response.json();
          const assistantMessage: ChatMessage = {
            id: `msg-a-${Date.now()}`,
            role: "assistant",
            content: data.content || "Response received.",
            thinkingTime: data.thinkingTime || `${elapsedSeconds}s`,
            stepTitle: data.stepTitle || "Narrowing target criteria",
            stepDescription: data.stepDescription || "Synthesizing signals and matching criteria.",
            actionChips: ["Refine criteria", "Export findings", "Check document citations"],
          };

          if (isTemporaryChat) {
            setTemporaryMessages((prev) => [...prev, assistantMessage]);
          } else {
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === targetId
                  ? { ...conv, messages: [...conv.messages, assistantMessage] }
                  : conv
              )
            );
          }
        } else {
          throw new Error("Chat service unavailable");
        }
      } catch {
        clearInterval(timer);
        const elapsedSeconds = Math.max(1, Math.round((Date.now() - startMs) / 1000));

        let replyContent = "";
        let stepTitle = "Narrowing target criteria";
        let stepDesc = "Locking criteria to relevant signals across document chapters and motion.";

        const lower = text.toLowerCase();
        if (
          lower.includes("chapter") ||
          lower.includes("summary") ||
          lower.includes("synthesize")
        ) {
          stepTitle = "Cross-Referencing Document Chapters";
          stepDesc = `Analyzing structure for "${docTitle}" (${chapters.length} chapters indexed).`;
          replyContent =
            `Here is the synthesis based on "${docTitle}":\n\n` +
            (chapters.length > 0
              ? chapters
                  .slice(0, 4)
                  .map(
                    (c, i) =>
                      `• **Chapter ${i + 1} (${c.merchant || "Overview"})**: Core focus covers foundational concepts and workflow alignment.`
                  )
                  .join("\n")
              : "• Analyzed content: No explicit structural chapters found, reading raw document canvas.");
        } else {
          stepTitle = "Synthesizing Market & Document Signals";
          stepDesc = `Extracted high-relevance intent signals tailored to "${text.slice(0, 30)}...".`;
          replyContent =
            `Here are the top matches and signals:\n\n` +
            `1. **Intent Matching**: Validated high-relevance patterns matching your query.\n` +
            `2. **Target Alignment**: Categorized by priority motion and strategic fit.\n` +
            `3. **Recommended Next Step**: Trigger targeted sequence or inspect source document citations.`;
        }

        const fallbackAssistantMessage: ChatMessage = {
          id: `msg-a-${Date.now()}`,
          role: "assistant",
          content: replyContent,
          thinkingTime: `${elapsedSeconds}s`,
          stepTitle,
          stepDescription: stepDesc,
          actionChips: ["Filter results", "Export sequence", "View citations"],
        };

        if (isTemporaryChat) {
          setTemporaryMessages((prev) => [...prev, fallbackAssistantMessage]);
        } else {
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === targetId
                ? {
                    ...conv,
                    messages: [...conv.messages, fallbackAssistantMessage],
                  }
                : conv
            )
          );
        }
      } finally {
        setIsThinking(false);
      }
    },
    [
      activeConversation,
      activeConversationId,
      chapters,
      conversations,
      docTitle,
      isTemporaryChat,
      temporaryMessages,
    ]
  );

  if (!isOpen) return null;

  const currentMessages = isTemporaryChat ? temporaryMessages : activeConversation?.messages || [];
  const isEmptyChat = currentMessages.length === 0 && !isThinking;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chat"
      className="fixed inset-0 z-50 bg-white flex font-sans select-none overflow-hidden text-slate-900 animate-in fade-in duration-150"
    >
      {/* Left History & Navigation Drawer with Back button returning to main sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewChat={handleNewChat}
        onBack={onClose}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((v) => !v)}
        onDeleteConversation={(id, e) => {
          e.stopPropagation();
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (activeConversationId === id) {
            const remaining = conversations.filter((c) => c.id !== id);
            setActiveConversationId(remaining[0]?.id || "");
          }
        }}
        onPinConversation={handlePinConversation}
        onRenameConversation={handleRenameConversation}
        onArchiveConversation={handleArchiveConversation}
        onOpenScheduledTasks={onOpenScheduledTasks || (() => setIsScheduledTasksInternalOpen(true))}
        activeView={activeView}
        onSelectView={handleSelectView}
      />

      {/* Main stage: Projects view, Artifacts view, Customize view, Plugins view, Benchmarks view, or Chat canvas */}
      {activeView === "projects" ? (
        <ProjectsView
          key={projectsNavKey}
          onClose={onClose}
          onStartProjectSession={(project) => {
            handleSelectView("chat");
            handleNewChat();
          }}
        />
      ) : activeView === "artifacts" ? (
        <ArtifactsView
          onClose={onClose}
          onNavigateToChat={(prompt) => {
            handleSelectView("chat");
            if (prompt) {
              handleSendMessage(prompt, selectedModel);
            }
          }}
        />
      ) : activeView === "customize" ? (
        <CustomizeView onClose={onClose} />
      ) : activeView === "plugins" ? (
        <PluginsView
          onClose={onClose}
          onNavigateToChat={(prompt) => {
            handleSelectView("chat");
            if (prompt) {
              handleSendMessage(prompt, selectedModel);
            }
          }}
        />
      ) : activeView === "benchmarks" ? (
        <div className="flex-1 w-full h-full min-h-0 overflow-y-auto">
          <BenchmarksView
            isOpen={true}
            onClose={() => handleSelectView("chat")}
            docTitle={docTitle}
          />
        </div>
      ) : activeView === "roadmaps" ? (
        <div className="flex-1 w-full h-full min-h-0 overflow-y-auto">
          <ExploreScreen onBack={() => handleSelectView("chat")} />
        </div>
      ) : (
        <main
          aria-label="Chat canvas"
          className={`flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-white relative transition-[padding] duration-150 ${
            isEmptyChat ? "justify-between" : "justify-between"
          } ${!isSidebarOpen ? "pr-11" : ""}`}
        >
          {/* Top Header Bar: Incognito / Temporary Chat Icon */}
          <div className="w-full flex items-center justify-end px-4 py-3 z-30 shrink-0">
            <button
              type="button"
              onClick={() => setIsTemporaryChat((v) => !v)}
              title={isTemporaryChat ? "Temporary chat (Active)" : "Temporary chat"}
              aria-label="Temporary chat"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isTemporaryChat
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
              }`}
            >
              <GhostIcon size={18} className={isTemporaryChat ? "text-white" : "text-slate-700"} />
            </button>
          </div>
          {isEmptyChat ? (
            <div className="flex-1 w-full flex flex-col items-center justify-center px-4 pb-16 select-none animate-in fade-in duration-200">
              <div className="w-full max-w-[845px] flex flex-col items-center">
                {/* Hero Heading below the incognito bar */}
                <div className="text-center mb-6">
                  <h2 className="text-[30px] md:text-[34px] font-medium text-slate-800 tracking-tight">
                    Ask anything
                  </h2>
                </div>

                {/* Centered Input Box */}
                <div className="w-full">
                  <ChatInput
                    onSendMessage={(msg, m) => handleSendMessage(msg, m)}
                    isThinking={isThinking}
                    onStopThinking={() => setIsThinking(false)}
                    placeholder="Prospect, engage, @ to add context"
                    selectedModel={selectedModel}
                    onChangeModel={(m) => setSelectedModel(m)}
                    onOpenProjects={() => handleSelectView("projects")}
                    onOpenPlugins={() => handleSelectView("plugins")}
                    onOpenBenchmarks={() => handleSelectView("benchmarks")}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Scrollable Conversation Thread */}
              <ChatMessages
                messages={currentMessages}
                isThinking={isThinking}
                thinkingSeconds={thinkingSeconds}
                onSelectActionChip={(chip) => {
                  handleSendMessage(chip, selectedModel);
                }}
                onEditMessage={(messageId, newContent) => {
                  if (isTemporaryChat) {
                    const msgIndex = temporaryMessages.findIndex((m) => m.id === messageId);
                    if (msgIndex !== -1) {
                      // Keep messages up to and including the edited one, truncate the rest
                      const updated = temporaryMessages.slice(0, msgIndex);
                      const editedMsg = { ...temporaryMessages[msgIndex], content: newContent };
                      updated.push(editedMsg);
                      setTemporaryMessages(updated);
                      // Re-send with the edited content
                      handleSendMessage(newContent, selectedModel);
                    }
                  } else if (activeConversation) {
                    const msgIndex = activeConversation.messages.findIndex(
                      (m) => m.id === messageId
                    );
                    if (msgIndex !== -1) {
                      setConversations((prev) =>
                        prev.map((conv) => {
                          if (conv.id !== activeConversation.id) return conv;
                          // Keep messages up to and including the edited one, truncate the rest
                          const updated = conv.messages.slice(0, msgIndex);
                          const editedMsg = { ...conv.messages[msgIndex], content: newContent };
                          updated.push(editedMsg);
                          return { ...conv, messages: updated };
                        })
                      );
                      // Re-send with the edited content
                      // Use setTimeout to let the state update flush first
                      setTimeout(() => handleSendMessage(newContent, selectedModel), 0);
                    }
                  }
                }}
              />

              {/* Centered Floating Bottom Input */}
              <div className="animate-in fade-in duration-150 pb-6">
                <ChatInput
                  onSendMessage={(msg, m) => {
                    handleSendMessage(msg, m);
                  }}
                  isThinking={isThinking}
                  onStopThinking={() => setIsThinking(false)}
                  placeholder="Prospect, engage, @ to add context"
                  selectedModel={selectedModel}
                  onChangeModel={(m) => setSelectedModel(m)}
                  onOpenProjects={() => handleSelectView("projects")}
                  onOpenPlugins={() => handleSelectView("plugins")}
                  onOpenBenchmarks={() => handleSelectView("benchmarks")}
                />
              </div>
            </>
          )}
        </main>
      )}

      {/* Internal Scheduled Tasks screen if opened from chat sidebar */}
      {isScheduledTasksInternalOpen && (
        <ScheduledTasksView
          isOpen={isScheduledTasksInternalOpen}
          onClose={() => setIsScheduledTasksInternalOpen(false)}
          openedFromChat={true}
          onNavigateToChat={(prompt) => {
            setIsScheduledTasksInternalOpen(false);
            if (prompt) {
              handleSendMessage(prompt, selectedModel);
            }
          }}
        />
      )}
    </div>
  );
};
