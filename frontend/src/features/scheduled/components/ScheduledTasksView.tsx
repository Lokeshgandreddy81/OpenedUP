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
  ChevronDown,
  ChevronUp,
  Check,
  Pencil,
  Copy,
  RotateCw,
  Calendar,
  Clock,
  Bot,
  MessageSquarePlus,
  Activity,
  History,
  AlertCircle,
  FileText,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import {
  getModelMeta,
  PROVIDER_CATALOG,
  type ScheduledTaskRunRecord,
} from "@charan-interiors/contracts";
import { useProviderKeys, getKeyForModel } from "../../customize/publicApi";
import { ClockIcon } from "./ClockIcon";
import { AssistantResponse } from "../../chat";
import {
  type ScheduledTask,
  type TaskTemplate,
  type TaskFrequency,
  DEFAULT_TASK_TEMPLATES,
} from "./scheduledTypes";
import {
  createScheduledTask,
  deleteScheduledTask,
  listScheduledTasks,
  listScheduledTaskRuns,
  runScheduledTask,
  scheduledModelName,
  scheduledRunMessage,
  SCHEDULED_MODEL_IDS,
  taskInput,
  updateScheduledTask,
} from "../services/scheduledTasksApi";

export interface ScheduledTasksViewProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToChat?: (initialPrompt?: string) => void;
  onNavigateToProviders: () => void;
  openedFromChat?: boolean;
}

