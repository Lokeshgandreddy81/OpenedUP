import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useChatAuth } from "../../../app/auth/useChatAuth";
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  Clock,
  Send,
  Search,
  ChevronDown,
  Bot,
} from "lucide-react";
import {
  getSkills,
  getDirectorySkills,
  getDirectoryCategories,
  uploadSkill,
  deleteSkill,
  addDirectorySkillToLibrary,
  getAdminQueue,
  approveSkill,
  rejectSkill,
  submitSkillForReview,
  createSkillFromJson,
  type SkillItem,
} from "../services/skillsApi";
import { extractPdfText } from "../../artifacts";
import { SkillDetailModal } from "./SkillDetailModal";
import { SkillCreatorModal } from "./SkillCreatorModal";
import {
  formatSkillDescription,
  formatSkillTitle,
  getSkillIcon,
  isBuiltinSkill,
} from "../services/skillPresentation";

export interface CustomizeSkillsTabProps {
  subTab?: "Yours" | "Discover";
  onSubTabChange?: (tab: "Yours" | "Discover") => void;
  searchQuery?: string;
  onSkillsCountChange?: (yoursCount: number, discoverCount: number) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  isCreatorOpen?: boolean;
  setIsCreatorOpen?: (open: boolean) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  scopeFilter?: string;
  onScopeFilterChange?: (scope: string) => void;
  sortBy?: "popular" | "name" | "newest";
  onSortByChange?: (sort: "popular" | "name" | "newest") => void;
  onCategoriesLoaded?: (categories: Array<{ id: string; name: string }>) => void;
}

