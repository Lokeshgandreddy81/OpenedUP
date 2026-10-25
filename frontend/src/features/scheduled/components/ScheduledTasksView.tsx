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
  ChevronRight,
  Check,
  Pencil,
  Copy,
  RotateCw,
  Calendar,
  Clock,
  MessageSquarePlus,
  Activity,
  History,
  AlertCircle,
  KeyRound,
  MoreHorizontal,
} from "lucide-react";
import {
  getModelMeta,
  PROVIDER_CATALOG,
  type ScheduledTaskRunRecord,
} from "@charan-interiors/contracts";
import {
  useProviderKeys,
  getKeyForModel,
  getProviderChatRequestConfig,
} from "../../customize/publicApi";
import { CreatorLogo } from "../../benchmarks/publicApi";
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
  resolveModelCreator,
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
  isEmbedded?: boolean;
}

const REPEAT_OPTIONS: { label: string; value: TaskFrequency }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekdays", value: "weekdays" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
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

function getFriendlyTimezone(tz: string): string {
  if (!tz) return "";
  if (tz.includes("Calcutta") || tz.includes("Kolkata")) return "India Time";
  if (tz.includes("New_York")) return "Eastern Time";
  if (tz.includes("Chicago")) return "Central Time";
  if (tz.includes("Denver")) return "Mountain Time";
  if (tz.includes("Los_Angeles")) return "Pacific Time";
  if (tz.includes("London")) return "UK Time";
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "longGeneric",
    });
    const part = formatter.formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value;
    if (part && !part.startsWith("GMT") && !part.startsWith("UTC")) {
      return part.replace("Standard Time", "Time");
    }
  } catch {
    // Fall back to simple city label on formatting errors
  }
  return tz.replace(/_/g, " ").split("/").pop() || tz;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const ScheduledTasksView: React.FC<ScheduledTasksViewProps> = ({
  isOpen,
  onClose,
  onNavigateToChat: _onNavigateToChat,
  onNavigateToProviders,
  openedFromChat = false,
  isEmbedded = false,
}) => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [mobileShowTemplates, setMobileShowTemplates] = useState(false);
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

  // Task actions dropdown menu state
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

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
  const [runOnThisComputer, setRunOnThisComputer] = useState(true);
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

  const friendlyTimezone = useMemo(() => {
    return getFriendlyTimezone(timezoneLabel);
  }, [timezoneLabel]);

  // Keyboard navigation: Escape key closes active menus, dropdowns, modal or window
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (taskPendingDelete) {
          setTaskPendingDelete(null);
        } else if (isFilterMenuOpen) {
          setIsFilterMenuOpen(false);
        } else if (isActionsMenuOpen) {
          setIsActionsMenuOpen(false);
        } else if (
          isRepeatDropdownOpen ||
          isDayDropdownOpen ||
          isTimeDropdownOpen ||
          isNotificationsDropdownOpen ||
          isModelDropdownOpen ||
          isEffortDropdownOpen
        ) {
          setIsRepeatDropdownOpen(false);
          setIsDayDropdownOpen(false);
          setIsTimeDropdownOpen(false);
          setIsNotificationsDropdownOpen(false);
          setIsModelDropdownOpen(false);
          setIsEffortDropdownOpen(false);
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
  }, [
    isOpen,
    onClose,
    isCreateModalOpen,
    executingTask,
    taskPendingDelete,
    isFilterMenuOpen,
    isActionsMenuOpen,
    isRepeatDropdownOpen,
    isDayDropdownOpen,
    isTimeDropdownOpen,
    isNotificationsDropdownOpen,
    isModelDropdownOpen,
    isEffortDropdownOpen,
  ]);

  // Focus search input
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close filter menu and actions menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setIsFilterMenuOpen(false);
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    if (isFilterMenuOpen || isActionsMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isFilterMenuOpen, isActionsMenuOpen]);

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
        if (loaded.length > 0) {
          setSelectedTaskId((current) => {
            if (current) return current;
            return typeof window !== "undefined" && window.innerWidth >= 768 ? loaded[0].id : null;
          });
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
    setMobileShowTemplates(false);
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
    setRunOnThisComputer(true);
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
    setRunOnThisComputer(task.runOnThisComputer ?? true);
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
      showToast(`Connect your ${PROVIDER_CATALOG[provider].name} key in Customize → Providers.`);
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
      runOnThisComputer,
      ...(resolvedKey ? { apiKey: resolvedKey } : {}),
    };

    const providerConfig = getProviderChatRequestConfig(selectedModel);
    setIsSavingTask(true);
    try {
      const saved = existingTask
        ? await updateScheduledTask(existingTask.id, draft, providerConfig.headers)
        : await createScheduledTask(taskInput(draft), providerConfig.headers);
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
      const providerConfig = getProviderChatRequestConfig(task.model || "gpt-6-astra");
      const effectiveKey = task.apiKey || providerConfig.headers["x-provider-key"];
      const effectiveBaseUrl = providerConfig.headers["x-provider-base-url"];
      if (!effectiveKey) {
        const meta = getModelMeta(task.model || "gpt-6-astra");
        const providerName = PROVIDER_CATALOG[meta.provider]?.name || "Provider";
        throw new Error(
          `Connect your ${providerName} key in Customize → Providers to run this task.`
        );
      }
      const run = await runScheduledTask(task.id, effectiveKey, effectiveBaseUrl);
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
      role="region"
      aria-label="Scheduled tasks"
      className={
        isEmbedded
          ? "relative flex-1 w-full h-full min-w-0 min-h-0 flex font-sans select-none overflow-hidden text-slate-900 bg-[#F9F9F7]"
          : "fixed inset-0 z-50 bg-[#F9F9F7] flex font-sans select-none overflow-hidden text-slate-900 animate-in fade-in duration-150"
      }
    >
      {/* Toast notification banner */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[80] bg-slate-900/95 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT SIDEBAR: "Scheduled" - compact 2nd sidebar alongside main navbar */}
      <aside
        aria-label="Scheduled tasks sidebar"
        className={`${selectedTaskId || mobileShowTemplates ? "hidden md:flex" : "flex"} w-full md:w-60 shrink-0 border-r border-[#EAEAE8] bg-[#F6F6F4] flex-col h-full select-none`}
      >
        {/* Header row: "Scheduled Tasks" title + Count + Search icon */}
        <div className="h-13 px-3 flex items-center justify-between border-b-0 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {openedFromChat && !isEmbedded && (
              <button
                type="button"
                onClick={onClose}
                title="Back to chat"
                aria-label="Back to chat"
                className="w-9 h-9 sm:w-7 sm:h-7 -ml-1 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-black/[0.04] transition-colors cursor-pointer shrink-0 min-h-[36px] min-w-[36px]"
              >
                <ArrowLeft size={15} strokeWidth={1.75} />
              </button>
            )}
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-[14px] font-semibold text-slate-900 tracking-tight truncate">
                Scheduled Tasks
              </h1>
              {tasks.length > 0 && (
                <span className="text-[12px] font-normal text-slate-500 shrink-0 tabular-nums font-mono">
                  {tasks.length}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                if (isSearchOpen) setSearchQuery("");
              }}
              title="Search scheduled tasks"
              aria-label="Search scheduled tasks"
              className={`w-9 h-9 sm:w-7 sm:h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer min-h-[36px] min-w-[36px] ${
                isSearchOpen || searchQuery
                  ? "bg-[#ECECF1] text-slate-900"
                  : "text-slate-500 hover:text-slate-900 hover:bg-black/[0.04]"
              }`}
            >
              <Search size={15} strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={handleOpenNewTask}
              title="Create new task"
              aria-label="Create new task"
              className="w-9 h-9 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-black/[0.04] transition-colors cursor-pointer min-h-[36px] min-w-[36px]"
            >
              <Plus size={16} strokeWidth={1.75} />
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

        {/* Upcoming Section Header with Filter Icon */}
        <div className="px-3 pt-2.5 pb-1 flex items-center justify-between shrink-0 relative">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
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
                  ? "text-slate-900 bg-[#ECECF1] font-semibold"
                  : "text-slate-400 hover:text-slate-700 hover:bg-black/[0.04]"
              }`}
            >
              <SlidersHorizontal size={12} strokeWidth={1.75} />
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
        <div className="flex-1 overflow-y-auto px-2 py-1 cool-scrollbar space-y-0.5">
          {/* Mobile shortcut to browse templates */}
          <button
            type="button"
            onClick={() => setMobileShowTemplates(true)}
            className="md:hidden w-full mb-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white rounded-xl border border-[#EAEAE8] flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer min-h-[38px]"
          >
            <Clock size={13} />
            <span>Browse task templates</span>
          </button>

          {isLoadingTasks ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading scheduled tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-6 text-center">
              <div className="flex items-center justify-center mx-auto mb-2 text-slate-950">
                <Clock size={22} strokeWidth={1.75} />
              </div>
              <p className="text-xs font-semibold text-slate-900">
                {searchQuery ? "No matching tasks found" : "No scheduled tasks yet"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {searchQuery
                  ? "Try a different search term."
                  : "Click + above to create your first task."}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isSelected = selectedTaskId === task.id;
              return (
                <div
                  key={task.id}
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setMobileShowTemplates(false);
                  }}
                  className={`group relative rounded-lg px-2.5 py-2 transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-[#ECECF1] text-slate-950 font-normal"
                      : "hover:bg-black/[0.04] text-slate-700"
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedTaskId(task.id);
                      setMobileShowTemplates(false);
                    }
                  }}
                  aria-label={`View scheduled task ${task.title}`}
                >
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Transparent icon */}
                      <span className="text-[14px] shrink-0 select-none">
                        {task.icon}
                      </span>

                      {/* Title & Frequency */}
                      <div className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-[13px] leading-tight ${
                            isSelected ? "font-medium text-slate-950" : "font-normal text-slate-800"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                    </div>

                    {/* Subtle Action Buttons on Hover */}
                    <div
                      className={`hidden md:flex items-center gap-0.5 shrink-0 ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      } transition-opacity`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleRunTask(task, e)}
                        title="Run now"
                        aria-label={`Run ${task.title} now`}
                        className="flex h-5 w-5 items-center justify-center rounded hover:bg-black/[0.08] text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        <Play size={10} className="fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleToggleTaskActive(task.id, e)}
                        title={task.isActive ? "Pause task" : "Resume task"}
                        aria-label={task.isActive ? `Pause ${task.title}` : `Resume ${task.title}`}
                        className="flex h-5 w-5 items-center justify-center rounded hover:bg-black/[0.08] text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        {task.isActive ? <Pause size={10} /> : <Play size={10} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditTask(task)}
                        title="Edit task"
                        aria-label={`Edit ${task.title}`}
                        className="flex h-5 w-5 items-center justify-center rounded hover:bg-black/[0.08] text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        <Pencil size={10} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskPendingDelete(task)}
                        title="Delete task"
                        aria-label={`Delete ${task.title}`}
                        className="flex h-5 w-5 items-center justify-center rounded hover:bg-rose-100/70 text-slate-500 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Subtitle / Next schedule */}
                  <div className="mt-0.5 pl-5.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="capitalize">{task.frequency}</span>
                    <span>·</span>
                    <span className="truncate">{task.time}</span>
                    {!task.isActive && (
                      <>
                        <span>·</span>
                        <span className="text-slate-400">Paused</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT MAIN CANVAS */}
      <main
        aria-label="Schedule main canvas"
        className={`${!selectedTaskId && !mobileShowTemplates ? "hidden md:flex" : "flex"} flex-1 min-w-0 h-full flex-col bg-[#F9F9F7] relative overflow-y-auto cool-scrollbar`}
      >
        {/* Top Header Bar - Unified, professional SaaS/macOS Navbar */}
        <div className="w-full h-13 px-4 sm:px-5 lg:px-8 flex items-center justify-between border-b border-[#EAEAE8]/80 shrink-0 bg-[#F9F9F7]">
          {selectedTask ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                title="Back to task list"
                aria-label="Back to task list"
                className="md:hidden -ml-1 mr-0.5 w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-black/[0.04] transition-colors cursor-pointer shrink-0 min-h-[36px] min-w-[36px]"
              >
                <ArrowLeft size={16} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
              >
                Scheduled Tasks
              </button>
              <ChevronRight size={13} className="text-slate-400 shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm select-none shrink-0">{selectedTask.icon}</span>
                <span className="text-xs font-semibold text-slate-900 truncate max-w-[130px] sm:max-w-[320px]">
                  {selectedTask.title}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setMobileShowTemplates(false)}
                title="Back to task list"
                aria-label="Back to task list"
                className="md:hidden -ml-1 mr-0.5 w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-black/[0.04] transition-colors cursor-pointer shrink-0 min-h-[36px] min-w-[36px]"
              >
                <ArrowLeft size={16} strokeWidth={2} />
              </button>
              <span className="text-xs font-medium text-slate-500">Scheduled Tasks</span>
              <ChevronRight size={13} className="text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-900 truncate">Browse Templates</span>
            </div>
          )}

          {/* Top-Right Action buttons when a task is selected */}
          {selectedTask && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleRunTask(selectedTask)}
                disabled={isExecuting && executingTask?.id === selectedTask.id}
                className="h-9 px-3.5 sm:h-8 sm:px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 min-h-[36px]"
              >
                {isExecuting && executingTask?.id === selectedTask.id ? (
                  <RotateCw size={12} className="animate-spin" />
                ) : (
                  <Play size={11} className="fill-current" />
                )}
                <span>Run Now</span>
              </button>

              {/* More options dropdown: Pause/Resume, Edit, Delete */}
              <div className="relative" ref={actionsMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsActionsMenuOpen((v) => !v)}
                  title="Task options"
                  aria-label="Task options"
                  className={`w-9 h-9 sm:w-8 sm:h-8 min-h-[36px] min-w-[36px] rounded-lg border border-slate-200/70 bg-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs ${
                    isActionsMenuOpen
                      ? "bg-slate-100 text-slate-900 border-slate-300"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <MoreHorizontal size={15} strokeWidth={1.75} />
                </button>

                {isActionsMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-30 text-xs animate-in fade-in duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsMenuOpen(false);
                        void handleToggleTaskActive(selectedTask.id);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      {selectedTask.isActive ? (
                        <>
                          <Pause size={13} className="text-slate-500" />
                          <span>Pause Task</span>
                        </>
                      ) : (
                        <>
                          <Play size={13} className="text-slate-500" />
                          <span>Resume Task</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsMenuOpen(false);
                        handleEditTask(selectedTask);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <Pencil size={13} className="text-slate-500" />
                      <span>Edit Task</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsMenuOpen(false);
                        setTaskPendingDelete(selectedTask);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} className="text-rose-500" />
                      <span>Delete Task</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Canvas View: Selected Task Dashboard OR Template Catalog */}
        {selectedTask ? (
          /* ========================================================
             TASK DETAIL DASHBOARD - FLUID FULL-CANVAS RESPONSIVE
             ======================================================== */
          <div className="w-full px-5 lg:px-8 pb-8 flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Task Hero Header */}
            <div className="group pt-4 pb-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl select-none leading-none shrink-0">
                  {selectedTask.icon}
                </span>

                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <h2 className="font-serif text-xl sm:text-2xl font-normal text-slate-900 tracking-tight leading-tight truncate">
                    {selectedTask.title}
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleEditTask(selectedTask)}
                    title="Edit task"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-black/[0.05] text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <Pencil size={13} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Stat Cards: Clean, flat, seamlessly into the screen */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-1 border-b border-slate-200/50">
              {/* Schedule Card */}
              <div className="rounded-xl border-0 bg-transparent p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Schedule
                  </span>
                  <Calendar size={14} strokeWidth={1.75} className="text-slate-500 shrink-0" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900 capitalize leading-snug">
                    {selectedTask.frequency}
                  </div>
                  <div className="text-[12px] text-slate-500 mt-0.5 truncate">
                    {selectedTask.time} ({selectedTask.dayOfWeek || "Daily"})
                  </div>
                </div>
              </div>

              {/* Model Card */}
              <div className="rounded-xl border-0 bg-transparent p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Model
                  </span>
                  <CreatorLogo creator={resolveModelCreator(selectedTask.model || "gpt-6-astra")} size={15} />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900 truncate leading-snug">
                    {scheduledModelName(selectedTask.model || "gpt-6-astra")}
                  </div>
                  <div className="text-[12px] text-slate-500 mt-0.5">
                    Effort: {selectedTask.effort || "Medium"}
                  </div>
                </div>
              </div>

              {/* Delivery Card */}
              <div className="rounded-xl border-0 bg-transparent p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Delivery
                  </span>
                  <MessageSquarePlus size={14} strokeWidth={1.75} className="text-slate-500 shrink-0" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900 truncate leading-snug">
                    {selectedTask.startInNewChat ? "New Chat" : "Thread"}
                  </div>
                  <div className="text-[12px] text-slate-500 mt-0.5 truncate">
                    {selectedTask.notifications || "All updates"}
                  </div>
                </div>
              </div>

              {/* Executions Card */}
              <div className="rounded-xl border-0 bg-transparent p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Activity
                  </span>
                  <Activity size={14} strokeWidth={1.75} className="text-slate-500 shrink-0" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900 leading-snug">
                    {runsForSelectedTask.length} execution
                    {runsForSelectedTask.length === 1 ? "" : "s"}
                  </div>
                  <div className="text-[12px] text-slate-500 mt-0.5 truncate">
                    {selectedTask.lastRun ? `Last: ${selectedTask.lastRun}` : "Not run yet"}
                  </div>
                </div>
              </div>
            </div>

            {/* Split Content: Left = Prompt / Instructions (38%), Right = Execution History (62%) across full canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-start w-full pt-1">
              {/* Left Column: Prompt & Instructions */}
              <div className="lg:col-span-5 flex flex-col gap-3 lg:pr-8 lg:border-r border-slate-200/70">
                <div className="p-0.5">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/60">
                    <h3 className="text-[13.5px] font-semibold text-slate-900 tracking-tight">
                      Prompt & Instructions
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopyText(selectedTask.prompt, selectedTask.id, "prompt")}
                      className="px-2 py-0.5 rounded text-slate-500 hover:text-slate-900 hover:bg-black/[0.04] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedPromptId === selectedTask.id ? (
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

                  <div className="text-[13px] text-slate-800 font-sans whitespace-pre-wrap leading-relaxed select-text pt-0.5">
                    {selectedTask.prompt}
                  </div>
                </div>
              </div>

              {/* Right Column: Execution History */}
              <div className="lg:col-span-7 flex flex-col gap-3 lg:pl-8 mt-6 lg:mt-0">
                <div className="p-1">
                  <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <History size={14} className="text-slate-500" />
                      <h3 className="text-[13.5px] font-semibold text-slate-900 tracking-tight">
                        Execution History
                      </h3>
                      <span className="text-[11.5px] font-normal text-slate-500">
                        ({runsForSelectedTask.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fetchTaskRuns(selectedTask.id)}
                        disabled={isLoadingRuns}
                        title="Refresh history"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-black/[0.04] transition-colors cursor-pointer"
                      >
                        <RotateCw size={12} className={isLoadingRuns ? "animate-spin" : ""} />
                      </button>
                    </div>
                  </div>

                  {isLoadingRuns ? (
                    <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                      <RotateCw size={15} className="animate-spin text-slate-500" />
                      <span>Loading history...</span>
                    </div>
                  ) : runsForSelectedTask.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center justify-center text-slate-950 mb-0.5">
                        <History size={22} strokeWidth={1.75} />
                      </div>
                      <p className="text-xs font-semibold text-slate-900">No executions recorded yet</p>
                      <p className="text-[11.5px] text-slate-400 max-w-xs">
                        Run this task manually with &quot;Run Now&quot; or wait for its scheduled trigger.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRunTask(selectedTask)}
                        className="mt-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Run Task Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                            className="pt-2 pb-3 border-b border-slate-200/50 last:border-b-0 transition-all"
                          >
                            {/* Run header */}
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-800">
                                  {isSuccess && <CheckCircle2 size={12} className="text-slate-700" />}
                                  {isFailed && <AlertCircle size={12} className="text-slate-700" />}
                                  {isRunning && <RotateCw size={12} className="animate-spin text-slate-700" />}
                                  <span className="capitalize">{run.status}</span>
                                </span>

                                <span className="text-[11px] text-slate-300">·</span>

                                <span className="text-[11.5px] text-slate-500 capitalize">
                                  {run.trigger} trigger
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                {durationSec && <span>Duration: {durationSec}s</span>}
                                <span>·</span>
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
                              <div className="mt-1.5">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                    Model Response
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(run.output!, run.id, "output")}
                                    className="px-1.5 py-0.5 rounded text-[11px] text-slate-500 hover:text-slate-900 hover:bg-black/[0.04] transition-colors flex items-center gap-1 cursor-pointer"
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

                                <div className="text-[13px] text-slate-800 select-text leading-relaxed">
                                  <AssistantResponse content={run.output} isStreaming={false} />
                                </div>
                              </div>
                            )}

                            {run.error && (
                              <div className="mt-2 p-2.5 bg-rose-50/50 rounded-md text-xs text-rose-800 font-mono flex items-center justify-between gap-3">
                                <span className="flex-1">{run.error}</span>
                                {run.error.includes("Customize → Providers") && (
                                  <button
                                    type="button"
                                    onClick={() => onNavigateToProviders()}
                                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1 shadow-xs active:scale-95"
                                  >
                                    <KeyRound size={11} />
                                    <span>Connect Key</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
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
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-slate-900 tracking-tight text-center">
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
                <Plus size={14} strokeWidth={1.75} />
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
          <div className="bg-white rounded-[26px] sm:rounded-[28px] shadow-2xl border border-zinc-200/80 w-full max-w-[560px] max-h-[90vh] overflow-y-auto cool-scrollbar p-6 sm:p-7 animate-in zoom-in-95 duration-150 relative text-left flex flex-col">
            {/* Header: Title + Close Icon */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-zinc-900 tracking-tight">
                {editingTaskId ? "Edit scheduled task" : "Schedule a task"}
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                title="Close"
                aria-label="Close"
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer -mr-1"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="flex flex-col">
              {/* Instructions Textarea Box */}
              <div className="w-full">
                <textarea
                  ref={modalInputRef}
                  rows={4}
                  value={modalPrompt}
                  onChange={(e) => setModalPrompt(e.target.value)}
                  placeholder="Instructions..."
                  className="w-full min-h-[140px] rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-5 text-[14.5px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 leading-relaxed resize-none shadow-2xs transition-colors"
                />
              </div>

              {/* Repeat & Time Container */}
              <div className="mt-4 rounded-2xl border border-zinc-200/90 bg-white overflow-visible divide-y divide-zinc-100 shadow-2xs">
                {/* Row 1: Repeat */}
                <div className="relative px-4 sm:px-5 py-3.5 flex items-center justify-between">
                  <span className="text-[14px] font-normal text-zinc-800">Repeat</span>

                  <div className="relative" ref={repeatDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRepeatDropdownOpen((v) => !v);
                        setIsTimeDropdownOpen(false);
                      }}
                      className="text-[14px] text-zinc-700 hover:text-zinc-950 flex items-center gap-1.5 transition-colors cursor-pointer select-none font-normal"
                    >
                      <span className="capitalize">
                        {modalFrequency === "daily"
                          ? "Daily"
                          : modalFrequency === "weekdays"
                          ? "Weekdays"
                          : modalFrequency === "weekly"
                          ? "Weekly"
                          : "Monthly"}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-zinc-400 transition-transform duration-200 ${
                          isRepeatDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isRepeatDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 sm:w-52 bg-white rounded-2xl shadow-xl border border-zinc-200/90 p-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
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
                              className={`w-full px-3.5 py-2 text-left flex items-center justify-between rounded-xl transition-colors cursor-pointer text-[13px] ${
                                isSelected
                                  ? "bg-zinc-100 font-medium text-zinc-950"
                                  : "text-zinc-800 hover:bg-zinc-50"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && (
                                <Check
                                  size={14}
                                  strokeWidth={1.75}
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
                  <div className="relative px-4 sm:px-5 py-3 flex items-center justify-between bg-zinc-50/50">
                    <span className="text-[13.5px] text-zinc-600 font-normal">Day of week</span>
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
                        className="text-[13.5px] text-zinc-700 hover:text-zinc-950 flex items-center gap-1.5 cursor-pointer font-normal"
                      >
                        <span>Every {modalDay}</span>
                        <ChevronDown
                          size={14}
                          className={`text-zinc-400 transition-transform ${
                            isDayDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isDayDropdownOpen && (
                        <div
                          role="listbox"
                          aria-label="Repeat day"
                          className="absolute right-0 top-full z-50 mt-1.5 max-h-60 w-48 overflow-y-auto rounded-2xl border border-zinc-200/90 bg-white p-1.5 text-[13px] shadow-xl cool-scrollbar animate-in fade-in zoom-in-95 duration-100 origin-top-right"
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
                                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left transition-colors ${
                                  isSelected
                                    ? "bg-zinc-100 font-medium text-zinc-950"
                                    : "text-zinc-700 hover:bg-zinc-50"
                                }`}
                              >
                                <span>Every {day}</span>
                                {isSelected && <Check size={14} strokeWidth={1.75} className="shrink-0 text-zinc-800" />}
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
                  <div className="relative px-4 sm:px-5 py-3 flex items-center justify-between bg-zinc-50/50">
                    <span className="text-[13.5px] text-zinc-600 font-normal">Day of month</span>
                    <select
                      value={modalDayOfMonth}
                      onChange={(e) => setModalDayOfMonth(Number(e.target.value))}
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[13px] text-zinc-800 focus:outline-none cursor-pointer"
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
                <div className="relative px-4 sm:px-5 py-3.5 flex items-center justify-between">
                  <span className="text-[14px] font-normal text-zinc-800">Time</span>

                  <div className="relative" ref={timeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTimeDropdownOpen((v) => !v);
                        setIsRepeatDropdownOpen(false);
                      }}
                      className="text-[14px] text-zinc-700 hover:text-zinc-950 flex items-center gap-1.5 transition-colors cursor-pointer select-none font-normal"
                    >
                      <span>
                        {modalTime} {friendlyTimezone}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-zinc-400 transition-transform duration-200 ${
                          isTimeDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Time Dropdown Menu */}
                    {isTimeDropdownOpen && (
                      <div
                        ref={timeListRef}
                        className="absolute right-0 top-full mt-2 w-52 sm:w-56 bg-white rounded-2xl shadow-xl border border-zinc-200/90 p-1.5 z-50 text-[13px] max-h-60 overflow-y-auto cool-scrollbar animate-in fade-in zoom-in-95 duration-100 origin-top-right"
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
                              className={`w-full px-3.5 py-2 text-left rounded-xl transition-colors cursor-pointer text-[13px] ${
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
              <div className="mt-4 mb-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen((v) => !v)}
                  className="flex items-center gap-1 text-[13.5px] text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer select-none font-normal"
                >
                  <span>Advanced</span>
                  {isAdvancedOpen ? (
                    <ChevronUp size={15} className="text-zinc-500" />
                  ) : (
                    <ChevronDown size={15} className="text-zinc-500" />
                  )}
                </button>
              </div>

              {/* Advanced Items Stack */}
              {isAdvancedOpen && (
                <div className="flex flex-col gap-2.5 animate-in fade-in duration-150">
                  {/* Item 1: Run on this computer */}
                  <div className="w-full rounded-2xl border border-zinc-200/90 bg-white px-4 sm:px-5 py-3 flex items-center justify-between shadow-2xs">
                    <span className="text-[14px] font-normal text-zinc-800">
                      Run on this computer
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={runOnThisComputer}
                      onClick={() => setRunOnThisComputer((v) => !v)}
                      className={`w-11 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        runOnThisComputer ? "bg-[#C86D51]" : "bg-zinc-200"
                      }`}
                    >
                      <div
                        className={`w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform absolute top-[2px] ${
                          runOnThisComputer ? "translate-x-[20px]" : "translate-x-[2px]"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 2: Notifications */}
                  <div className="relative w-full rounded-2xl border border-zinc-200/90 bg-white px-4 sm:px-5 py-3.5 flex items-center justify-between shadow-2xs">
                    <span className="text-[14px] font-normal text-zinc-800">Notifications</span>

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
                        className="text-[14px] text-zinc-700 hover:text-zinc-950 flex items-center gap-1.5 cursor-pointer font-normal select-none"
                      >
                        <span>{notificationsMode}</span>
                        <ChevronDown
                          size={14}
                          className={`text-zinc-400 transition-transform duration-200 ${
                            isNotificationsDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isNotificationsDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-zinc-200/90 p-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
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
                                className={`w-full px-3.5 py-2 text-left flex items-center justify-between rounded-xl transition-colors cursor-pointer text-[13px] ${
                                  isSelected
                                    ? "bg-zinc-100 font-medium text-zinc-950"
                                    : "text-zinc-800 hover:bg-zinc-50"
                                }`}
                              >
                                <span>{mode}</span>
                                {isSelected && (
                                  <Check
                                    size={14}
                                    strokeWidth={1.75}
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

                  {/* Item 3: Start each run in new chat */}
                  <div className="w-full rounded-2xl border border-zinc-200/90 bg-white px-4 sm:px-5 py-3 flex items-center justify-between shadow-2xs">
                    <span className="text-[14px] font-normal text-zinc-800">
                      Start each run in new chat
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={startInNewChat}
                      onClick={() => setStartInNewChat((v) => !v)}
                      className={`w-11 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        startInNewChat ? "bg-[#C86D51]" : "bg-zinc-200"
                      }`}
                    >
                      <div
                        className={`w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform absolute top-[2px] ${
                          startInNewChat ? "translate-x-[20px]" : "translate-x-[2px]"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 4: Model */}
                  <div className="relative w-full rounded-2xl border border-zinc-200/90 bg-white px-4 sm:px-5 py-3.5 flex items-center justify-between shadow-2xs">
                    <span className="text-[14px] font-normal text-zinc-800">Model</span>

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
                        className="text-[14px] text-zinc-700 hover:text-zinc-950 flex items-center gap-1.5 cursor-pointer font-normal select-none"
                      >
                        <span>{scheduledModelName(selectedModel)}</span>
                        <ChevronDown
                          size={14}
                          className={`text-zinc-400 transition-transform duration-200 ${
                            isModelDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Model Popover Menu */}
                      {isModelDropdownOpen && (
                        <div className="absolute right-0 bottom-full mb-2 w-64 max-h-72 overflow-y-auto bg-white rounded-2xl shadow-xl border border-zinc-200/90 p-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 origin-bottom-right cool-scrollbar">
                          <div className="px-3 pt-1 pb-1.5 text-[11.5px] font-medium text-zinc-400 select-none">
                            Available Models
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
                                className={`w-full px-3.5 py-2 text-left flex items-center justify-between rounded-xl transition-colors cursor-pointer text-[13px] ${
                                  isSelected
                                    ? "bg-zinc-100 font-medium text-zinc-950"
                                    : "text-zinc-800 hover:bg-zinc-50"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <CreatorLogo creator={resolveModelCreator(modelId)} size={15} />
                                  <span className="truncate">{scheduledModelName(modelId)}</span>
                                </div>
                                {isSelected && (
                                  <Check
                                    size={14}
                                    strokeWidth={1.75}
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

                  {/* Item 5: Effort */}
                  <div className="relative w-full rounded-2xl border border-zinc-200/90 bg-white px-4 sm:px-5 py-3.5 flex items-center justify-between shadow-2xs">
                    <span className="text-[14px] font-normal text-zinc-800">Effort</span>

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
                        className="text-[14px] text-zinc-700 hover:text-zinc-950 flex items-center gap-1.5 cursor-pointer font-normal select-none"
                      >
                        <span>{selectedEffort}</span>
                        <ChevronDown
                          size={14}
                          className={`text-zinc-400 transition-transform duration-200 ${
                            isEffortDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isEffortDropdownOpen && (
                        <div className="absolute right-0 bottom-full mb-2 w-44 bg-white rounded-2xl shadow-xl border border-zinc-200/90 p-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 origin-bottom-right">
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
                                className={`w-full px-3.5 py-2 text-left flex items-center justify-between rounded-xl transition-colors cursor-pointer text-[13px] ${
                                  isSelected
                                    ? "bg-zinc-100 font-medium text-zinc-950"
                                    : "text-zinc-800 hover:bg-zinc-50"
                                }`}
                              >
                                <span>{eff}</span>
                                {isSelected && (
                                  <Check
                                    size={14}
                                    strokeWidth={1.75}
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
              <div className="mt-6 sm:mt-7 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-[14px] font-medium text-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!modalPrompt.trim() || isSavingTask}
                  className={`px-6 py-2.5 rounded-full text-[14px] font-medium transition-all ${
                    modalPrompt.trim() && !isSavingTask
                      ? "bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer active:scale-95 shadow-xs"
                      : "bg-[#9E9E9E] text-white cursor-not-allowed"
                  }`}
                >
                  {isSavingTask ? "Creating…" : editingTaskId ? "Save" : "Create"}
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
                    <CreatorLogo
                      creator={resolveModelCreator(executingTask.model || "gpt-6-astra")}
                      size={13}
                    />
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
                  <div
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${
                      executionRunRecord?.status === "failed"
                        ? "bg-rose-50/70 border border-rose-100/80"
                        : "bg-slate-50 border border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {executionRunRecord?.status === "failed" ? (
                        <>
                          <AlertCircle size={13} className="text-rose-600" />
                          <span className="text-xs font-semibold text-rose-700">
                            Execution Failed
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} className="text-slate-800" />
                          <span className="text-xs font-semibold text-slate-800">
                            Execution Completed
                          </span>
                        </>
                      )}
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
                  <div
                    className={`p-4 bg-white border rounded-2xl text-xs leading-relaxed shadow-2xs select-text ${
                      executionRunRecord?.status === "failed"
                        ? "border-rose-200/80 text-rose-900"
                        : "border-slate-200/80 text-slate-800"
                    }`}
                  >
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
                  {executionRunRecord?.status === "failed" &&
                    executionOutput.includes("Customize → Providers") && (
                      <button
                        type="button"
                        onClick={() => {
                          setExecutingTask(null);
                          onNavigateToProviders();
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                      >
                        <KeyRound size={12} />
                        <span>Connect API Key</span>
                      </button>
                    )}
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