const REPEAT_OPTIONS: { label: string; value: TaskFrequency }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekdays", value: "weekdays" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const AVAILABLE_ICONS = ["⏱️", "☀️", "📰", "📊", "📧", "⚡", "🧠", "💻", "🎯", "🔔", "📝", "🚀"];

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
  onNavigateToProviders,
  openedFromChat = false,
}) => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { hasKey } = useProviderKeys();
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Execution Modal state
  const [executingTask, setExecutingTask] = useState<ScheduledTask | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string>("");
  const [executionRunRecord, setExecutionRunRecord] = useState<ScheduledTaskRunRecord | null>(null);
  const [executionTimerSeconds, setExecutionTimerSeconds] = useState(0);

  // Runs history for selected task
  const [runsForSelectedTask, setRunsForSelectedTask] = useState<ScheduledTaskRunRecord[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);

  // Delete confirmation modal state
  const [taskPendingDelete, setTaskPendingDelete] = useState<ScheduledTask | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clipboard copy state
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [copiedRunOutputId, setCopiedRunOutputId] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter state (All, Active, Paused)
  const [filterMode, setFilterMode] = useState<"all" | "active" | "paused">("all");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Modal creation state
  const [modalTitle, setModalTitle] = useState("");
  const [modalPrompt, setModalPrompt] = useState("");
  const [modalIcon, setModalIcon] = useState("⏱️");
  const [modalFrequency, setModalFrequency] = useState<TaskFrequency>("daily");
  const [modalTime, setModalTime] = useState("9:00 AM");
  const [modalDay, setModalDay] = useState("Monday");
  const [modalDayOfMonth, setModalDayOfMonth] = useState(1);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  const [isRepeatDropdownOpen, setIsRepeatDropdownOpen] = useState(false);
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  // Advanced settings state
  const [notificationsMode, setNotificationsMode] = useState<
    "Important updates" | "Failed runs only"
  >("Important updates");
  const [isNotificationsDropdownOpen, setIsNotificationsDropdownOpen] = useState(false);
  const [startInNewChat, setStartInNewChat] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-6-astra");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [selectedEffort, setSelectedEffort] = useState<"Low" | "Medium" | "High">("Medium");
  const [isEffortDropdownOpen, setIsEffortDropdownOpen] = useState(false);
  const [modalApiKey, setModalApiKey] = useState("");
  const [isSavingTask, setIsSavingTask] = useState(false);

  const repeatDropdownRef = useRef<HTMLDivElement>(null);
  const dayDropdownRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const effortDropdownRef = useRef<HTMLDivElement>(null);
  const modalInputRef = useRef<HTMLTextAreaElement>(null);
  const selectedTimeItemRef = useRef<HTMLButtonElement>(null);
  const timeListRef = useRef<HTMLDivElement>(null);

  // Timezone label
  const timezoneLabel = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  // Keyboard navigation: Escape key closes modal or window
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (taskPendingDelete) {
          setTaskPendingDelete(null);
        } else if (isCreateModalOpen) {
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
  }, [isOpen, onClose, isCreateModalOpen, executingTask, taskPendingDelete]);

  // Focus search input
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

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
      if (dayDropdownRef.current && !dayDropdownRef.current.contains(target)) {
        setIsDayDropdownOpen(false);
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
      isDayDropdownOpen ||
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
    isDayDropdownOpen,
    isTimeDropdownOpen,
    isNotificationsDropdownOpen,
    isModelDropdownOpen,
    isEffortDropdownOpen,
  ]);

  // Live timer for execution modal
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isExecuting) {
      setExecutionTimerSeconds(0);
      interval = setInterval(() => {
        setExecutionTimerSeconds((sec) => sec + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isExecuting]);

  // Load tasks on open
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setIsLoadingTasks(true);
    void listScheduledTasks()
      .then((loaded) => {
        if (!active) return;
        setTasks(loaded);
        if (loaded.length > 0 && !selectedTaskId) {
          setSelectedTaskId(loaded[0].id);
        }
      })
      .catch((error: unknown) => {
        if (active)
          showToast(error instanceof Error ? error.message : "Could not load scheduled tasks.");
      })
      .finally(() => {
        if (active) setIsLoadingTasks(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, showToast]);

  // Fetch run history whenever selected task changes
  const fetchTaskRuns = useCallback(async (taskId: string) => {
    setIsLoadingRuns(true);
    try {
      const runs = await listScheduledTaskRuns(taskId);
      setRunsForSelectedTask(runs);
    } catch {
      setRunsForSelectedTask([]);
    } finally {
      setIsLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTaskId) {
      void fetchTaskRuns(selectedTaskId);
    } else {
      setRunsForSelectedTask([]);
    }
  }, [selectedTaskId, fetchTaskRuns]);

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

  // Selected task reference
  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  // Copy helper
  const handleCopyText = useCallback((text: string, id: string, type: "prompt" | "output") => {
    void navigator.clipboard.writeText(text);
    if (type === "prompt") {
      setCopiedPromptId(id);
      setTimeout(() => setCopiedPromptId(null), 2000);
    } else {
      setCopiedRunOutputId(id);
      setTimeout(() => setCopiedRunOutputId(null), 2000);
    }
  }, []);

  // Open modal pre-filled from template
  const handleOpenFromTemplate = (tmpl: TaskTemplate) => {
    setEditingTaskId(null);
    setModalTitle(tmpl.title);
    setModalPrompt(tmpl.description);
    setModalIcon(tmpl.icon);
    setModalFrequency(tmpl.suggestedFrequency);
    setModalTime(tmpl.suggestedTime || "9:00 AM");
    setModalDay(tmpl.suggestedDay || "Monday");
    setNotificationsMode("Important updates");
    setStartInNewChat(false);
    setSelectedModel("gpt-6-astra");
    setSelectedEffort("Medium");
    setModalApiKey("");
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
    setEditingTaskId(null);
    setModalTitle("");
    setModalPrompt("");
    setModalIcon("⏱️");
    setModalFrequency("daily");
    setModalTime("9:00 AM");
    setModalDay("Monday");
    setNotificationsMode("Important updates");
    setStartInNewChat(false);
    setSelectedModel("gpt-6-astra");
    setSelectedEffort("Medium");
    setModalApiKey("");
    setIsAdvancedOpen(true);
    setIsRepeatDropdownOpen(false);
    setIsTimeDropdownOpen(false);
    setIsNotificationsDropdownOpen(false);
    setIsModelDropdownOpen(false);
    setIsEffortDropdownOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleEditTask = (task: ScheduledTask) => {
    setEditingTaskId(task.id);
    setModalTitle(task.title);
    setModalPrompt(task.prompt);
    setModalIcon(task.icon);
    setModalFrequency(task.frequency);
    setModalTime(task.time);
    setModalDay(task.dayOfWeek || "Monday");
    setModalDayOfMonth(task.dayOfMonth ?? new Date(task.createdAt).getDate());
    setNotificationsMode(task.notifications || "Important updates");
    setStartInNewChat(Boolean(task.startInNewChat));
    setSelectedModel(task.model || "gpt-6-astra");
    setSelectedEffort(task.effort || "Medium");
    setModalApiKey(task.apiKey || "");
    setIsAdvancedOpen(true);
    setIsCreateModalOpen(true);
  };

  // Persist schedule
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const promptText = modalPrompt.trim();
    if (!promptText) return;

    const derivedTitle =
      modalTitle.trim() || (promptText.length > 32 ? promptText.slice(0, 32) + "..." : promptText);

    const existingTask = tasks.find((task) => task.id === editingTaskId);
    const provider = getModelMeta(selectedModel).provider;
    const { apiKey } = getKeyForModel(selectedModel);
    const resolvedKey = modalApiKey.trim() || apiKey;

    if (!hasKey(provider) && !resolvedKey) {
      showToast(`Connect your ${PROVIDER_CATALOG[provider].name} key or provide one below.`);
      return;
    }

    const draft: ScheduledTask = {
      id: existingTask?.id || "pending",
      title: derivedTitle,
      prompt: promptText,
      icon: modalIcon || "⏱️",
      frequency: modalFrequency,
      time: modalTime,
      dayOfWeek: modalFrequency === "weekly" ? modalDay : undefined,
      ...(modalFrequency === "monthly"
        ? { dayOfMonth: existingTask?.dayOfMonth ?? modalDayOfMonth }
        : {}),
      timezone: timezoneLabel,
      isActive: existingTask?.isActive ?? true,
      createdAt: existingTask?.createdAt ?? Date.now(),
      notifications: notificationsMode,
      startInNewChat,
      model: selectedModel,
      effort: selectedEffort,
      ...(resolvedKey ? { apiKey: resolvedKey } : {}),
    };

    setIsSavingTask(true);
    try {
      const saved = existingTask
        ? await updateScheduledTask(existingTask.id, draft)
        : await createScheduledTask(taskInput(draft));
      setTasks((prev) =>
        existingTask ? prev.map((task) => (task.id === saved.id ? saved : task)) : [saved, ...prev]
      );
      setSelectedTaskId(saved.id);
      setIsCreateModalOpen(false);
      showToast(existingTask ? "Task updated" : `Task "${saved.title}" scheduled`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save this task.");
    } finally {
      setIsSavingTask(false);
    }
  };

  // Toggle active / paused
  const handleToggleTaskActive = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    try {
      const updated = await updateScheduledTask(id, { ...task, isActive: !task.isActive });
      setTasks((prev) => prev.map((item) => (item.id === id ? updated : item)));
      showToast(updated.isActive ? `"${task.title}" resumed` : `"${task.title}" paused`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not update this task.");
    }
  };

  // Delete task confirmation
  const confirmDeleteTask = async () => {
    if (!taskPendingDelete) return;
    const targetId = taskPendingDelete.id;
    setIsDeleting(true);
    try {
      await deleteScheduledTask(targetId);
      setTasks((prev) => prev.filter((task) => task.id !== targetId));
      if (selectedTaskId === targetId) {
        const remaining = tasks.filter((t) => t.id !== targetId);
        setSelectedTaskId(remaining.length > 0 ? remaining[0].id : null);
      }
      setTaskPendingDelete(null);
      showToast("Task removed from schedule");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not remove this task.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Trigger manual run
  const handleRunTask = async (task: ScheduledTask, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExecutingTask(task);
    setIsExecuting(true);
    setExecutionOutput("");
    setExecutionRunRecord(null);

    try {
      const { apiKey } = getKeyForModel(task.model || "gpt-6-astra");
      const effectiveKey = task.apiKey || apiKey;
      const run = await runScheduledTask(task.id, effectiveKey);
      setIsExecuting(false);
      setExecutionRunRecord(run);
      setExecutionOutput(scheduledRunMessage(run));
      const updatedTasks = await listScheduledTasks();
      setTasks(updatedTasks);
      setSelectedTaskId(task.id);
      void fetchTaskRuns(task.id);
    } catch (error) {
      setIsExecuting(false);
      const errMsg = error instanceof Error ? error.message : "Scheduled task execution failed.";
      setExecutionOutput(errMsg);
    }
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

      {/* LEFT SIDEBAR: "Scheduled" with ample width (w-72 lg:w-80) to prevent any text clipping */}
      <aside
        aria-label="Scheduled tasks sidebar"
        className="w-72 lg:w-80 shrink-0 border-r border-[#EAEAE8] bg-[#F6F6F4] flex flex-col h-full select-none"
      >
        {/* Header row: "Scheduled" title + Count + Search icon */}
        <div className="h-13 px-4 flex items-center justify-between border-b border-[#EAEAE8]/70 shrink-0">
          <div className="flex items-center gap-2.5">
            {openedFromChat && (
              <button
                type="button"
                onClick={onClose}
                title="Back to chat"
                aria-label="Back to chat"
                className="w-7 h-7 -ml-1 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <ArrowLeft size={15} strokeWidth={2} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-[14.5px] font-semibold text-slate-900 tracking-tight">
                Scheduled Tasks
              </h1>
              {tasks.length > 0 && (
                <span className="text-[11px] font-medium bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded-full">
                  {tasks.length}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                if (isSearchOpen) setSearchQuery("");
              }}
              title="Search scheduled tasks"
              aria-label="Search scheduled tasks"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isSearchOpen || searchQuery
                  ? "bg-slate-200 text-slate-900"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              }`}
            >
              <Search size={14} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Expandable search bar */}
        {isSearchOpen && (
          <div className="px-3.5 pt-2.5 pb-1.5 border-b border-[#EAEAE8]/60 animate-in fade-in duration-150">
            <div className="relative flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full h-8 pl-8 pr-7 bg-white border border-[#EAEAE8] rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
              />
              <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action button: + New task */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          <button
            type="button"
            onClick={handleOpenNewTask}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Plus size={14} strokeWidth={2.2} className="text-white shrink-0" />
            <span>Create New Task</span>
          </button>
        </div>

        {/* Upcoming Section Header with Filter Icon */}
        <div className="px-4 pt-3.5 pb-1.5 flex items-center justify-between shrink-0 relative">
          <span className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">
            Tasks ({filteredTasks.length})
          </span>

          <div className="relative" ref={filterMenuRef}>
            <button
              type="button"
              onClick={() => setIsFilterMenuOpen((v) => !v)}
              title="Filter tasks"
              aria-label="Filter tasks"
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                filterMode !== "all"
                  ? "text-blue-600 bg-blue-50 font-semibold"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <SlidersHorizontal size={12} strokeWidth={1.8} />
            </button>

            {/* Filter Menu Popover */}
            {isFilterMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-30 text-xs">
                {(["all", "active", "paused"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setFilterMode(mode);
                      setIsFilterMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left rounded-lg flex items-center justify-between capitalize transition-colors ${
                      filterMode === mode
                        ? "bg-slate-100 font-semibold text-slate-900"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{mode}</span>
                    {filterMode === mode && <Check size={12} className="text-slate-900" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1.5 cool-scrollbar space-y-1.5">
          {isLoadingTasks ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading scheduled tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-200/50 flex items-center justify-center mx-auto mb-2 text-slate-400">
                <Clock size={18} />
              </div>
              <p className="text-xs font-medium text-slate-600">
                {searchQuery ? "No matching tasks found" : "No scheduled tasks yet"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {searchQuery
                  ? "Try a different search term."
                  : "Click above to create your first task."}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isSelected = selectedTaskId === task.id;
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`group relative rounded-xl border p-2.5 transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-white border-slate-300 shadow-xs ring-1 ring-slate-900/5"
                      : "bg-white/60 border-slate-200/70 hover:bg-white hover:border-slate-300/80"
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedTaskId(task.id);
                    }
                  }}
                  aria-label={`View scheduled task ${task.title}`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Icon container */}
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[18px] border border-slate-200/60 mt-0.5">
                      {task.icon}
                    </span>

                    {/* Task Info with generous space */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="block truncate text-[13px] font-semibold text-slate-900 leading-snug">
                          {task.title}
                        </span>
                        {/* Status dot */}
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            task.isActive
                              ? "bg-emerald-500 shadow-2xs shadow-emerald-500/50"
                              : "bg-slate-300"
                          }`}
                          title={task.isActive ? "Active" : "Paused"}
                        />
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="capitalize">{task.frequency}</span>
                        <span>•</span>
                        <span className="truncate">{task.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action bar underneath */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400">
                    <span className="text-[10.5px] text-slate-400 truncate max-w-[130px]">
                      {task.isActive
                        ? task.nextRun
                          ? `Next: ${task.nextRun}`
                          : "Scheduled"
                        : "Paused"}
                    </span>

                    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleRunTask(task, e)}
                        title="Run now"
                        aria-label={`Run ${task.title} now`}
                        className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Play size={11} className="fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleToggleTaskActive(task.id, e)}
                        title={task.isActive ? "Pause task" : "Resume task"}
                        aria-label={task.isActive ? `Pause ${task.title}` : `Resume ${task.title}`}
                        className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        {task.isActive ? <Pause size={11} /> : <Play size={11} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditTask(task)}
                        title="Edit task"
                        aria-label={`Edit ${task.title}`}
                        className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskPendingDelete(task)}
                        title="Delete task"
                        aria-label={`Delete ${task.title}`}
                        className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer info / Back button */}
        <div className="p-3 border-t border-[#EAEAE8]/70 shrink-0 bg-[#F6F6F4] flex flex-col gap-2">
          {selectedTaskId && (
            <button
              type="button"
              onClick={() => setSelectedTaskId(null)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-medium text-slate-700 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
            >
              <Clock size={12} strokeWidth={2} />
              <span>Browse Templates</span>
            </button>
          )}

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

      {/* RIGHT MAIN CANVAS */}
      <main
        aria-label="Schedule main canvas"
        className="flex-1 min-w-0 h-full flex flex-col bg-[#F9F9F7] relative overflow-y-auto cool-scrollbar"
      >
        {/* Top-right close button */}
        <div className="w-full h-13 px-6 flex items-center justify-between border-b border-[#EAEAE8]/60 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {selectedTask ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(null)}
                  className="hover:text-slate-900 font-medium transition-colors"
                >
                  Templates
                </button>
                <span>/</span>
                <span className="text-slate-900 font-semibold truncate max-w-[240px]">
                  {selectedTask.title}
                </span>
              </>
            ) : (
              <span className="text-slate-800 font-medium">Task Template Catalog</span>
            )}
          </div>

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

        {/* Dynamic Canvas View: Selected Task Dashboard OR Template Catalog */}
        {selectedTask ? (
          /* ========================================================
             TASK DETAIL DASHBOARD
             ======================================================== */
          <div className="w-full max-w-4xl px-6 sm:px-10 py-8 mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Header with Title and Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
              <div className="flex items-start gap-4">
                <span className="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-3xl shrink-0">
                  {selectedTask.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {selectedTask.title}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium border ${
                        selectedTask.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedTask.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`}
                      />
                      {selectedTask.isActive ? "Active" : "Paused"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>
                      Created{" "}
                      {new Date(selectedTask.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span>•</span>
                    <span>Timezone: {selectedTask.timezone}</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRunTask(selectedTask)}
                  disabled={isExecuting && executingTask?.id === selectedTask.id}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isExecuting && executingTask?.id === selectedTask.id ? (
                    <RotateCw size={13} className="animate-spin" />
                  ) : (
                    <Play size={13} className="fill-current" />
                  )}
                  <span>Run Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleTaskActive(selectedTask.id)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  {selectedTask.isActive ? (
                    <>
                      <Pause size={13} />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} />
                      <span>Resume</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleEditTask(selectedTask)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Pencil size={13} />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTaskPendingDelete(selectedTask)}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 transition-colors cursor-pointer shadow-2xs"
                  title="Delete task"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Schedule Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Schedule
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Calendar size={14} />
                  </div>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900 capitalize">
                    {selectedTask.frequency}
                  </div>
                  <div className="text-[11.5px] text-slate-500 mt-0.5 truncate">
                    {selectedTask.time} ({selectedTask.dayOfWeek || "Daily"})
                  </div>
                </div>
              </div>

              {/* Model Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Model
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Bot size={14} />
                  </div>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900 truncate">
                    {scheduledModelName(selectedTask.model || "gpt-6-astra")}
                  </div>
                  <div className="text-[11.5px] text-slate-500 mt-0.5">
                    Effort: {selectedTask.effort || "Medium"}
                  </div>
                </div>
              </div>

              {/* Delivery Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Delivery
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MessageSquarePlus size={14} />
                  </div>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900 truncate">
                    {selectedTask.startInNewChat ? "New Chat" : "Thread"}
                  </div>
                  <div className="text-[11.5px] text-slate-500 mt-0.5 truncate">
                    {selectedTask.notifications || "All updates"}
                  </div>
                </div>
              </div>

              {/* Executions Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Activity
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Activity size={14} />
                  </div>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900">
                    {runsForSelectedTask.length} execution
                    {runsForSelectedTask.length === 1 ? "" : "s"}
                  </div>
                  <div className="text-[11.5px] text-slate-500 mt-0.5 truncate">
                    {selectedTask.lastRun ? `Last: ${selectedTask.lastRun}` : "Not run yet"}
                  </div>
                </div>
              </div>
            </div>

            {/* Prompt & Instructions Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-slate-400" />
                  <h3 className="text-[13.5px] font-semibold text-slate-900 tracking-tight">
                    Prompt & Instructions
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(selectedTask.prompt, selectedTask.id, "prompt")}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedPromptId === selectedTask.id ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 text-[13px] text-slate-800 font-sans whitespace-pre-wrap leading-relaxed select-text">
                {selectedTask.prompt}
              </div>
            </div>

            {/* Execution History Timeline */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History size={15} className="text-slate-400" />
                  <h3 className="text-[13.5px] font-semibold text-slate-900 tracking-tight">
                    Execution History
                  </h3>
                  <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {runsForSelectedTask.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fetchTaskRuns(selectedTask.id)}
                    disabled={isLoadingRuns}
                    title="Refresh history"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <RotateCw size={13} className={isLoadingRuns ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {isLoadingRuns ? (
                <div className="py-10 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RotateCw size={16} className="animate-spin text-slate-500" />
                  <span>Loading history...</span>
                </div>
              ) : runsForSelectedTask.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <History size={18} />
                  </div>
                  <p className="text-xs font-medium text-slate-700">No executions recorded yet</p>
                  <p className="text-[11.5px] text-slate-400 max-w-xs">
                    Run this task manually with &quot;Run Now&quot; or wait for its scheduled
                    trigger.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRunTask(selectedTask)}
                    className="mt-2 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Run Task Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {runsForSelectedTask.map((run) => {
                    const isSuccess = run.status === "succeeded";
                    const isFailed = run.status === "failed";
                    const isRunning = run.status === "running" || run.status === "queued";
                    const durationSec =
                      run.startedAt && run.finishedAt
                        ? ((run.finishedAt - run.startedAt) / 1000).toFixed(1)
                        : null;

                    return (
                      <div
                        key={run.id}
                        className="rounded-xl border border-slate-200/70 bg-[#FAFAFA] p-4 transition-all"
                      >
                        {/* Run header */}
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                isSuccess
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                  : isFailed
                                    ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                                    : "bg-amber-50 text-amber-700 border border-amber-200/80"
                              }`}
                            >
                              {isSuccess && <CheckCircle2 size={12} />}
                              {isFailed && <AlertCircle size={12} />}
                              {isRunning && <RotateCw size={12} className="animate-spin" />}
                              <span className="capitalize">{run.status}</span>
                            </span>

                            <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md capitalize">
                              {run.trigger} trigger
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            {durationSec && <span>Duration: {durationSec}s</span>}
                            <span>•</span>
                            <span>
                              {new Date(run.createdAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Run Output */}
                        {run.output && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-200/60">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                                Model Response
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(run.output!, run.id, "output")}
                                  className="px-2 py-1 rounded text-[11px] text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedRunOutputId === run.id ? (
                                    <>
                                      <Check size={11} className="text-emerald-600" />
                                      <span className="text-emerald-600">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={11} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 max-h-80 overflow-y-auto cool-scrollbar select-text leading-relaxed">
                              <AssistantResponse content={run.output} isStreaming={false} />
                            </div>
                          </div>
                        )}

                        {run.error && (
                          <div className="mt-2.5 p-3 bg-rose-50/70 border border-rose-200/70 rounded-xl text-xs text-rose-800 font-mono">
                            {run.error}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================
             TEMPLATE CATALOG / CREATE HERO
             ======================================================== */
          <div className="w-full max-w-[780px] px-6 mx-auto my-auto flex flex-col items-center py-10 animate-in fade-in duration-200">
            {/* 3D Glossy Clock Icon */}
            <div className="mb-3">
              <ClockIcon size={56} />
            </div>

            {/* Heading */}
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight text-center">
              Automate with Scheduled Tasks
            </h2>

            {/* Subtitle */}
            <p className="text-[13.5px] text-slate-500 text-center mt-1.5 mb-8 max-w-md leading-relaxed">
              Set up automated background schedules to research, monitor, summarize, and draft on
              your time.
            </p>

            {/* 6 High-Craft Cards in 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {DEFAULT_TASK_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleOpenFromTemplate(tmpl)}
                  className="group relative rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md p-4.5 flex items-start gap-3.5 text-left transition-all duration-200 cursor-pointer active:scale-[0.99]"
                >
                  {/* Icon */}
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-slate-200/70 text-2xl group-hover:scale-105 transition-all">
                    {tmpl.icon}
                  </span>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-[14px] font-semibold text-slate-900 tracking-tight group-hover:text-slate-950">
                        {tmpl.title}
                      </h3>
                      <span className="text-[10.5px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
                        {tmpl.suggestedFrequency}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-slate-500 leading-snug mt-1 line-clamp-2">
                      {tmpl.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={handleOpenNewTask}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Plus size={14} strokeWidth={2.2} />
                <span>Create Custom Task from Scratch</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          TASK CREATE / EDIT MODAL
          ======================================================== */}
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
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-zinc-200/80 w-full max-w-[580px] max-h-[90vh] overflow-y-auto cool-scrollbar p-6 sm:p-7 animate-in zoom-in-95 duration-150 relative text-left flex flex-col">
            {/* Header: Title + Close Icon */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{modalIcon}</span>
                <h3 className="text-[18px] sm:text-[19px] font-semibold text-zinc-900 tracking-tight">
                  {editingTaskId ? "Edit scheduled task" : "Schedule a task"}
                </h3>
              </div>
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
              {/* Optional Title and Icon selection */}
              <div className="mb-3.5">
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Task Title & Icon (Optional)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xl shrink-0">
                    {modalIcon}
                  </div>
                  <input
                    type="text"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    placeholder="e.g. Daily Market Briefing"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>
                {/* Quick icon options */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 cool-scrollbar">
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setModalIcon(icon)}
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                        modalIcon === icon
                          ? "bg-zinc-900 text-white shadow-xs scale-105"
                          : "bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions Textarea Box */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Instructions & Prompt <span className="text-rose-500">*</span>
                </label>
                <div className="w-full rounded-xl border border-zinc-200/90 bg-white p-3.5 focus-within:border-zinc-400 transition-all shadow-2xs">
                  <textarea
                    ref={modalInputRef}
                    rows={4}
                    value={modalPrompt}
                    onChange={(e) => setModalPrompt(e.target.value)}
                    placeholder="Describe what you want the AI to do on this schedule..."
                    className="w-full h-24 text-[13.5px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed bg-transparent"
                  />
                </div>
              </div>

              {/* Repeat & Time Container */}
              <div className="mt-1 rounded-xl border border-zinc-200/90 bg-white overflow-visible divide-y divide-zinc-100 shadow-2xs">
                {/* Row 1: Repeat */}
                <div className="relative px-4 py-3 flex items-center justify-between">
                  <span className="text-[13.5px] font-normal text-zinc-800">Repeat</span>

                  <div className="relative" ref={repeatDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRepeatDropdownOpen((v) => !v);
                        setIsTimeDropdownOpen(false);
                      }}
                      className="text-[13.5px] text-zinc-700 hover:text-zinc-950 flex items-center gap-1.5 transition-colors cursor-pointer select-none px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50/50"
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
                                if (opt.value === "monthly") {
                                  const timezone = timezoneLabel;
                                  const day = new Intl.DateTimeFormat("en-US", {
                                    timeZone: timezone,
                                    day: "numeric",
                                  }).format(Date.now());
                                  setModalDayOfMonth(Number(day));
                                }
                                setIsRepeatDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left flex items-center justify-between rounded-lg transition-colors cursor-pointer text-[13px] ${
                                isSelected
                                  ? "bg-zinc-100 font-medium text-zinc-950"
                                  : "text-zinc-800 hover:bg-zinc-50"
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

                {/* Optional Weekly Day Selector */}
                {modalFrequency === "weekly" && (
                  <div className="relative z-20 px-4 py-2.5 bg-zinc-50/60 flex items-center justify-between border-t border-zinc-100">
                    <span className="text-[13px] text-zinc-600">On day</span>
                    <div className="relative" ref={dayDropdownRef}>
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={isDayDropdownOpen}
                        onClick={() => {
                          setIsDayDropdownOpen((open) => !open);
                          setIsRepeatDropdownOpen(false);
                          setIsTimeDropdownOpen(false);
                        }}
                        className={`flex min-w-36 items-center justify-between gap-3 rounded-lg border bg-white px-3 py-1.5 text-[13px] shadow-2xs transition-colors ${
                          isDayDropdownOpen
                            ? "border-zinc-400 text-zinc-950"
                            : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        <span>Every {modalDay}</span>
                        <ChevronDown
                          size={14}
                          className={`shrink-0 text-zinc-400 transition-transform ${
                            isDayDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isDayDropdownOpen && (
                        <div
                          role="listbox"
                          aria-label="Repeat day"
                          className="absolute right-0 top-full z-50 mt-1.5 max-h-60 w-48 overflow-y-auto rounded-xl border border-zinc-200/90 bg-white p-1.5 text-[13px] shadow-xl cool-scrollbar animate-in fade-in zoom-in-95 duration-100 origin-top-right"
                        >
                          {DAYS_OF_WEEK.map((day) => {
                            const isSelected = modalDay === day;
                            return (
                              <button
                                key={day}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setModalDay(day);
                                  setIsDayDropdownOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                                  isSelected
                                    ? "bg-zinc-100 font-medium text-zinc-950"
                                    : "text-zinc-700 hover:bg-zinc-50"
                                }`}
                              >
                                <span>Every {day}</span>
                                {isSelected && <Check size={15} className="shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Optional Monthly Day Selector */}
                {modalFrequency === "monthly" && (
                  <div className="relative z-20 px-4 py-2.5 bg-zinc-50/60 flex items-center justify-between border-t border-zinc-100">
                    <span className="text-[13px] text-zinc-600">On day of month</span>
                    <select
                      value={modalDayOfMonth}
                      onChange={(e) => setModalDayOfMonth(Number(e.target.value))}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[13px] text-zinc-800 shadow-2xs focus:outline-none focus:border-zinc-400 cursor-pointer"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => (
                        <option key={dayNum} value={dayNum}>
                          Day {dayNum}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Row 2: Time */}
                <div className="relative px-4 py-3 flex items-center justify-between">
                  <span className="text-[13.5px] font-normal text-zinc-800">Time</span>

                  <div className="relative" ref={timeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTimeDropdownOpen((v) => !v);
                        setIsRepeatDropdownOpen(false);
                      }}
                      className="text-[13.5px] transition-colors cursor-pointer select-none rounded-lg flex items-center gap-1.5 px-2.5 py-1 border border-zinc-200 bg-zinc-50/50 text-zinc-800"
                    >
                      <span>
                        {modalTime} ({timezoneLabel})
                      </span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${
                          isTimeDropdownOpen ? "rotate-180 text-zinc-600" : "text-zinc-400"
                        }`}
                      />
                    </button>

                    {/* Time Dropdown Menu */}
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
                                  : "text-zinc-800 hover:bg-zinc-50"
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
              <div className="mt-3.5 mb-2 px-0.5">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer select-none"
                >
                  <span>Advanced Settings (Model & Execution)</span>
                  {isAdvancedOpen ? (
                    <ChevronUp size={14} className="text-zinc-500" />
                  ) : (
                    <ChevronDown size={14} className="text-zinc-500" />
                  )}
                </button>
              </div>

              {/* Advanced Items Stack */}
              {isAdvancedOpen && (
                <div className="flex flex-col gap-2.5 mb-1 animate-in fade-in duration-150">
                  {/* Model */}
                  <div className="relative w-full rounded-xl border border-zinc-200/90 bg-white px-4 py-2.5 flex items-center justify-between shadow-2xs">
                    <span className="text-[13px] font-normal text-zinc-800">AI Model</span>

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
                        className="text-[13px] text-zinc-800 rounded-lg flex items-center gap-1.5 px-2.5 py-1 border border-zinc-200 bg-zinc-50/50"
                      >
                        <span>{scheduledModelName(selectedModel)}</span>
                        <ChevronDown
                          size={13}
                          className={`transition-transform duration-200 ${
                            isModelDropdownOpen ? "rotate-180 text-zinc-600" : "text-zinc-400"
                          }`}
                        />
                      </button>

                      {/* Model Popover Menu */}
                      {isModelDropdownOpen && (
                        <div className="absolute right-0 bottom-full mb-2 w-64 max-h-72 overflow-y-auto bg-white rounded-xl shadow-xl border border-zinc-200/90 p-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 origin-bottom-right cool-scrollbar">
                          <div className="px-3 pt-1 pb-1.5 text-[11.5px] font-medium text-zinc-400 select-none">
                            Available Chat Models
                          </div>
                          {SCHEDULED_MODEL_IDS.map((modelId) => {
                            const isSelected = selectedModel === modelId;
                            return (
                              <button
                                key={modelId}
                                type="button"
                                onClick={() => {
                                  setIsModelDropdownOpen(false);
                                  setSelectedModel(modelId);
                                }}
                                className={`w-full px-3 py-2 text-left flex items-center justify-between rounded-lg transition-colors cursor-pointer text-[13px] ${
                                  isSelected
                                    ? "bg-zinc-100 font-medium text-zinc-950"
                                    : "text-zinc-800 hover:bg-zinc-50"
                                }`}
                              >
                                <span>{scheduledModelName(modelId)}</span>
                                {isSelected && (
                                  <Check
                                    size={14}
                                    strokeWidth={2}
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

                  {/* Reasoning Effort */}
                  <div className="relative w-full rounded-xl border border-zinc-200/90 bg-white px-4 py-2.5 flex items-center justify-between shadow-2xs">
                    <span className="text-[13px] font-normal text-zinc-800">Reasoning Effort</span>

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
                        className="text-[13px] text-zinc-800 rounded-lg flex items-center gap-1.5 px-2.5 py-1 border border-zinc-200 bg-zinc-50/50"
                      >
                        <span>{selectedEffort}</span>
                        <ChevronDown
                          size={13}
                          className={`transition-transform duration-200 ${
                            isEffortDropdownOpen ? "rotate-180 text-zinc-600" : "text-zinc-400"
                          }`}
                        />
                      </button>

                      {isEffortDropdownOpen && (
                        <div className="absolute right-0 bottom-full mb-2 w-44 bg-white rounded-xl shadow-xl border border-zinc-200/90 p-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 origin-bottom-right">
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
                                    ? "bg-zinc-100 font-medium text-zinc-950"
                                    : "text-zinc-800 hover:bg-zinc-50"
                                }`}
                              >
                                <span>{eff}</span>
                                {isSelected && (
                                  <Check size={14} className="text-zinc-800 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Start in new chat toggle */}
                  <div className="w-full rounded-xl border border-zinc-200/90 bg-white px-4 py-2.5 flex items-center justify-between shadow-2xs">
                    <span className="text-[13px] font-normal text-zinc-800">
                      Start each run in new chat
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={startInNewChat}
                      onClick={() => setStartInNewChat((v) => !v)}
                      className={`w-[40px] h-[24px] rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        startInNewChat ? "bg-slate-900" : "bg-zinc-200"
                      }`}
                    >
                      <div
                        className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform absolute top-[3px] ${
                          startInNewChat ? "translate-x-[19px]" : "translate-x-[3px]"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Optional API Key Override */}
                  <div className="w-full rounded-xl border border-zinc-200/90 bg-white p-3 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12.5px] font-medium text-zinc-700 flex items-center gap-1.5">
                        <KeyRound size={13} className="text-zinc-400" />
                        <span>Custom API Key Override (Optional)</span>
                      </span>
                      <button
                        type="button"
                        onClick={onNavigateToProviders}
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <span>Manage Keys</span>
                        <ExternalLink size={10} />
                      </button>
                    </div>
                    <input
                      type="password"
                      value={modalApiKey}
                      onChange={(e) => setModalApiKey(e.target.value)}
                      placeholder="Leave blank to use default workspace key"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
                    />
                  </div>
                </div>
              )}

              {/* Bottom Footer Row: Cancel + Create pills on right */}
              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-[13px] font-medium text-zinc-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!modalPrompt.trim() || isSavingTask}
                  className={`px-5 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                    modalPrompt.trim() && !isSavingTask
                      ? "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-95 shadow-xs"
                      : "bg-slate-300 text-white cursor-not-allowed"
                  }`}
                >
                  {isSavingTask ? "Saving…" : editingTaskId ? "Save changes" : "Schedule Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          EXECUTION MODAL / RESULT PREVIEW (High-Craft 10/10)
          ======================================================== */}
      {executingTask && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isExecuting) {
              setExecutingTask(null);
            }
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-white border border-slate-200/70 shadow-2xs flex items-center justify-center text-xl shrink-0">
                  {executingTask.icon}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {executingTask.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                    <span>{scheduledModelName(executingTask.model || "gpt-6-astra")}</span>
                    <span>•</span>
                    <span>{executingTask.frequency}</span>
                  </div>
                </div>
              </div>

              {!isExecuting && (
                <button
                  type="button"
                  onClick={() => setExecutingTask(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto cool-scrollbar flex flex-col gap-4">
              {isExecuting ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-12 h-12 rounded-full border-3 border-slate-200 border-t-slate-900 animate-spin" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Executing Task ({executionTimerSeconds}s)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Running prompt and generating output in background...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Status metadata banner */}
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-slate-800">
                        Execution Completed
                      </span>
                      {executionRunRecord?.finishedAt && executionRunRecord?.startedAt && (
                        <span className="text-[11px] text-slate-500">
                          in{" "}
                          {(
                            (executionRunRecord.finishedAt - executionRunRecord.startedAt) /
                            1000
                          ).toFixed(1)}
                          s
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyText(executionOutput, "executing-task", "output")}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedRunOutputId === "executing-task" ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Output</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Rendered Output with markdown support */}
                  <div className="p-4 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-800 leading-relaxed shadow-2xs select-text">
                    <AssistantResponse content={executionOutput} isStreaming={false} />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!isExecuting && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-400">
                  Result saved in task execution history.
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setExecutingTask(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE CONFIRMATION DIALOG
          ======================================================== */}
      {taskPendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[75] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-sm p-6 text-left flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Delete Scheduled Task?</h4>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove &quot;{taskPendingDelete.title}&quot; from your
              schedule? All future scheduled executions will be cancelled.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTaskPendingDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTask}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
