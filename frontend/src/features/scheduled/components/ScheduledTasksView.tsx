import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search,
  Plus,
  SlidersHorizontal,
  X,
  Play,
  Trash2,
  CheckCircle2,
  Pause,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { ClockIcon } from "./ClockIcon";
import {
  type ScheduledTask,
  type TaskTemplate,
  type TaskFrequency,
  DEFAULT_TASK_TEMPLATES,
} from "./scheduledTypes";

export interface ScheduledTasksViewProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToChat?: (initialPrompt?: string) => void;
  openedFromChat?: boolean;
}

const STORAGE_KEY = "shoebox_scheduled_tasks";

const REPEAT_OPTIONS: { label: string; value: TaskFrequency }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekdays", value: "weekdays" },
  { label: "Weekly", value: "weekly" },
  { label: "Custom", value: "custom" },
];

// All 15-minute time increments from 12:00 AM to 11:45 PM (96 intervals)
const TIME_OPTIONS: string[] = (() => {
  const list: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const period = h < 12 ? "AM" : "PM";
      const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
      list.push(`${displayH}:${m.toString().padStart(2, "0")} ${period}`);
    }
  }
  return list;
})();

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const ScheduledTasksView: React.FC<ScheduledTasksViewProps> = ({
  isOpen,
  onClose,
  onNavigateToChat,
  openedFromChat = false,
}) => {
  // Load tasks from localStorage (defaults to empty list as in design)
  const [tasks, setTasks] = useState<ScheduledTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return [];
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [executingTask, setExecutingTask] = useState<ScheduledTask | null>(null);

  // Save to localStorage whenever tasks change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Ignore
    }
  }, [tasks]);

  // Keyboard navigation: Escape key closes the window or modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isCreateModalOpen) {
          setIsCreateModalOpen(false);
        } else if (executingTask) {
          setExecutingTask(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isCreateModalOpen, executingTask]);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Filter state (All, Active, Paused)
  const [filterMode, setFilterMode] = useState<"all" | "active" | "paused">("all");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Close filter menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    };
    if (isFilterMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isFilterMenuOpen]);

  // Modal creation state
  const [modalTitle, setModalTitle] = useState("");
  const [modalPrompt, setModalPrompt] = useState("");
  const [modalIcon, setModalIcon] = useState("⏱️");
  const [modalFrequency, setModalFrequency] = useState<TaskFrequency>("daily");
  const [modalTime, setModalTime] = useState("9:00 AM");
  const [modalDay, setModalDay] = useState("Monday");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  const [isRepeatDropdownOpen, setIsRepeatDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  // Advanced settings state (matching OpenAI Schedule a task modal)
  const [runOnComputer, setRunOnComputer] = useState(true);
  const [notificationsMode, setNotificationsMode] = useState<
    "Important updates" | "Failed runs only"
  >("Important updates");
  const [isNotificationsDropdownOpen, setIsNotificationsDropdownOpen] = useState(false);
  const [startInNewChat, setStartInNewChat] = useState(false);
  const [selectedModel, setSelectedModel] = useState("GPT-4o");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [selectedEffort, setSelectedEffort] = useState<"Low" | "Medium" | "High">("Medium");
  const [isEffortDropdownOpen, setIsEffortDropdownOpen] = useState(false);

  const repeatDropdownRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const effortDropdownRef = useRef<HTMLDivElement>(null);
  const modalInputRef = useRef<HTMLTextAreaElement>(null);
  const selectedTimeItemRef = useRef<HTMLButtonElement>(null);
  const timeListRef = useRef<HTMLDivElement>(null);

  // Timezone display (e.g. "India Time" as shown in design)
  const timezoneLabel = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes("Kolkata") || tz.includes("Calcutta") || tz.includes("India")) {
        return "India Time";
      }
      return "India Time";
    } catch {
      return "India Time";
    }
  }, []);

  // Auto-focus instructions input when modal opens
  useEffect(() => {
    if (isCreateModalOpen) {
      setTimeout(() => {
        modalInputRef.current?.focus();
      }, 50);
    }
  }, [isCreateModalOpen]);

  // Auto-scroll to selected time when time dropdown opens
  useEffect(() => {
    if (isTimeDropdownOpen) {
      setTimeout(() => {
        selectedTimeItemRef.current?.scrollIntoView({
          block: "center",
          behavior: "instant",
        });
      }, 20);
    }
  }, [isTimeDropdownOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideDropdownClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (repeatDropdownRef.current && !repeatDropdownRef.current.contains(target)) {
        setIsRepeatDropdownOpen(false);
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(target)) {
        setIsTimeDropdownOpen(false);
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(target)) {
        setIsNotificationsDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(target)) {
        setIsModelDropdownOpen(false);
      }
      if (effortDropdownRef.current && !effortDropdownRef.current.contains(target)) {
        setIsEffortDropdownOpen(false);
      }
    };
    if (
      isRepeatDropdownOpen ||
      isTimeDropdownOpen ||
      isNotificationsDropdownOpen ||
      isModelDropdownOpen ||
      isEffortDropdownOpen
    ) {
      document.addEventListener("mousedown", handleOutsideDropdownClick);
      return () => document.removeEventListener("mousedown", handleOutsideDropdownClick);
    }
  }, [
    isRepeatDropdownOpen,
    isTimeDropdownOpen,
    isNotificationsDropdownOpen,
    isModelDropdownOpen,
    isEffortDropdownOpen,
  ]);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Execution simulation state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string>("");

  // Filtered upcoming tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.prompt.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterMode === "all" ||
        (filterMode === "active" && t.isActive) ||
        (filterMode === "paused" && !t.isActive);

      return matchesSearch && matchesFilter;
    });
  }, [tasks, searchQuery, filterMode]);

  // Open modal pre-filled from template
  const handleOpenFromTemplate = (tmpl: TaskTemplate) => {
    setModalTitle(tmpl.title);
    setModalPrompt(tmpl.description);
    setModalIcon(tmpl.icon);
    setModalFrequency(tmpl.suggestedFrequency);
    setModalTime(tmpl.suggestedTime || "9:00 AM");
    setModalDay(tmpl.suggestedDay || "Monday");
    setRunOnComputer(true);
    setNotificationsMode("Important updates");
    setStartInNewChat(false);
    setSelectedModel("GPT-4o");
    setSelectedEffort("Medium");
    setIsAdvancedOpen(true);
    setIsRepeatDropdownOpen(false);
    setIsTimeDropdownOpen(false);
    setIsNotificationsDropdownOpen(false);
    setIsModelDropdownOpen(false);
    setIsEffortDropdownOpen(false);
    setIsCreateModalOpen(true);
  };

  // Open empty modal
  const handleOpenNewTask = () => {
    setModalTitle("");
    setModalPrompt("");
    setModalIcon("⏱️");
    setModalFrequency("daily");
    setModalTime("9:00 AM");
    setModalDay("Monday");
    setRunOnComputer(true);
    setNotificationsMode("Important updates");
    setStartInNewChat(false);
    setSelectedModel("GPT-4o");
    setSelectedEffort("Medium");
    setIsAdvancedOpen(true);
    setIsRepeatDropdownOpen(false);
    setIsTimeDropdownOpen(false);
    setIsNotificationsDropdownOpen(false);
    setIsModelDropdownOpen(false);
    setIsEffortDropdownOpen(false);
    setIsCreateModalOpen(true);
  };

  // Save new task
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    const promptText = modalPrompt.trim();
    if (!promptText) return;

    const derivedTitle =
      modalTitle.trim() || (promptText.length > 32 ? promptText.slice(0, 32) + "..." : promptText);

    const newTask: ScheduledTask = {
      id: `task-${Date.now()}`,
      title: derivedTitle,
      prompt: promptText,
      icon: modalIcon || "⏱️",
      frequency: modalFrequency,
      time: modalTime,
      dayOfWeek: modalFrequency === "weekly" ? modalDay : undefined,
      isActive: true,
      createdAt: Date.now(),
      nextRun:
        modalFrequency === "daily"
          ? `Tomorrow at ${modalTime}`
          : modalFrequency === "weekdays"
            ? `Next weekday at ${modalTime}`
            : modalFrequency === "weekly"
              ? `Every ${modalDay} at ${modalTime}`
              : `Next month at ${modalTime}`,
      runOnComputer,
      notifications: notificationsMode,
      startInNewChat,
      model: selectedModel,
      effort: selectedEffort,
    };

    setTasks((prev) => [newTask, ...prev]);
    setIsCreateModalOpen(false);
    showToast(`Task "${newTask.title}" scheduled`);
  };

  // Toggle active / paused
  const handleToggleTaskActive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t)));
  };

  // Delete task
  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast("Task removed from schedule");
  };

  // Run task simulation
  const handleRunTask = (task: ScheduledTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setExecutingTask(task);
    setIsExecuting(true);
    setExecutionOutput("");

    setTimeout(() => {
      setIsExecuting(false);
      setExecutionOutput(
        `✓ Task executed successfully at ${new Date().toLocaleTimeString()}.\n\n` +
          `Summary for "${task.title}":\n` +
          `Prompt dispatched: "${task.prompt}"\n` +
          `Status: Completed without errors. Next scheduled run: ${task.nextRun || "Tomorrow"}.`
      );
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                lastRun: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              }
            : t
        )
      );
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scheduled tasks"
      className="fixed inset-0 z-50 bg-[#F9F9F7] flex font-sans select-none overflow-hidden text-slate-900 animate-in fade-in duration-150"
    >
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[80] bg-slate-900/95 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT SIDEBAR: "Scheduled" */}
      <aside
        aria-label="Scheduled tasks sidebar"
        className="w-60 md:w-64 shrink-0 border-r border-[#EAEAE8] bg-[#F6F6F4] flex flex-col h-full select-none"
      >
        {/* Header row: "Scheduled" + Search icon */}
        <div className="h-12 px-3.5 flex items-center justify-between border-b border-[#EAEAE8]/60 shrink-0">
          <div className="flex items-center gap-2">
            {openedFromChat && (
              <button
                type="button"
                onClick={onClose}
                title="Back to chat"
                aria-label="Back to chat"
                className="w-7 h-7 -ml-1 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <ArrowLeft size={15} strokeWidth={2} />
              </button>
            )}
            <h1 className="text-[14px] font-semibold text-slate-900 tracking-tight">Scheduled</h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsSearchOpen((prev) => !prev);
              if (isSearchOpen) setSearchQuery("");
            }}
            title="Search scheduled tasks"
            aria-label="Search scheduled tasks"
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              isSearchOpen || searchQuery
                ? "bg-slate-200/80 text-slate-900"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <Search size={14} strokeWidth={1.8} />
          </button>
        </div>

        {/* Expandable search bar */}
        {isSearchOpen && (
          <div className="px-3 pt-2.5 pb-1 border-b border-[#EAEAE8]/60 animate-in fade-in duration-150">
            <div className="relative flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full h-7 pl-7 pr-6 bg-white border border-[#EAEAE8] rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
              />
              <Search size={12} className="absolute left-2 text-slate-400 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* + New task button */}
        <div className="px-2.5 pt-2 pb-1 shrink-0">
          <button
            type="button"
            onClick={handleOpenNewTask}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] font-normal text-slate-800 hover:bg-slate-200/60 hover:text-slate-950 transition-colors cursor-pointer text-left"
          >
            <Plus size={14} strokeWidth={2} className="text-slate-600 shrink-0" />
            <span>New task</span>
          </button>
        </div>

        {/* Upcoming Section Header with Filter Icon */}
        <div className="px-3.5 pt-3 pb-1 flex items-center justify-between shrink-0 relative">
          <span className="text-[12px] font-medium text-slate-500">Upcoming</span>

          <div className="relative" ref={filterMenuRef}>
            <button
              type="button"
              onClick={() => setIsFilterMenuOpen((v) => !v)}
              title="Filter tasks"
              aria-label="Filter tasks"
              className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                filterMode !== "all"
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <SlidersHorizontal size={12} strokeWidth={1.8} />
            </button>

            {/* Filter Menu Popover */}
            {isFilterMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode("all");
                    setIsFilterMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 ${
                    filterMode === "all" ? "font-semibold text-slate-900" : "text-slate-600"
                  }`}
                >
                  <span>All</span>
                  {filterMode === "all" && <CheckCircle2 size={12} className="text-slate-900" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode("active");
                    setIsFilterMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 ${
                    filterMode === "active" ? "font-semibold text-slate-900" : "text-slate-600"
                  }`}
                >
                  <span>Active</span>
                  {filterMode === "active" && <CheckCircle2 size={12} className="text-slate-900" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode("paused");
                    setIsFilterMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 ${
                    filterMode === "paused" ? "font-semibold text-slate-900" : "text-slate-600"
                  }`}
                >
                  <span>Paused</span>
                  {filterMode === "paused" && <CheckCircle2 size={12} className="text-slate-900" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming List or "No scheduled tasks" Empty State */}
        <div className="flex-1 overflow-y-auto px-2 py-1 cool-scrollbar">
          {filteredTasks.length === 0 ? (
            <div className="px-2 pt-1 text-[12.5px] text-slate-400 font-normal">
              {searchQuery ? "No matching tasks" : "No scheduled tasks"}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`group relative rounded-lg p-2 transition-all cursor-pointer border ${
                    task.isActive
                      ? "bg-white/70 border-slate-200/60 hover:bg-white hover:border-slate-300 shadow-2xs"
                      : "bg-slate-100/50 border-transparent opacity-60 hover:opacity-90"
                  }`}
                  onClick={() => {
                    setModalTitle(task.title);
                    setModalPrompt(task.prompt);
                    setModalIcon(task.icon);
                    setModalFrequency(task.frequency);
                    setModalTime(task.time);
                    setModalDay(task.dayOfWeek || "Monday");
                    setIsCreateModalOpen(true);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm shrink-0 pt-0.5">{task.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium text-slate-800 truncate">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {task.nextRun || `${task.frequency} at ${task.time}`}
                      </p>
                    </div>
                  </div>

                  {/* Task Quick Actions (Visible on hover) */}
                  <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => handleRunTask(task, e)}
                      title="Run now"
                      className="flex items-center gap-1 hover:text-slate-900 px-1 py-0.5 rounded hover:bg-slate-100"
                    >
                      <Play size={10} className="fill-current" />
                      <span>Run</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleTaskActive(task.id, e)}
                        title={task.isActive ? "Pause task" : "Resume task"}
                        className="p-1 hover:text-slate-900 rounded hover:bg-slate-100"
                      >
                        {task.isActive ? <Pause size={11} /> : <Play size={11} />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        title="Delete task"
                        className="p-1 hover:text-rose-600 rounded hover:bg-rose-50"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer info / Back button */}
        <div className="p-3 border-t border-[#EAEAE8]/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-medium text-slate-700 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={13} strokeWidth={2} />
            <span>{openedFromChat ? "Back to chat" : "Back to document"}</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CANVAS: Schedule a task hero + 6 Cards Grid */}
      <main
        aria-label="Schedule a task canvas"
        className="flex-1 min-w-0 h-full flex flex-col bg-[#F9F9F7] relative overflow-y-auto cool-scrollbar"
      >
        {/* Top-right close button */}
        <div className="w-full h-12 px-4 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Centered Hero Content */}
        <div className="w-full max-w-[760px] px-6 mx-auto my-auto flex flex-col items-center py-8 animate-in fade-in duration-200">
          {/* 3D Glossy Clock Icon */}
          <div className="mb-2.5">
            <ClockIcon size={52} />
          </div>

          {/* Heading */}
          <h2 className="text-[19px] md:text-[21px] font-semibold text-slate-900 tracking-tight text-center">
            Schedule a task
          </h2>

          {/* Subtitle */}
          <p className="text-[13.5px] text-slate-500 text-center mt-1 mb-8 max-w-md">
            ChatGPT can take care of ongoing tasks so you don't have to.
          </p>

          {/* 6 Cards in 2 columns x 3 rows grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
            {DEFAULT_TASK_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleOpenFromTemplate(tmpl)}
                className="group relative rounded-2xl border border-dashed border-[#E5E5E5] bg-[#F9F9F7] hover:bg-white hover:border-slate-300/90 hover:shadow-xs p-4 sm:p-4.5 px-4.5 flex items-start gap-3.5 text-left transition-all duration-150 cursor-pointer active:scale-[0.99]"
              >
                {/* Icon */}
                <span className="text-2xl shrink-0 pt-0.5 group-hover:scale-105 transition-transform">
                  {tmpl.icon}
                </span>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold text-slate-800 tracking-tight">
                    {tmpl.title}
                  </h3>
                  <p className="text-[12.5px] text-slate-500 leading-snug mt-0.5">
                    {tmpl.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* SCHEDULE A TASK MODAL (OpenAI / ChatGPT Design) */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreateModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-zinc-200/80 w-full max-w-[560px] max-h-[90vh] overflow-y-auto cool-scrollbar p-6 sm:p-7 animate-in zoom-in-95 duration-150 relative text-left flex flex-col">
            {/* Header: Title + Close Icon */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] sm:text-[19px] font-semibold text-zinc-900 tracking-tight">
                Schedule a task
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                title="Close"
                aria-label="Close"
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer -mr-1"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="flex flex-col">
              {/* Instructions Textarea Box */}
              <div className="w-full rounded-xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 focus-within:border-zinc-300 transition-all shadow-2xs">
                <textarea
                  ref={modalInputRef}
                  rows={3}
                  value={modalPrompt}
                  onChange={(e) => setModalPrompt(e.target.value)}
                  placeholder="Instructions..."
                  className="w-full h-24 sm:h-28 text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed bg-transparent"
                />
              </div>

              {/* Repeat & Time Container */}
              <div className="mt-3.5 rounded-xl border border-zinc-200/90 bg-white overflow-visible divide-y divide-zinc-100 shadow-2xs">
                {/* Row 1: Repeat */}
                <div className="relative px-5 py-3 sm:py-3.5 flex items-center justify-between">
                  <span className="text-[13.5px] sm:text-[14px] font-normal text-zinc-800">
                    Repeat
                  </span>

                  <div className="relative" ref={repeatDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRepeatDropdownOpen((v) => !v);
                        setIsTimeDropdownOpen(false);
                      }}
                      className="text-[13.5px] sm:text-[14px] text-zinc-700 hover:text-zinc-950 flex items-center gap-1.5 transition-colors cursor-pointer select-none px-2.5 py-1 rounded-lg"
                    >
                      <span className="capitalize">{modalFrequency}</span>
                      <ChevronDown
                        size={14}
                        className={`text-zinc-400 transition-transform duration-200 ${
                          isRepeatDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isRepeatDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 sm:w-52 bg-white rounded-xl shadow-xl border border-zinc-200/90 p-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        <div className="px-3 pt-1 pb-1.5 text-[11.5px] font-medium text-zinc-400 select-none">
                          Interval
                        </div>
                        {REPEAT_OPTIONS.map((opt) => {
                          const isSelected = modalFrequency === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setModalFrequency(opt.value);
                                setIsRepeatDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left flex items-center justify-between rounded-lg transition-colors cursor-pointer text-[13px] ${
                                isSelected
                                  ? "bg-zinc-100/90 font-medium text-zinc-950"
                                  : "text-zinc-800 hover:bg-zinc-100/70"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && (
                                <Check
                                  size={15}
                                  strokeWidth={1.8}
                                  className="text-zinc-800 shrink-0"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Weekly Day Selector (if Weekly is chosen) */}
                {modalFrequency === "weekly" && (
                  <div className="px-5 py-2.5 bg-zinc-50/70 flex items-center justify-between border-t border-zinc-100">
                    <span className="text-[13px] text-zinc-600">On</span>
                    <select
                      value={modalDay}
                      onChange={(e) => setModalDay(e.target.value)}
                      className="text-[13px] bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-zinc-400 cursor-pointer shadow-2xs"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          Every {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Row 2: Time */}
                <div className="relative px-5 py-3 sm:py-3.5 flex items-center justify-between">
                  <span className="text-[13.5px] sm:text-[14px] font-normal text-zinc-800">
                    Time
                  </span>

                  <div className="relative" ref={timeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTimeDropdownOpen((v) => !v);
                        setIsRepeatDropdownOpen(false);
                      }}
                      className={`text-[13.5px] sm:text-[14px] transition-colors cursor-pointer select-none rounded-lg flex items-center gap-1.5 px-2.5 py-1 ${
                        isTimeDropdownOpen
                          ? "border border-zinc-500 bg-white px-2.5 py-1 text-zinc-950 shadow-2xs"
                          : "text-zinc-700 hover:text-zinc-950"
                      }`}
                    >
                      <span>
                        {modalTime} {timezoneLabel}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${
                          isTimeDropdownOpen ? "rotate-180 text-zinc-600" : "text-zinc-400"
                        }`}
                      />
                    </button>

                    {/* Time Dropdown Menu (12:00 AM to 11:45 PM every 15 mins) */}
                    {isTimeDropdownOpen && (
                      <div
                        ref={timeListRef}
                        className="absolute right-0 top-full mt-1.5 w-52 sm:w-56 bg-white rounded-xl shadow-xl border border-zinc-200/90 p-1.5 z-50 text-[13px] max-h-60 overflow-y-auto cool-scrollbar animate-in fade-in zoom-in-95 duration-100 origin-top-right"
                      >
                        {TIME_OPTIONS.map((timeStr) => {
                          const isSelected = modalTime === timeStr;
                          return (
                            <button
                              key={timeStr}
                              ref={isSelected ? selectedTimeItemRef : null}
                              type="button"
                              onClick={() => {
                                setModalTime(timeStr);
                                setIsTimeDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left rounded-lg transition-colors cursor-pointer text-[13px] ${
                                isSelected
                                  ? "bg-zinc-100 font-medium text-zinc-950"
                                  : "text-zinc-800 hover:bg-zinc-100/70"
                              }`}
                            >
                              <span>{timeStr}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced Accordion Toggle */}
              <div className="mt-3.5 mb-2.5 px-0.5">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-[13px] font-normal text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer select-none"
                >
                  <span>Advanced</span>
                  {isAdvancedOpen ? (
                    <ChevronUp size={14} className="text-zinc-500" />
                  ) : (
                    <ChevronDown size={14} className="text-zinc-500" />
                  )}
                </button>
              </div>

              {/* Advanced Items Stack (5 rounded rows) */}
              {isAdvancedOpen && (
                <div className="flex flex-col gap-2.5 mb-1 animate-in fade-in duration-150">
                  {/* Row 1: Run on this computer */}
                  <div className="w-full rounded-xl border border-zinc-200/90 bg-white px-5 py-3 flex items-center justify-between shadow-2xs">
                    <span className="text-[13.5px] sm:text-[14px] font-normal text-zinc-800">
                      Run on this computer
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={runOnComputer}
                      onClick={() => setRunOnComputer((v) => !v)}
                      className={`w-[44px] h-[26px] rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        runOnComputer ? "bg-[#c15738]" : "bg-zinc-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-[3px] ${
                          runOnComputer ? "translate-x-[21px]" : "translate-x-[3px]"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row 2: Notifications */}
                  <div className="relative w-full rounded-xl border border-zinc-200/90 bg-white px-5 py-3 flex items-center justify-between shadow-2xs">
                    <span className="text-[13.5px] sm:text-[14px] font-normal text-zinc-800">
                      Notifications
                    </span>

                    <div className="relative" ref={notificationsDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNotificationsDropdownOpen((v) => !v);
                          setIsModelDropdownOpen(false);
                          setIsEffortDropdownOpen(false);
                          setIsRepeatDropdownOpen(false);
                          setIsTimeDropdownOpen(false);
                        }}
                        className="border border-[#c15738] bg-transparent text-[12.5px] sm:text-[13px] text-zinc-800 hover:bg-[#c15738]/5 transition-colors cursor-pointer select-none rounded-full flex items-center gap-1.5 px-3 py-1"
                      >
                        <span>{notificationsMode}</span>
                        <ChevronDown
                          size={13}
                          className={`text-[#c15738] transition-transform duration-200 ${
                            isNotificationsDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Notifications Popover Menu */}
                      {isNotificationsDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-zinc-200/90 p-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                          <div className="px-3 pt-1 pb-1.5 text-[11.5px] font-medium text-zinc-400 select-none">
                            Notifications
                          </div>
                          {(["Important updates", "Failed runs only"] as const).map((mode) => {
                            const isSelected = notificationsMode === mode;
                            return (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => {
                                  setNotificationsMode(mode);
                                  setIsNotificationsDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left flex items-center justify-between rounded-lg transition-colors cursor-pointer text-[13px] ${
                                  isSelected
                                    ? "bg-zinc-100/90 font-medium text-zinc-950"
                                    : "text-zinc-800 hover:bg-zinc-100/70"
                                }`}
                              >
                                <span>{mode}</span>
                                {isSelected && (
                                  <Check
                                    size={15}
                                    strokeWidth={1.8}
                                    className="text-zinc-800 shrink-0"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Start each run in new chat */}
                  <div className="w-full rounded-xl border border-zinc-200/90 bg-white px-5 py-3 flex items-center justify-between shadow-2xs">
                    <span className="text-[13.5px] sm:text-[14px] font-normal text-zinc-800">
                      Start each run in new chat
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={startInNewChat}
                      onClick={() => setStartInNewChat((v) => !v)}
                      className={`w-[44px] h-[26px] rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        startInNewChat ? "bg-[#c15738]" : "bg-zinc-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-[3px] ${
                          startInNewChat ? "translate-x-[21px]" : "translate-x-[3px]"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row 4: Model */}
                  <div className="relative w-full rounded-xl border border-zinc-200/90 bg-white px-5 py-3 flex items-center justify-between shadow-2xs">
                    <span className="text-[13.5px] sm:text-[14px] font-normal text-zinc-800">
                      Model
                    </span>

                    <div className="relative" ref={modelDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsModelDropdownOpen((v) => !v);
                          setIsNotificationsDropdownOpen(false);
                          setIsEffortDropdownOpen(false);
                          setIsRepeatDropdownOpen(false);
                          setIsTimeDropdownOpen(false);
                        }}
                        className={`text-[13.5px] sm:text-[14px] transition-colors cursor-pointer select-none rounded-lg flex items-center gap-1.5 px-2.5 py-1 ${
                          isModelDropdownOpen
                            ? "text-zinc-950 font-medium"
                            : "text-zinc-700 hover:text-zinc-950"
                        }`}
                      >
                        <span>{selectedModel}</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${
                            isModelDropdownOpen ? "rotate-180 text-zinc-600" : "text-zinc-400"
                          }`}
                        />
                      </button>

                      {/* Model Popover Menu */}
                      {isModelDropdownOpen && (
                        <div className="absolute right-0 bottom-full mb-2 w-52 bg-white rounded-xl shadow-xl border border-zinc-200/90 p-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 origin-bottom-right">
                          <div className="px-3 pt-1 pb-1.5 text-[11.5px] font-medium text-zinc-400 select-none">
                            Model
                          </div>
                          {[
                            "GPT-4o",
                            "Claude 3.7 Sonnet",
                            "Gemini 2.5 Pro",
                            "o3-mini",
                            "DeepSeek R1",
                          ].map((modelName) => {
                            const isSelected = selectedModel === modelName;
                            return (
                              <button
                                key={modelName}
                                type="button"
                                onClick={() => {
                                  setSelectedModel(modelName);
                                  setIsModelDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left flex items-center justify-between rounded-lg transition-colors cursor-pointer text-[13px] ${
                                  isSelected
                                    ? "bg-zinc-100/90 font-medium text-zinc-950"
                                    : "text-zinc-800 hover:bg-zinc-100/70"
                                }`}
                              >
                                <span>{modelName}</span>
                                {isSelected && (
                                  <Check
                                    size={15}
                                    strokeWidth={1.8}
                                    className="text-zinc-800 shrink-0"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 5: Effort */}
                  <div className="relative w-full rounded-xl border border-zinc-200/90 bg-white px-5 py-3 flex items-center justify-between shadow-2xs">
                    <span className="text-[13.5px] sm:text-[14px] font-normal text-zinc-800">
                      Effort
                    </span>

                    <div className="relative" ref={effortDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEffortDropdownOpen((v) => !v);
                          setIsNotificationsDropdownOpen(false);
                          setIsModelDropdownOpen(false);
                          setIsRepeatDropdownOpen(false);
                          setIsTimeDropdownOpen(false);
                        }}
                        className={`text-[13.5px] sm:text-[14px] transition-colors cursor-pointer select-none rounded-lg flex items-center gap-1.5 px-2.5 py-1 ${
                          isEffortDropdownOpen
                            ? "text-zinc-950 font-medium"
                            : "text-zinc-700 hover:text-zinc-950"
                        }`}
                      >
                        <span>{selectedEffort}</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${
                            isEffortDropdownOpen ? "rotate-180 text-zinc-600" : "text-zinc-400"
                          }`}
                        />
                      </button>

                      {/* Effort Popover Menu */}
                      {isEffortDropdownOpen && (
                        <div className="absolute right-0 bottom-full mb-2 w-44 bg-white rounded-xl shadow-xl border border-zinc-200/90 p-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 origin-bottom-right">
                          <div className="px-3 pt-1 pb-1.5 text-[11.5px] font-medium text-zinc-400 select-none">
                            Reasoning Effort
                          </div>
                          {(["Low", "Medium", "High"] as const).map((eff) => {
                            const isSelected = selectedEffort === eff;
                            return (
                              <button
                                key={eff}
                                type="button"
                                onClick={() => {
                                  setSelectedEffort(eff);
                                  setIsEffortDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left flex items-center justify-between rounded-lg transition-colors cursor-pointer text-[13px] ${
                                  isSelected
                                    ? "bg-zinc-100/90 font-medium text-zinc-950"
                                    : "text-zinc-800 hover:bg-zinc-100/70"
                                }`}
                              >
                                <span>{eff}</span>
                                {isSelected && (
                                  <Check
                                    size={15}
                                    strokeWidth={1.8}
                                    className="text-zinc-800 shrink-0"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Footer Row: Cancel + Create pills on right */}
              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2 rounded-full bg-[#F0F0EE] hover:bg-[#E5E5E3] text-[13.5px] font-medium text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!modalPrompt.trim()}
                  className={`px-5 py-2 rounded-full text-[13.5px] font-medium transition-all ${
                    modalPrompt.trim()
                      ? "bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer active:scale-95 shadow-xs"
                      : "bg-zinc-800 text-white cursor-pointer"
                  }`}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXECUTION MODAL / RESULT PREVIEW */}
      {executingTask && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{executingTask.icon}</span>
                <h3 className="text-sm font-semibold text-slate-900">{executingTask.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setExecutingTask(null)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              {isExecuting ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                  <p className="text-xs">Running scheduled task...</p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {executionOutput}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    {onNavigateToChat && (
                      <button
                        type="button"
                        onClick={() => {
                          const p = executingTask.prompt;
                          setExecutingTask(null);
                          onClose();
                          onNavigateToChat(p);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles size={13} />
                        <span>Continue in Chat</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setExecutingTask(null)}
                      className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
