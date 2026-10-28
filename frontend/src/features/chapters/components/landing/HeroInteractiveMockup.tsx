import React, { useState, useRef, useEffect } from "react";
import {
  Clock,
  SquarePen,
  Shapes,
  Briefcase,
  BarChart3,
  BookOpen,
  GitFork,
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
}

const ProjectsIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 15,
  className = "text-[#7185a4] shrink-0",
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
    <path d="M5 4h14" />
    <path d="M5 8h14" />
    <path d="M4 12h16l-1 7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2l-1-7Z" />
  </svg>
);

const navItems = [
  {
    name: "Scheduled tasks",
    icon: <Clock size={15} strokeWidth={1.8} className="text-[#7185a4] shrink-0" />,
  },
  {
    name: "New chat",
    icon: <SquarePen size={15} strokeWidth={1.8} className="text-[#7185a4] shrink-0" />,
  },
  {
    name: "Projects",
    icon: <ProjectsIcon size={15} className="text-[#7185a4] shrink-0" />,
  },
  {
    name: "Artifacts",
    icon: <Shapes size={15} strokeWidth={1.8} className="text-[#7185a4] shrink-0" />,
  },
  {
    name: "Customize",
    icon: <Briefcase size={15} strokeWidth={1.8} className="text-[#7185a4] shrink-0" />,
  },
  {
    name: "Benchmarks",
    icon: <BarChart3 size={15} strokeWidth={1.8} className="text-[#7185a4] shrink-0" />,
  },
  {
    name: "Chapters",
    icon: <BookOpen size={15} strokeWidth={1.8} className="text-[#7185a4] shrink-0" />,
  },
  {
    name: "Roadmaps",
    icon: <GitFork size={15} strokeWidth={1.8} className="text-[#7185a4] shrink-0" />,
  },
];

const availableModels = [
  "Argon",
  "Claude 3.7 Sonnet (Thinking)",
  "GPT-4o (Omni)",
  "Gemini 2.5 Pro",
];

const recentChatsList = [
  "Building an AI Agent",
  "Python DSA Roadmap",
  "Improve My Website",
  "System Design Basics",
  "Startup Ideas",
  "Explain REST APIs",
];