export const CustomizeSkillsTab: React.FC<CustomizeSkillsTabProps> = ({
  subTab = "Yours",
  onSubTabChange,
  searchQuery = "",
  onSkillsCountChange,
  fileInputRef,
  isCreatorOpen: controlledIsCreatorOpen,
  setIsCreatorOpen: controlledSetIsCreatorOpen,
  selectedCategory: controlledSelectedCategory,
  onCategoryChange,
  scopeFilter = "all",
  sortBy = "popular",
  onCategoriesLoaded,
}) => {
  const { user } = useChatAuth();
  const userId = user?.uid;
  const [internalIsCreatorOpen, setInternalIsCreatorOpen] = useState(false);
  const isCreatorOpen = controlledIsCreatorOpen ?? internalIsCreatorOpen;
  const setIsCreatorOpen = controlledSetIsCreatorOpen ?? setInternalIsCreatorOpen;

  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [directorySkills, setDirectorySkills] = useState<SkillItem[]>([]);
  const [reviewQueue, setReviewQueue] = useState<SkillItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const currentUserIdRef = useRef(userId);
  currentUserIdRef.current = userId;
  const isCurrentUser = (requestUserId: string | undefined) =>
    currentUserIdRef.current === requestUserId;
  const [dataUserId, setDataUserId] = useState(userId);
  const hasCurrentUserData = dataUserId === userId;
  const visibleSkills = useMemo(
    () => (hasCurrentUserData ? skills : []),
    [hasCurrentUserData, skills]
  );
  const visibleDirectorySkills = useMemo(
    () => (hasCurrentUserData ? directorySkills : []),
    [hasCurrentUserData, directorySkills]
  );
  const visibleReviewQueue = useMemo(
    () => (hasCurrentUserData ? reviewQueue : []),
    [hasCurrentUserData, reviewQueue]
  );
  const visibleCategories = useMemo(
    () => (hasCurrentUserData ? categories : []),
    [hasCurrentUserData, categories]
  );
  const [internalSelectedCategory, setInternalSelectedCategory] = useState<string>("All");
  const selectedCategory = controlledSelectedCategory ?? internalSelectedCategory;
  const setSelectedCategory = (cat: string) => {
    setInternalSelectedCategory(cat);
    onCategoryChange?.(cat);
  };
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [showReviewQueue, setShowReviewQueue] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalSkillId, setModalSkillId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const visibleError = hasCurrentUserData ? error : null;
  const visibleUploadError = hasCurrentUserData ? uploadError : null;
  const visibleIsLoading = !hasCurrentUserData || isLoading;
  const visibleIsUploading = hasCurrentUserData && isUploading;

  const localFileInputRef = useRef<HTMLInputElement>(null);
  const activeFileInputRef = fileInputRef || localFileInputRef;
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDataUserId(userId);
    setSkills([]);
    setDirectorySkills([]);
    setReviewQueue([]);
    setCategories([]);
    setError(null);
    setUploadError(null);
    setIsUploading(false);
    setShowReviewQueue(false);
    setModalSkillId(null);
  }, [userId]);

  useEffect(() => {
    if (!hasCurrentUserData) {
      onSkillsCountChange?.(0, 0);
      onCategoriesLoaded?.([]);
    }
  }, [hasCurrentUserData, onCategoriesLoaded, onSkillsCountChange]);

  useEffect(() => {
    if (!isCategoryDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isCategoryDropdownOpen]);

  const fetchLibrary = useCallback(async () => {
    const requestUserId = userId;
    try {
      const data = await getSkills(undefined, requestUserId);
      if (currentUserIdRef.current !== requestUserId) return [];
      setSkills(data);
      setDataUserId(requestUserId);
      return data;
    } catch (err: unknown) {
      if (currentUserIdRef.current === requestUserId) {
        setError(err instanceof Error ? err.message : "Failed to load skills.");
      }
      return [];
    }
  }, [userId]);

  const fetchDirectory = useCallback(async () => {
    const requestUserId = userId;
    try {
      const [dirData, catData] = await Promise.all([
        getDirectorySkills(
          {
            category: selectedCategory !== "All" ? selectedCategory : undefined,
            q: searchQuery || undefined,
          },
          userId
        ),
        getDirectoryCategories(userId),
      ]);
      if (currentUserIdRef.current !== requestUserId) return [];
      setDirectorySkills(dirData);
      setCategories(catData);
      setDataUserId(requestUserId);
      onCategoriesLoaded?.(catData);
      return dirData;
    } catch {
      return [];
    }
  }, [onCategoriesLoaded, searchQuery, selectedCategory, userId]);

  const fetchReviewQueue = useCallback(async () => {
    const requestUserId = userId;
    try {
      const queue = await getAdminQueue(requestUserId);
      if (currentUserIdRef.current !== requestUserId) return;
      setReviewQueue(queue);
      setDataUserId(requestUserId);
    } catch {
      // ignore
    }
  }, [userId]);

  useEffect(() => {
    const requestUserId = userId;
    let cancelled = false;
    setIsLoading(true);
    Promise.all([fetchLibrary(), fetchDirectory(), fetchReviewQueue()])
      .then(([libData, dirData]) => {
        if (cancelled || currentUserIdRef.current !== requestUserId) return;
        onSkillsCountChange?.(libData.length, dirData.length);
      })
      .finally(() => {
        if (!cancelled && currentUserIdRef.current === requestUserId) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchDirectory, fetchLibrary, fetchReviewQueue, onSkillsCountChange, userId]);

  useEffect(() => {
    if (subTab === "Discover") {
      void fetchDirectory();
    }
  }, [fetchDirectory, subTab]);

  useEffect(() => {
    if (hasCurrentUserData)
      onSkillsCountChange?.(visibleSkills.length, visibleDirectorySkills.length);
  }, [
    hasCurrentUserData,
    visibleSkills.length,
    visibleDirectorySkills.length,
    onSkillsCountChange,
  ]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0]!;
    const requestUserId = userId;

    setIsUploading(true);
    setUploadError(null);
    try {
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith(".zip")) {
        const created = await uploadSkill(file, "user", requestUserId);
        if (!isCurrentUser(requestUserId)) return;
        setSkills((prev) => {
          const filtered = prev.filter((s) => s.id !== created.id && s.name !== created.name);
          return [created, ...filtered];
        });
      } else if (lowerName.endsWith(".pdf")) {
        // Direct PDF import
        const { content } = await extractPdfText(file);
        const cleanName =
          file.name
            .replace(/\.pdf$/i, "")
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/^-+|-+$/g, "") || "pdf-skill";
        const created = await createSkillFromJson(
          {
            name: cleanName,
            description: `Imported PDF knowledge base from ${file.name}`,
            skillMd: `---\nname: ${cleanName}\ndescription: Imported PDF knowledge base from ${file.name}\n---\n# ${file.name}\n\n${content}`,
            files: [],
            scope: "user",
            approvalStatus: "approved",
          },
          requestUserId
        );
        if (!isCurrentUser(requestUserId)) return;
        setSkills((prev) => {
          const filtered = prev.filter((s) => s.id !== created.id && s.name !== created.name);
          return [created, ...filtered];
        });
      } else if (lowerName.endsWith(".md") || lowerName.endsWith(".txt")) {
        // Direct Markdown / text file import
        const text = await file.text();
        const cleanName =
          file.name
            .replace(/\.[^/.]+$/, "")
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/^-+|-+$/g, "") || "custom-skill";
        const hasFrontmatter = text.trimStart().startsWith("---");
        const skillMd = hasFrontmatter
          ? text
          : `---\nname: ${cleanName}\ndescription: Imported skill from ${file.name}\n---\n${text}`;

        const created = await createSkillFromJson(
          {
            name: cleanName,
            description: `Imported skill from ${file.name}`,
            skillMd,
            files: [],
            scope: "user",
            approvalStatus: "approved",
          },
          requestUserId
        );
        if (!isCurrentUser(requestUserId)) return;
        setSkills((prev) => {
          const filtered = prev.filter((s) => s.id !== created.id && s.name !== created.name);
          return [created, ...filtered];
        });
      } else {
        throw new Error("Unsupported format. Please select a .zip, .md, or .pdf file.");
      }
      if (isCurrentUser(requestUserId)) {
        void fetchLibrary();
        void fetchDirectory();
      }
    } catch (err: unknown) {
      if (isCurrentUser(requestUserId)) {
        setUploadError(err instanceof Error ? err.message : "Failed to upload skill.");
      }
    } finally {
      if (isCurrentUser(requestUserId)) setIsUploading(false);
      if (activeFileInputRef.current) activeFileInputRef.current.value = "";
    }
  };

  const handleDelete = async (skillId: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) return;
    const requestUserId = userId;
    try {
      await deleteSkill(skillId, requestUserId);
      if (!isCurrentUser(requestUserId)) return;
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
    } catch (err: unknown) {
      if (isCurrentUser(requestUserId)) {
        alert(err instanceof Error ? err.message : "Failed to delete skill.");
      }
    }
  };

  const handleApprove = async (skillId: string) => {
    const requestUserId = userId;
    try {
      await approveSkill(skillId, requestUserId);
      if (!isCurrentUser(requestUserId)) return;
      setReviewQueue((prev) => prev.filter((s) => s.id !== skillId));
      void fetchLibrary();
      void fetchDirectory();
    } catch (err: unknown) {
      if (isCurrentUser(requestUserId)) {
        alert(err instanceof Error ? err.message : "Failed to approve skill.");
      }
    }
  };

  const handleReject = async (skillId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason || !reason.trim()) return;
    const requestUserId = userId;
    try {
      await rejectSkill(skillId, reason.trim(), requestUserId);
      if (!isCurrentUser(requestUserId)) return;
      setReviewQueue((prev) => prev.filter((s) => s.id !== skillId));
      void fetchLibrary();
    } catch (err: unknown) {
      if (isCurrentUser(requestUserId)) {
        alert(err instanceof Error ? err.message : "Failed to reject skill.");
      }
    }
  };

  const handleSubmitReview = async (skillId: string) => {
    const requestUserId = userId;
    try {
      const updated = await submitSkillForReview(skillId, undefined, requestUserId);
      if (!isCurrentUser(requestUserId)) return;
      setSkills((prev) => prev.map((s) => (s.id === skillId ? updated : s)));
      void fetchReviewQueue();
      alert("Skill submitted for administrator review.");
    } catch (err: unknown) {
      if (isCurrentUser(requestUserId)) {
        alert(err instanceof Error ? err.message : "Failed to submit for review.");
      }
    }
  };

  const libraryNames = useMemo(() => new Set(visibleSkills.map((s) => s.name)), [visibleSkills]);

  const filteredLibrary = useMemo(() => {
    let list = visibleSkills;
    if (selectedCategory !== "All") {
      const catLower = selectedCategory.toLowerCase();
      list = list.filter(
        (s) =>
          (s.categories && s.categories.some((c: string) => c.toLowerCase() === catLower)) ||
          s.name.toLowerCase().includes(catLower) ||
          s.description.toLowerCase().includes(catLower)
      );
    }
    if (scopeFilter !== "all") {
      list = list.filter((s) => {
        if (scopeFilter === "builtin") return isBuiltinSkill(s);
        return s.scope === scopeFilter;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => b.version - a.version);
    }
    return sorted;
  }, [visibleSkills, selectedCategory, scopeFilter, searchQuery, sortBy]);

  const filteredDirectory = useMemo(() => {
    let list = visibleDirectorySkills;
    if (selectedCategory !== "All") {
      const catLower = selectedCategory.toLowerCase();
      list = list.filter(
        (s) =>
          (s.categories && s.categories.some((c: string) => c.toLowerCase() === catLower)) ||
          s.name.toLowerCase().includes(catLower) ||
          s.description.toLowerCase().includes(catLower)
      );
    }
    if (scopeFilter !== "all") {
      list = list.filter((s) => {
        if (scopeFilter === "builtin") return isBuiltinSkill(s);
        return s.scope === scopeFilter;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => b.version - a.version);
    }
    return sorted;
  }, [visibleDirectorySkills, selectedCategory, scopeFilter, searchQuery, sortBy]);

  const getScopeBadge = (skillOrScope: SkillItem | string | { scope: string; name?: string }) => {
    if (typeof skillOrScope !== "string") {
      if (isBuiltinSkill(skillOrScope)) {
        return <span className="text-[11px] font-mono text-neutral-400">Built-in</span>;
      }
      return skillOrScope.scope === "org" ? (
        <span className="text-[11px] font-mono text-neutral-400">Org</span>
      ) : (
        <span className="text-[11px] font-mono text-neutral-400">Private</span>
      );
    }
    switch (skillOrScope) {
      case "builtin":
      case "directory":
        return <span className="text-[11px] font-mono text-neutral-400">Built-in</span>;
      case "org":
        return <span className="text-[11px] font-mono text-neutral-400">Org</span>;
      default:
        return <span className="text-[11px] font-mono text-neutral-400">Private</span>;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 select-none pt-4">
      {/* Hidden file input for desktop skill uploads */}
      <input
        ref={activeFileInputRef}
        type="file"
        accept=".zip,.md,.pdf,.txt"
        className="hidden"
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
        onChange={handleFileUpload}
      />

      {/* Uploading progress notification */}
      {visibleIsUploading && (
        <div className="flex items-center gap-2.5 p-3.5 bg-neutral-100 rounded-2xl text-[12.5px] text-neutral-700 animate-in fade-in duration-150">
          <Loader2 size={15} className="animate-spin text-neutral-900" />
          <span>Uploading and validating skill package...</span>
        </div>
      )}

      {/* Upload error banner */}
      {visibleUploadError && (
        <div className="flex items-center justify-between p-3.5 bg-rose-50 rounded-2xl text-[12.5px] text-rose-700 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{visibleUploadError}</span>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-[11.5px] font-medium text-rose-600 hover:text-rose-900 cursor-pointer ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {visibleError && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3.5 bg-rose-50 rounded-2xl text-[12.5px] text-rose-700"
        >
          <AlertCircle size={15} className="shrink-0" />
          <span>{visibleError}</span>
        </div>
      )}

      {/* Admin review queue banner toggle if items exist */}
      {visibleReviewQueue.length > 0 && subTab === "Yours" && (
        <div className="flex items-center justify-between px-5 py-3 bg-[#F8F8FA] rounded-2xl">
          <div className="flex items-center gap-2.5">
            <Clock size={15} className="text-neutral-700" />
            <span className="text-[13px] font-medium text-neutral-900">
              {visibleReviewQueue.length}{" "}
              {visibleReviewQueue.length === 1 ? "skill awaits" : "skills await"} admin review
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowReviewQueue((prev) => !prev)}
            className="text-[12px] font-medium text-neutral-900 hover:underline cursor-pointer"
          >
            {showReviewQueue ? "Hide queue" : "Review submissions"}
          </button>
        </div>
      )}

      {/* Admin Review Queue List (when open) */}
      {showReviewQueue && visibleReviewQueue.length > 0 && subTab === "Yours" && (
        <div className="flex flex-col gap-3 pb-2">
          {visibleReviewQueue.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-[#F8F8FA] hover:bg-[#F2F2F6] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-[14px] font-semibold text-neutral-900">{item.name}</span>
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-medium">
                    Pending review
                  </span>
                  {getScopeBadge(item.scope)}
                  <span className="text-[11px] font-mono text-neutral-400">v{item.version}</span>
                </div>
                <p className="text-[12px] text-neutral-500 line-clamp-2 leading-relaxed">
                  {formatSkillDescription(item.description)}
                </p>
                {item.author && (
                  <span className="text-[11px] text-neutral-400 block">
                    Submitted by {item.author}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalSkillId(item.id)}
                  className="h-8 px-3 rounded-lg text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/60 text-[12px] font-medium transition-colors cursor-pointer"
                >
                  Inspect
                </button>
                <button
                  type="button"
                  onClick={() => void handleReject(item.id)}
                  className="h-8 px-3 rounded-lg text-rose-600 hover:bg-rose-50 text-[12px] font-medium transition-colors cursor-pointer"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => void handleApprove(item.id)}
                  className="h-8 px-3.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-[12px] font-medium transition-colors cursor-pointer shadow-xs"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid: Discover View */}
      {subTab === "Discover" ? (
        <>
          {/* Header row: "For you" on left, Category dropdown on right */}
          <div className="flex items-center justify-between mt-3 mb-1">
            <h2 className="text-[18px] font-semibold text-neutral-900 tracking-tight">
              {selectedCategory === "All" ? "For you" : selectedCategory}
            </h2>

            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                className="h-8 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 text-[12.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none"
              >
                <span className="text-neutral-500 font-normal">Category:</span>
                <span className="font-medium text-neutral-900">{selectedCategory}</span>
                <ChevronDown
                  size={13}
                  className={`text-neutral-500 transition-transform duration-150 ${
                    isCategoryDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isCategoryDropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.2)] ring-1 ring-neutral-200/80 z-30 animate-in fade-in zoom-in-95 duration-100 text-[12.5px] text-neutral-700 select-none max-h-72 overflow-y-auto"
                >
                  {["All", ...visibleCategories.map((c) => c.name)].map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-[12px] transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-neutral-100 text-neutral-950 font-medium"
                            : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                        }`}
                      >
                        <span>{cat === "All" ? "All categories" : cat}</span>
                        {isSelected && <Check size={12} className="text-neutral-900 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {filteredDirectory.length === 0 && !visibleIsLoading && (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#F8F8FA] rounded-3xl">
              <Search size={22} className="text-neutral-400 mb-2.5" />
              <h3 className="text-[15px] font-medium text-neutral-900">
                {searchQuery
                  ? `No skills matching "${searchQuery}"`
                  : "No skills in this category yet"}
              </h3>
              <p className="mt-1 text-[12.5px] text-neutral-500">
                Try selecting a different category or search for other skills.
              </p>
            </div>
          )}

          {/* 2-column horizontal card grid (Claude Directory style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredDirectory.map((skill) => {
              const isAdded = libraryNames.has(skill.name);
              return (
                <div
                  key={skill.id}
                  onClick={() => setModalSkillId(skill.id)}
                  className="p-4 rounded-2xl bg-[#F8F8FA] hover:bg-[#F2F2F6] transition-all flex items-start gap-3.5 cursor-pointer group select-none min-h-[105px]"
                >
                  {/* Left: Icon Box - seamlessly integrated into card surface */}
                  <div className="w-10 h-10 rounded-xl bg-neutral-200/50 flex items-center justify-center shrink-0 text-neutral-800 group-hover:bg-neutral-200/80 transition-colors">
                    {getSkillIcon(skill.name, 19)}
                  </div>

                  {/* Center & Right: Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top line: Title & Compact Action Buttons */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[14.5px] font-semibold text-neutral-900 group-hover:text-neutral-950 transition-colors tracking-tight truncate flex-1 min-w-0">
                        {formatSkillTitle(skill.name)}
                      </h3>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Add Button: compact square button like Claude */}
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (isAdded) return;
                            const requestUserId = userId;
                            try {
                              const copy = await addDirectorySkillToLibrary(
                                skill.id,
                                requestUserId
                              );
                              if (!isCurrentUser(requestUserId)) return;
                              setSkills((prev) => [copy, ...prev]);
                            } catch (err) {
                              if (isCurrentUser(requestUserId)) {
                                alert(err instanceof Error ? err.message : "Failed to add");
                              }
                            }
                          }}
                          disabled={isAdded}
                          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                            isAdded
                              ? "bg-neutral-200/60 text-neutral-500 cursor-default"
                              : "bg-neutral-200/80 hover:bg-neutral-300/80 text-neutral-800 cursor-pointer"
                          }`}
                          title={isAdded ? "Added to library" : "Add to library"}
                        >
                          {isAdded ? (
                            <Check size={12} strokeWidth={2.5} className="text-neutral-600" />
                          ) : (
                            <Plus size={14} strokeWidth={2} className="text-neutral-700" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[12px] text-neutral-500 line-clamp-2 leading-relaxed mt-1">
                      {formatSkillDescription(skill.description)}
                    </p>

                    {/* Metadata Footer */}
                    <div className="text-[11.5px] text-neutral-400 mt-2 flex items-center gap-1.5">
                      <span>
                        {isBuiltinSkill(skill) ? "Built-in" : skill.sourceLabel || "Community"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Main Grid: Yours View */
        <>
          <div className="flex items-center justify-between mt-3 mb-1">
            <h2 className="text-[18px] font-semibold text-neutral-900 tracking-tight">
              My Library
            </h2>
            <span className="text-[12px] text-neutral-400 font-mono">
              {filteredLibrary.length} {filteredLibrary.length === 1 ? "skill" : "skills"}
            </span>
          </div>

          {filteredLibrary.length === 0 && !visibleIsLoading && (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#F8F8FA] rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-neutral-200/60 flex items-center justify-center text-neutral-600 mb-3">
                <Bot size={22} />
              </div>
              <h3 className="text-[16px] font-semibold text-neutral-900">
                {searchQuery
                  ? `No skills matching "${searchQuery}"`
                  : "No skills in your library yet"}
              </h3>
              <p className="mt-1 text-[13px] text-neutral-500 max-w-md">
                {searchQuery
                  ? "Try checking your spelling or clear your search query."
                  : "Explore the directory to discover skills for data analysis, code review, workflow automation, and custom tools."}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={() => onSubTabChange?.("Discover")}
                  className="mt-5 px-4 py-2 rounded-xl bg-neutral-950 text-white text-[13px] font-medium hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer"
                >
                  Browse directory
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredLibrary.map((skill) => (
              <div
                key={skill.id}
                onClick={() => setModalSkillId(skill.id)}
                className="p-4 rounded-2xl bg-[#F8F8FA] hover:bg-[#F2F2F6] transition-all flex items-start gap-3.5 cursor-pointer group select-none min-h-[105px]"
              >
                {/* Left: Icon Box - seamlessly integrated into card surface */}
                <div className="w-10 h-10 rounded-xl bg-neutral-200/50 flex items-center justify-center shrink-0 text-neutral-800 group-hover:bg-neutral-200/80 transition-colors">
                  {getSkillIcon(skill.name, 19)}
                </div>

                {/* Center: Content */}
                <div className="flex-1 min-w-0">
                  {/* Top line: Title & Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[14.5px] font-semibold text-neutral-900 group-hover:text-neutral-950 transition-colors tracking-tight truncate flex-1 min-w-0">
                      {formatSkillTitle(skill.name)}
                    </h3>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {getScopeBadge(skill)}
                      {skill.approvalStatus && skill.approvalStatus !== "approved" && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            skill.approvalStatus === "draft"
                              ? "bg-neutral-200 text-neutral-600"
                              : skill.approvalStatus === "pending_review"
                                ? "bg-amber-50 text-amber-800"
                                : "bg-rose-50 text-rose-800"
                          }`}
                        >
                          {skill.approvalStatus === "pending_review"
                            ? "Pending"
                            : skill.approvalStatus === "rejected"
                              ? "Rejected"
                              : "Draft"}
                        </span>
                      )}
                      {!isBuiltinSkill(skill) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(skill.id);
                          }}
                          className="h-7 px-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 hover:text-neutral-950 inline-flex items-center gap-1.5 text-[11.5px] font-medium transition-colors cursor-pointer"
                          title="Delete skill"
                        >
                          <Trash2 size={12} className="text-neutral-700 shrink-0" />
                          <span className="leading-none text-neutral-900">Delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[12px] text-neutral-500 line-clamp-2 leading-relaxed mt-1">
                    {formatSkillDescription(skill.description)}
                  </p>

                  {/* Metadata Footer */}
                  <div className="text-[11.5px] text-neutral-400 mt-2 flex items-center justify-between">
                    <span>
                      {isBuiltinSkill(skill)
                        ? "Built-in"
                        : skill.scope === "org"
                          ? "Organization"
                          : "Personal library"}
                    </span>

                    {skill.approvalStatus === "draft" || skill.approvalStatus === "rejected" ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleSubmitReview(skill.id);
                        }}
                        className="font-medium text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Send size={11} /> Submit
                      </button>
                    ) : (
                      <span className="text-[11px] text-neutral-400">Ready</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {hasCurrentUserData && modalSkillId && (
        <SkillDetailModal
          skillId={modalSkillId}
          onClose={() => setModalSkillId(null)}
          isAlreadyAdded={libraryNames.has(
            visibleDirectorySkills.find((s) => s.id === modalSkillId)?.name ||
              visibleSkills.find((s) => s.id === modalSkillId)?.name ||
              ""
          )}
          onSkillAdded={(copy) => {
            if (isCurrentUser(userId)) setSkills((prev) => [copy, ...prev]);
          }}
          onSkillDeleted={(deletedId) => {
            if (!isCurrentUser(userId)) return;
            setSkills((prev) => prev.filter((s) => s.id !== deletedId));
            setDirectorySkills((prev) => prev.filter((s) => s.id !== deletedId));
          }}
        />
      )}

      {/* Creator Modal */}
      {isCreatorOpen && (
        <SkillCreatorModal
          isOpen={isCreatorOpen}
          onClose={() => setIsCreatorOpen(false)}
          onSkillCreated={(newSkill) => {
            if (isCurrentUser(userId)) setSkills((prev) => [newSkill, ...prev]);
          }}
        />
      )}
    </div>
  );
};