export const HeroInteractiveMockup: React.FC = () => {
  const [activeTab, setActiveTab] = useState("New chat");
  const [activeRecent, setActiveRecent] = useState("Building an AI Agent");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [modelIndex, setModelIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTypingReply, setIsTypingReply] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTypingReply]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = promptText.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setPromptText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "54px";
    }

    setIsTypingReply(true);
    setTimeout(() => {
      setIsTypingReply(false);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "assistant",
          text: `Here is a breakdown of "${trimmed}". Everything is organized across your chapters, code workspace, and verified sources.`,
        },
      ]);
    }, 900);
  };

  const handleSuggestion = (prompt: string) => {
    setPromptText(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const toggleModel = () => {
    setModelIndex((prev) => (prev + 1) % availableModels.length);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 130)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-[17px] border border-[rgba(208,217,232,0.95)] bg-[rgba(255,255,255,0.97)] text-[#182033] shadow-[0_16px_45px_rgba(51,68,105,0.15),0_2px_6px_rgba(35,48,75,0.08)] select-none">
      {/* macOS Title Bar */}
      <header className="flex h-[36px] shrink-0 items-center border-b border-[#f1f3f7] bg-[rgba(255,255,255,0.94)] px-[14px]">
        <div className="flex items-center gap-[8px]" aria-label="Window controls">
          <span className="h-[13px] w-[13px] rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.13)]" />
          <span className="h-[13px] w-[13px] rounded-full bg-[#febc2e] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.13)]" />
          <span className="h-[13px] w-[13px] rounded-full bg-[#28c840] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.13)]" />
        </div>
      </header>

      {/* Application Body */}
      <div className="flex h-[631px] sm:h-[698px] lg:h-[745px] w-full min-h-0 text-[13px]">
        {/* Sidebar */}
        <aside
          className={`flex shrink-0 flex-col border-r border-[#e5eaf2] bg-white transition-all duration-200 ${
            sidebarCollapsed ? "w-[58px]" : "w-[194px]"
          }`}
        >
          {/* Back Row */}
          <div className="flex h-[48px] items-center justify-between border-b border-[#e5eaf2] px-[16px]">
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setActiveRecent("");
                setActiveTab("New chat");
              }}
              title="Reset conversation"
              className="flex items-center gap-[8px] bg-transparent p-0 text-[12px] text-[#33435e] hover:text-black cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {!sidebarCollapsed && <span>Back</span>}
            </button>

            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Toggle sidebar"
              className="flex items-center p-0 text-[#7b8ca7] hover:text-[#33435e] cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M8 4v16" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="border-b border-[#e5eaf2] p-[7px_9px_10px] space-y-[2px]">
            {navItems.map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.name);
                    if (item.name === "New chat") {
                      setActiveRecent("");
                      setMessages([]);
                    }
                  }}
                  className={`flex w-full items-center gap-[9px] rounded-[6px] px-[7px] py-[5px] text-left text-[13px] transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[#edf1f8] text-[#020817] font-black"
                      : "text-[#060d1e] font-black hover:bg-[#f3f6fa] hover:text-[#020817]"
                  }`}
                  title={item.name}
                >
                  {item.icon}
                  {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                </button>
              );
            })}
          </nav>

          {/* Recents Section with Interactive Chat List */}
          {!sidebarCollapsed && (
            <section className="px-[9px] pt-[16px] pb-[12px] flex flex-col min-h-0 overflow-y-auto">
              <h2 className="m-0 px-[6px] pb-[10px] text-[10px] font-black tracking-[0.6px] text-[#3d5070]">
                RECENTS
              </h2>
              <div className="flex flex-col gap-[3px]">
                {recentChatsList.map((chat) => {
                  const isCurrent = activeRecent === chat;
                  return (
                    <button
                      key={chat}
                      type="button"
                      onClick={() => {
                        setActiveRecent(chat);
                        setActiveTab("New chat");
                        setMessages([
                          {
                            id: `m-${chat}`,
                            sender: "assistant",
                            text: `Opened "${chat}". Ask a follow-up or provide code to continue.`,
                          },
                        ]);
                      }}
                      className={`w-full min-w-0 rounded-[6px] px-[8px] py-[7px] text-left text-[12px] transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-[#edf1f8] text-[#020817] font-black"
                          : "text-[#0f1c30] font-black hover:bg-[#f1f4f9] hover:text-[#020817]"
                      }`}
                    >
                      <span className="block truncate">{chat}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Sidebar Bottom (Guest / Account) */}
          <div className="mt-auto flex min-h-[67px] items-center gap-[8px] border-t border-[#e5eaf2] px-[13px] text-[11px] text-[#37445a]">
            <div className="grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full bg-[#e7edf6] text-[10px] font-semibold text-[#62738d]">
              G
            </div>
            {!sidebarCollapsed && <span>Guest · Free</span>}
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="relative flex flex-1 flex-col min-w-0 min-h-0 bg-gradient-to-br from-white via-white to-[#fdfdff]">
          {/* Topbar */}
          <header className="flex h-[39px] shrink-0 items-center justify-between px-[17px] text-[11px] text-[#4f607b] border-b border-[#f5f7fa]">
            <div className="flex items-center gap-[7px]">
              <span>Sara</span>
              <span className="text-[#8795ac]">/</span>
              <span className="text-[#8795ac] truncate max-w-[220px]">
                {activeTab === "New chat" && activeRecent ? activeRecent : activeTab}
              </span>
            </div>

            <div className="flex items-center gap-[6px] text-[10px] text-[#71829e]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 3 5 7v6c0 4 3 7 7 8 4-1 7-4 7-8V7z" />
                <path d="M9 12h6" />
              </svg>
              Temporary
            </div>
          </header>

          {/* Central Workspace Canvas */}
          <section className="relative flex-1 min-h-0 overflow-hidden">
            {/* Centered Shoebox Pinwheel Logo & Brand Label */}
            <div
              className={`pointer-events-none absolute left-1/2 top-[39%] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                messages.length > 0 ? "opacity-15 scale-75 top-[18%]" : "opacity-100 scale-100"
              }`}
              aria-label="Shoebox logo"
            >
              <div className="flex flex-col items-center gap-[12px]">
                <svg viewBox="0 0 100 100" role="img" aria-label="Sara logo" className="h-[48px] w-[48px] block">
                  <g fill="#050505">
                    <path d="M50 47 C34 32 35 15 58 3 C61 23 62 37 50 47Z" />
                    <path d="M53 50 C68 34 85 35 97 58 C77 61 63 62 53 50Z" />
                    <path d="M50 53 C66 68 65 85 42 97 C39 77 38 63 50 53Z" />
                    <path d="M47 50 C32 66 15 65 3 42 C23 39 37 38 47 50Z" />
                  </g>
                </svg>
                <div className="text-[22px] font-medium tracking-[-0.5px] text-[#182033] font-sans">
                  Ask Anything
                </div>
              </div>
            </div>

            {/* Interactive Messages Display */}
            {messages.length > 0 && (
              <div className="absolute inset-x-0 top-[12px] bottom-[180px] mx-auto w-[min(760px,calc(100%-48px))] overflow-y-auto px-2 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[82%] px-4 py-2.5 text-[12.5px] leading-[1.6] ${
                      m.sender === "user"
                        ? "ml-auto rounded-[16px_16px_4px_16px] bg-[#f0f4fa] text-[#26354d]"
                        : "mr-auto rounded-[16px_16px_16px_4px] bg-white border border-[#e5eaf2] text-[#182033] shadow-xs"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                {isTypingReply && (
                  <div className="mr-auto inline-flex items-center gap-1.5 rounded-[14px] bg-white border border-[#e5eaf2] px-3 py-2 text-[11px] text-[#7c8ba5]">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7c9bc5]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7c9bc5] [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7c9bc5] [animation-delay:0.4s]" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Composer Area Positioned at Bottom */}
            <div className="absolute bottom-[36px] sm:bottom-[46px] left-1/2 -translate-x-1/2 w-[min(880px,calc(100%-48px))] flex flex-col gap-[14px] sm:gap-[18px]">
              {/* Form Input Container */}
              <form
                onSubmit={handleSend}
                className="group relative flex flex-col min-h-[96px] rounded-[21px] border border-[#d7e2f1] bg-[rgba(255,255,255,0.96)] shadow-[0_0_0_1px_rgba(223,232,245,0.3),0_5px_16px_rgba(61,84,126,0.035)] transition-all focus-within:border-[#b5c9e5] focus-within:shadow-[0_0_0_3px_rgba(134,164,207,0.12)]"
              >
                <textarea
                  ref={textareaRef}
                  value={promptText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask anything..."
                  aria-label="Your message"
                  className="block w-full resize-none bg-transparent px-[20px] pt-[16px] pb-[5px] text-[13px] text-[#182033] placeholder-[#879bb9] outline-none"
                  style={{ height: "52px" }}
                />

                <div className="flex min-h-[38px] items-center gap-[12px] px-[14px] pb-[9px] pt-1">
                  {/* Plus / Attach Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPromptText((prev) => (prev ? `${prev} [Attached file]` : "[Attached file]"));
                    }}
                    title="Attach file"
                    className="grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full text-[#7189ad] hover:bg-[#f0f4fa] transition-colors cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>

                  <div className="flex-1" />

                  {/* Model Selector Pill */}
                  <button
                    type="button"
                    onClick={toggleModel}
                    title="Switch Model"
                    className="flex items-center gap-[6px] text-[11.5px] font-semibold text-[#334155] hover:text-[#0f172a] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>{availableModels[modelIndex]}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3">
                      <path d="m7 10 5 5 5-5" />
                    </svg>
                  </button>

                  {/* Mic Button */}
                  <button
                    type="button"
                    title="Voice input"
                    className="grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full text-[#7189ad] hover:bg-[#f0f4fa] transition-colors cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                      <rect x="9" y="3" width="6" height="12" rx="3" />
                      <path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8" />
                    </svg>
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={!promptText.trim()}
                    className={`grid h-[33px] w-[33px] shrink-0 place-items-center rounded-full transition-all cursor-pointer ${
                      promptText.trim()
                        ? "bg-[#1c2638] text-white shadow-xs"
                        : "bg-[#edf3fa] text-[#7d9cc3]"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                      <path d="M12 19V5m-6 6 6-6 6 6" />
                    </svg>
                  </button>
                </div>
              </form>

              {/* Suggestion Pills - Bolder text */}
              <div className="flex flex-wrap items-center justify-center gap-x-[26px] gap-y-[10px] text-[12px] font-extrabold text-[#1e293b]">
                <button
                  type="button"
                  onClick={() => handleSuggestion("Explain a concept")}
                  className="inline-flex items-center gap-[5px] hover:text-[#000000] transition-colors cursor-pointer"
                >
                  Explain a concept
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-2.5 w-2.5">
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => handleSuggestion("Help me write")}
                  className="inline-flex items-center gap-[5px] hover:text-[#000000] transition-colors cursor-pointer"
                >
                  Help me write
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-2.5 w-2.5">
                    <path d="M7 17 7 17M8 7h9v9" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => handleSuggestion("Summarize a document")}
                  className="inline-flex items-center gap-[5px] hover:text-[#000000] transition-colors cursor-pointer"
                >
                  Summarize a document
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-2.5 w-2.5">
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
