import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  Code2,
  FileText,
  Trash2,
  ArrowUpRight,
  X,
  Pencil,
  Download,
  Eye,
  Code,
  Copy,
  Check,
  Star,
  Upload,
  ChevronDown,
  MoreHorizontal,
  Share2,
  CopyPlus,
  ArchiveRestore,
} from "lucide-react";
import { useArtifacts, type ArtifactItem, type ArtifactVersion } from "../services/artifactStore";
import { useChatAuth } from "../../../app/auth/ChatAuthContext";
import { ArtifactContentView } from "../components/ArtifactContentView";
import { ArtifactCodeEditor } from "../components/ArtifactCodeEditor";
import { getArtifactExtension, getArtifactFileInfo } from "../utils/artifactFormats";
import { diffArtifactContent } from "../utils/artifactDiff";
import { extractPdfText } from "../services/pdfTextImport";

export type ArtifactCategory = "All" | "Code" | "Documents";

export interface ArtifactsScreenProps {
  onNavigateToChat?: (prompt?: string) => void;
}

function artifactChatPrompt(title: string, content: string): string {
  const contextLimit = 32_000;
  const excerpt = content.slice(0, contextLimit);
  const omittedCharacters = content.length - excerpt.length;
  return `Continue working on the artifact “${title}”. Preserve its intent and help me refine it.\n\n${excerpt}${omittedCharacters > 0 ? `\n\n[The chat draft includes the first ${contextLimit.toLocaleString()} characters. ${omittedCharacters.toLocaleString()} more characters remain in the saved artifact.]` : ""}`;
}

function artifactExcerpt(artifact: ArtifactItem): string {
  if (artifact.category === "Code") return artifact.content;
  return artifact.content
    .replace(/^```[^\n]*\n[\s\S]*?\n```$/gm, "Code example")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/[*_`>#]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

function artifactCardPreview(artifact: ArtifactItem): { label?: string; content: string } {
  if (artifact.category !== "Documents") {
    return { content: artifactExcerpt(artifact) };
  }

  const pageMarkers = [
    ...artifact.content.matchAll(/^(?:#{1,6}\s*|---\s*)?Page\s+(\d+)(?:\s*---)?\s*$/gim),
  ];
  const firstPage = pageMarkers[0];
  if (!firstPage || firstPage.index === undefined) {
    return { content: artifactExcerpt(artifact) };
  }

  const bodyStart = firstPage.index + firstPage[0].length;
  const nextPage = pageMarkers[1];
  const bodyEnd = nextPage?.index ?? artifact.content.length;
  const pageCount = pageMarkers.length;
  return {
    label: `PDF · ${pageCount} ${pageCount === 1 ? "page" : "pages"}`,
    content: artifactExcerpt({ ...artifact, content: artifact.content.slice(bodyStart, bodyEnd) }),
  };
}

function formatUpdatedAt(timestamp: number): string {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "Recently updated";
  return `Edited ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function presentArtifactTitle(title: string): string {
  return title.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
}

interface RecoveredArtifactDraft {
  title: string;
  category: "Code" | "Documents";
  language: string;
  content: string;
}

function artifactDraftKey(userId: string | undefined, artifactId: string | null): string {
  return `shoebox-artifact-draft-v1:${userId || "local"}:${artifactId || "new"}`;
}

export const ArtifactsScreen: React.FC<ArtifactsScreenProps> = ({ onNavigateToChat }) => {
  const [activeCategory, setActiveCategory] = useState<ArtifactCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const artifactFileInputRef = useRef<HTMLInputElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const createMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const recoveredDraftMenuRef = useRef<HTMLDivElement>(null);
  const recoveredDraftTriggerRef = useRef<HTMLButtonElement>(null);
  const artifactActionsRef = useRef<HTMLDivElement>(null);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isRecoveredDraftMenuOpen, setIsRecoveredDraftMenuOpen] = useState(false);
  const [isArtifactActionsOpen, setIsArtifactActionsOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"updated" | "created" | "title">("updated");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [organizationSavingId, setOrganizationSavingId] = useState<string | null>(null);
  const [isOrganizationEditorOpen, setIsOrganizationEditorOpen] = useState(false);
  const [collectionDraft, setCollectionDraft] = useState("");
  const [tagsDraft, setTagsDraft] = useState("");
  const [artifactNotice, setArtifactNotice] = useState("");

  const {
    artifacts,
    loading,
    error: syncError,
    retrySync,
    addArtifact,
    updateArtifact,
    updateOrganization,
    getVersions,
    removeArtifact,
    setShared,
  } = useArtifacts();
  const { user } = useChatAuth();
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArtifactItem | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDiscardConfirmationOpen, setIsDiscardConfirmationOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"Code" | "Documents">("Documents");
  const [newLanguage, setNewLanguage] = useState("markdown");
  const [newContent, setNewContent] = useState("");
  const [editorMode, setEditorMode] = useState<"Edit" | "Preview">("Edit");
  const [isSaving, setIsSaving] = useState(false);
  const [editingArtifactId, setEditingArtifactId] = useState<string | null>(null);
  const [artifactError, setArtifactError] = useState("");
  const [artifactVersions, setArtifactVersions] = useState<ArtifactVersion[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [compareVersion, setCompareVersion] = useState<ArtifactVersion | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState<RecoveredArtifactDraft | null>(null);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!isCreateMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!createMenuRef.current?.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCreateMenuOpen(false);
        createMenuTriggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCreateMenuOpen]);

  useEffect(() => {
    if (!isSortMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) setIsSortMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSortMenuOpen(false);
        sortMenuTriggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSortMenuOpen]);

  useEffect(() => {
    if (!isRecoveredDraftMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!recoveredDraftMenuRef.current?.contains(event.target as Node)) {
        setIsRecoveredDraftMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isRecoveredDraftMenuOpen]);

  useEffect(() => {
    if (!isArtifactActionsOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!artifactActionsRef.current?.contains(event.target as Node)) {
        setIsArtifactActionsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsArtifactActionsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isArtifactActionsOpen]);

  const userArtifacts = artifacts.filter((artifact) => artifact.isOwner !== false);
  const availableCollections = [
    ...new Set(userArtifacts.map((artifact) => artifact.collection).filter(Boolean)),
  ].sort((a, b) => a!.localeCompare(b!)) as string[];
  const availableTags = [...new Set(userArtifacts.flatMap((artifact) => artifact.tags ?? []))].sort(
    (a, b) => a.localeCompare(b)
  );
  const filteredArtifacts = artifacts
    .filter((art) => {
      if (activeCategory !== "All" && art.category !== activeCategory) return false;
      if (favoriteOnly && !art.isFavorite) return false;
      if (collectionFilter && art.collection !== collectionFilter) return false;
      if (tagFilter && !(art.tags ?? []).includes(tagFilter)) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        art.title.toLowerCase().includes(q) ||
        art.content.toLowerCase().includes(q) ||
        (art.modelUsed && art.modelUsed.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "title")
        return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      return sortBy === "created" ? b.createdAt - a.createdAt : b.updatedAt - a.updatedAt;
    });
  const hasActiveLibraryFilters =
    Boolean(searchQuery.trim()) ||
    activeCategory !== "All" ||
    favoriteOnly ||
    Boolean(collectionFilter) ||
    Boolean(tagFilter);
  const isInitialEmptyState = artifacts.length === 0 && !hasActiveLibraryFilters;
  const showEmptyLibrary = isInitialEmptyState && !loading;

  const editingArtifact = editingArtifactId
    ? artifacts.find((artifact) => artifact.id === editingArtifactId)
    : undefined;
  const hasUnsavedChanges = editingArtifact
    ? newTitle !== editingArtifact.title ||
      newContent !== editingArtifact.content ||
      newCategory !== editingArtifact.category ||
      newLanguage !==
        (editingArtifact.language ||
          (editingArtifact.category === "Code" ? "javascript" : "markdown"))
    : Boolean(newTitle.trim() || newContent.trim());

  useEffect(() => {
    if (!isCreateOpen) {
      setRecoveredDraft(null);
      return;
    }
    const key = artifactDraftKey(user?.uid, editingArtifactId);
    try {
      const rawDraft = window.localStorage.getItem(key);
      if (!rawDraft) {
        setRecoveredDraft(null);
        return;
      }
      const candidate: unknown = JSON.parse(rawDraft);
      if (
        !candidate ||
        typeof candidate !== "object" ||
        typeof (candidate as RecoveredArtifactDraft).title !== "string" ||
        !["Code", "Documents"].includes((candidate as RecoveredArtifactDraft).category) ||
        typeof (candidate as RecoveredArtifactDraft).language !== "string" ||
        typeof (candidate as RecoveredArtifactDraft).content !== "string"
      ) {
        window.localStorage.removeItem(key);
        setRecoveredDraft(null);
        return;
      }
      const draft = candidate as RecoveredArtifactDraft;
      const sameAsSaved = editingArtifact
        ? draft.title === editingArtifact.title &&
          draft.content === editingArtifact.content &&
          draft.category === editingArtifact.category &&
          draft.language ===
            (editingArtifact.language ||
              (editingArtifact.category === "Code" ? "javascript" : "markdown"))
        : !draft.title.trim() && !draft.content.trim();
      setRecoveredDraft(sameAsSaved ? null : draft);
    } catch {
      window.localStorage.removeItem(key);
      setRecoveredDraft(null);
    }
  }, [isCreateOpen, editingArtifactId, editingArtifact, user?.uid]);

  useEffect(() => {
    if (!isCreateOpen || recoveredDraft) return;
    const key = artifactDraftKey(user?.uid, editingArtifactId);
    const timeout = window.setTimeout(() => {
      if (!newTitle.trim() && !newContent.trim() && !editingArtifactId) {
        window.localStorage.removeItem(key);
        return;
      }
      if (editingArtifact && !hasUnsavedChanges) {
        window.localStorage.removeItem(key);
        return;
      }
      window.localStorage.setItem(
        key,
        JSON.stringify({
          title: newTitle,
          category: newCategory,
          language: newLanguage,
          content: newContent,
        } satisfies RecoveredArtifactDraft)
      );
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [
    isCreateOpen,
    recoveredDraft,
    user?.uid,
    editingArtifactId,
    editingArtifact,
    hasUnsavedChanges,
    newTitle,
    newCategory,
    newLanguage,
    newContent,
  ]);

  const requestCloseEditor = () => {
    if (isSaving) return;
    if (hasUnsavedChanges) {
      setIsDiscardConfirmationOpen(true);
      return;
    }
    setIsCreateOpen(false);
    setEditingArtifactId(null);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard is unavailable");
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setArtifactError("");
    } catch {
      setCopiedId(null);
      setArtifactError("Could not copy this artifact. Check clipboard permissions and try again.");
    }
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  const handleOpenCreate = (cat: "Code" | "Documents") => {
    setNewCategory(cat);
    setNewLanguage(cat === "Code" ? "javascript" : "markdown");
    setNewTitle("");
    setNewContent("");
    setEditorMode("Edit");
    setEditingArtifactId(null);
    setIsDiscardConfirmationOpen(false);
    setArtifactError("");
    setIsCreateOpen(true);
  };

  const handleDuplicate = (artifact: ArtifactItem) => {
    setNewTitle(`${artifact.title} (copy)`);
    setNewCategory(artifact.category);
    setNewLanguage(artifact.language || (artifact.category === "Code" ? "javascript" : "markdown"));
    setNewContent(artifact.content);
    setEditorMode("Edit");
    setEditingArtifactId(null);
    setIsDiscardConfirmationOpen(false);
    setSelectedArtifact(null);
    setArtifactError("");
    setIsCreateOpen(true);
  };

  const handleToggleFavorite = async (artifact: ArtifactItem) => {
    setOrganizationSavingId(artifact.id);
    try {
      const updated = await updateOrganization(artifact.id, { isFavorite: !artifact.isFavorite });
      setSelectedArtifact((current) => (current?.id === artifact.id ? updated : current));
      setArtifactNotice(updated.isFavorite ? "Added to favorites" : "Removed from favorites");
    } catch (error) {
      setArtifactError(error instanceof Error ? error.message : "Could not update favorite.");
    } finally {
      setOrganizationSavingId(null);
    }
  };

  const handleSaveOrganization = async () => {
    if (!selectedArtifact) return;
    const tags = [
      ...new Set(
        tagsDraft
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      ),
    ].slice(0, 12);
    if (
      tagsDraft
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean).length > 12
    ) {
      setArtifactError("Use up to 12 tags per artifact.");
      return;
    }
    if (tags.some((tag) => tag.length > 32)) {
      setArtifactError("Each tag must be 32 characters or fewer.");
      return;
    }
    setOrganizationSavingId(selectedArtifact.id);
    try {
      const updated = await updateOrganization(selectedArtifact.id, {
        collection: collectionDraft.trim() || null,
        tags,
      });
      setSelectedArtifact(updated);
      setIsOrganizationEditorOpen(false);
      setArtifactNotice("Organization saved");
      setArtifactError("");
    } catch (error) {
      setArtifactError(error instanceof Error ? error.message : "Could not save organization.");
    } finally {
      setOrganizationSavingId(null);
    }
  };

  const handleImportArtifacts = async (file: File) => {
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const fileInfo = isPdf
      ? { category: "Documents" as const, language: "markdown" }
      : getArtifactFileInfo(file.name);
    if (!fileInfo) {
      setArtifactError("Choose a PDF, Markdown, text, or supported source-code file.");
      return;
    }

    let content: string;
    let importNotice = `Imported ${file.name}`;
    if (isPdf) {
      const extracted = await extractPdfText(file);
      content = extracted.content;
      if (extracted.truncated) {
        importNotice +=
          extracted.pagesImported < extracted.totalPages
            ? ` (first ${extracted.pagesImported} pages)`
            : " (text shortened to fit the artifact limit)";
      }
    } else {
      if (file.size > 200_000) {
        setArtifactError("This file is larger than the 200 KB artifact limit.");
        return;
      }
      content = await file.text();
    }

    if (!content.trim()) {
      setArtifactError("This file is empty.");
      return;
    }
    const saved = await addArtifact({
      title:
        file.name
          .replace(/\.[^.]+$/, "")
          .replace(/_/g, " ")
          .replace(/\s+/g, " ")
          .trim() || "Imported artifact",
      category: fileInfo.category,
      language: fileInfo.language,
      content,
      isShared: false,
    });
    setSelectedArtifact(saved);
    setArtifactNotice(importNotice);
    setArtifactError("");
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const item = {
        title: newTitle.trim(),
        category: newCategory,
        content: newContent,
        language: newLanguage,
        isShared: editingArtifactId
          ? Boolean(artifacts.find((artifact) => artifact.id === editingArtifactId)?.isShared)
          : false,
      };
      const saved = editingArtifactId
        ? await updateArtifact(editingArtifactId, item)
        : await addArtifact(item);
      window.localStorage.removeItem(artifactDraftKey(user?.uid, editingArtifactId));
      setIsCreateOpen(false);
      setSelectedArtifact(saved);
      setEditingArtifactId(null);
      setArtifactVersions([]);
      setIsHistoryVisible(false);
      setArtifactError("");
      setArtifactNotice(editingArtifactId ? "Artifact saved" : "Artifact created");
    } catch (error) {
      setArtifactError(error instanceof Error ? error.message : "Could not save artifact.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportArtifact = (artifact: ArtifactItem) => {
    const blob = new Blob([artifact.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeTitle = artifact.title.replace(/[\\/:*?"<>|]+/g, "-") || "artifact";
    link.download = `${safeTitle}.${getArtifactExtension(artifact.category, artifact.language)}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  };

  const handleShowHistory = async () => {
    if (isLoadingHistory) return;
    if (isHistoryVisible) {
      setIsHistoryVisible(false);
      return;
    }
    setIsLoadingHistory(true);
    try {
      if (!selectedArtifact) return;
      setArtifactVersions(await getVersions(selectedArtifact.id));
      setIsHistoryVisible(true);
      setArtifactError("");
    } catch (error) {
      setArtifactError(error instanceof Error ? error.message : "Could not load artifact history.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full bg-[#fcfcfb] flex flex-col font-sans overflow-y-auto">
      <div className="w-full px-6 sm:px-8 md:px-10 lg:px-12 pb-12 pt-7 md:pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[28px] font-normal tracking-tight text-neutral-900 md:text-[30px]">
              Artifacts
            </h1>
            {!loading && filteredArtifacts.length > 0 && (
              <p aria-live="polite" className="mt-1 text-sm text-neutral-500">
                {filteredArtifacts.length}{" "}
                {filteredArtifacts.length === 1 ? "artifact" : "artifacts"}
              </p>
            )}
          </div>
        </div>

        <input
          ref={artifactFileInputRef}
          type="file"
          accept=".pdf,application/pdf,.md,.markdown,.txt,.js,.jsx,.ts,.tsx,.py,.html,.css,.json,.yaml,.yml,.sh,.sql,.rs,.go,.java,.c,.cpp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file)
              void handleImportArtifacts(file).catch((error) =>
                setArtifactError(
                  error instanceof Error ? error.message : "Could not import this file."
                )
              );
            event.currentTarget.value = "";
          }}
        />
        <div
          className={`relative mt-5 flex w-full flex-wrap items-center justify-between gap-3 border-b border-neutral-200/70 pb-3 md:mt-6 ${isCreateMenuOpen ? "z-30" : "z-0"}`}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <div
              role="group"
              aria-label="Filter by artifact type"
              className="flex items-center gap-1"
            >
              {(["All", "Code", "Documents"] as ArtifactCategory[]).map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    aria-pressed={isActive}
                    className={`text-[13.5px] transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#f0eee8] text-neutral-900 font-medium px-3 py-1 rounded-lg"
                        : "text-neutral-500 hover:text-neutral-800 font-normal px-2.5 py-1 rounded-lg"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center justify-end gap-2.5 sm:w-auto">
            {showEmptyLibrary ? (
              <button
                type="button"
                onClick={() => artifactFileInputRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
              >
                <Upload size={14} /> Import
              </button>
            ) : (
              <>
                <div className="relative flex min-w-0 flex-1 items-center sm:flex-none">
                  <button
                    type="button"
                    aria-label="Focus artifact search"
                    onClick={() => searchInputRef.current?.focus()}
                    className="absolute left-1 inline-flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                  >
                    <Search size={14} />
                  </button>
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search artifacts"
                    aria-keyshortcuts="Control+K Meta+K"
                    placeholder="Search titles and content"
                    className="h-9 w-full rounded-xl border border-transparent bg-neutral-50 pl-8 pr-10 text-[13px] text-neutral-900 outline-none placeholder:text-neutral-500 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 sm:w-60 md:w-64"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => artifactFileInputRef.current?.click()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
                >
                  <Upload size={14} /> Import
                </button>
                <div ref={createMenuRef} className="relative">
                  <button
                    ref={createMenuTriggerRef}
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={isCreateMenuOpen}
                    aria-controls="artifact-create-menu"
                    onClick={() => setIsCreateMenuOpen((open) => !open)}
                    className="inline-flex h-10 items-center gap-2.5 rounded-xl bg-neutral-950 px-4 text-[13px] font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
                  >
                    <Plus size={16} strokeWidth={2} />
                    <span>New artifact</span>
                    <ChevronDown
                      size={14}
                      className={`ml-0.5 transition-transform duration-150 ${isCreateMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isCreateMenuOpen && (
                    <div
                      id="artifact-create-menu"
                      role="group"
                      aria-label="Create an artifact"
                      className="absolute right-0 top-[calc(100%+10px)] z-40 w-56 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-[0_14px_36px_rgba(15,23,42,0.12)]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateMenuOpen(false);
                          handleOpenCreate("Documents");
                        }}
                        className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium text-neutral-800 focus-visible:bg-neutral-50 focus-visible:outline-none"
                      >
                        <span className="flex size-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                          <FileText size={16} />
                        </span>
                        New document
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateMenuOpen(false);
                          handleOpenCreate("Code");
                        }}
                        className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium text-neutral-800 focus-visible:bg-neutral-50 focus-visible:outline-none"
                      >
                        <span className="flex size-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                          <Code2 size={16} />
                        </span>
                        Code artifact
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {!showEmptyLibrary && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-start gap-3">
              <div ref={sortMenuRef} className="flex flex-col items-start">
                <button
                  ref={sortMenuTriggerRef}
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={isSortMenuOpen}
                  aria-controls="artifact-sort-menu"
                  onClick={() => setIsSortMenuOpen((open) => !open)}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                >
                  <span className="text-neutral-500">Sort:</span>
                  <span>
                    {sortBy === "updated"
                      ? "Recently updated"
                      : sortBy === "created"
                        ? "Recently created"
                        : "Title A–Z"}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className={`shrink-0 text-neutral-400 transition-transform duration-150 ${isSortMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isSortMenuOpen && (
                  <div
                    id="artifact-sort-menu"
                    role="group"
                    aria-label="Sort artifacts"
                    className="mt-2 w-52 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
                  >
                    {(
                      [
                        ["updated", "Recently updated"],
                        ["created", "Recently created"],
                        ["title", "Title A–Z"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={sortBy === value}
                        onClick={() => {
                          setSortBy(value);
                          setIsSortMenuOpen(false);
                          sortMenuTriggerRef.current?.focus();
                        }}
                        className={`flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-xs transition-colors ${sortBy === value ? "bg-[#f0eee8] font-medium text-neutral-900" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"}`}
                      >
                        {label}
                        {sortBy === value && <Check size={14} className="text-neutral-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-pressed={favoriteOnly}
                onClick={() => setFavoriteOnly((value) => !value)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs transition-colors duration-150 ${favoriteOnly ? "bg-[#f0eee8] font-medium text-[#66563e]" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                <Star size={13} fill={favoriteOnly ? "currentColor" : "none"} /> Favorites
              </button>
              {availableCollections.length > 0 && (
                <div
                  role="group"
                  aria-label="Filter by collection"
                  className="flex max-w-full items-center gap-1.5 overflow-x-auto py-1"
                >
                  <span className="shrink-0 px-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                    Collection
                  </span>
                  <button
                    type="button"
                    aria-pressed={!collectionFilter}
                    onClick={() => setCollectionFilter("")}
                    className={`shrink-0 rounded-full px-2.5 py-1.5 text-xs transition-colors ${!collectionFilter ? "bg-[#f0eee8] font-medium text-[#66563e]" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
                  >
                    All
                  </button>
                  {availableCollections.map((collection) => (
                    <button
                      key={collection}
                      type="button"
                      aria-pressed={collectionFilter === collection}
                      onClick={() =>
                        setCollectionFilter(collectionFilter === collection ? "" : collection)
                      }
                      className={`max-w-40 truncate shrink-0 rounded-full px-2.5 py-1.5 text-xs transition-colors ${collectionFilter === collection ? "bg-[#f0eee8] font-medium text-[#66563e]" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
                    >
                      {collection}
                    </button>
                  ))}
                </div>
              )}
              {availableTags.length > 0 && (
                <div
                  role="group"
                  aria-label="Filter by tag"
                  className="flex max-w-full items-center gap-1.5 overflow-x-auto py-1"
                >
                  <span className="shrink-0 px-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                    Tag
                  </span>
                  <button
                    type="button"
                    aria-pressed={!tagFilter}
                    onClick={() => setTagFilter("")}
                    className={`shrink-0 rounded-full px-2.5 py-1.5 text-xs transition-colors ${!tagFilter ? "bg-[#f0eee8] font-medium text-[#66563e]" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
                  >
                    All
                  </button>
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={tagFilter === tag}
                      onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
                      className={`max-w-32 truncate shrink-0 rounded-full px-2.5 py-1.5 text-xs transition-colors ${tagFilter === tag ? "bg-[#f0eee8] font-medium text-[#66563e]" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {artifactNotice && (
          <p role="status" aria-live="polite" className="mt-3 text-xs text-emerald-700">
            {artifactNotice}
          </p>
        )}

        {/* Artifacts Grid */}
        {syncError && (
          <div
            role="alert"
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e8dfce] bg-[#f8f5ee] px-4 py-3 text-sm text-[#5f5138]"
          >
            <p>{syncError}</p>
            <button
              type="button"
              onClick={retrySync}
              className="shrink-0 rounded-lg border border-[#ded3bd] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#51452f] hover:bg-white"
            >
              Retry sync
            </button>
          </div>
        )}
        {artifactError && !selectedArtifact && !isCreateOpen && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {artifactError}
          </p>
        )}
        {loading && artifacts.length === 0 && (
          <div
            role="status"
            aria-label="Loading artifacts"
            className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className="h-48 animate-pulse rounded-2xl border border-[#eeece7] bg-[#faf9f6] p-5"
              >
                <div className="h-4 w-2/5 rounded bg-neutral-200" />
                <div className="mt-3 h-3 w-1/4 rounded bg-neutral-100" />
                <div className="mt-6 space-y-2">
                  <div className="h-3 w-full rounded bg-neutral-100" />
                  <div className="h-3 w-4/5 rounded bg-neutral-100" />
                  <div className="h-3 w-3/5 rounded bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredArtifacts.map((art) => {
            const preview = artifactCardPreview(art);
            const displayTitle = presentArtifactTitle(art.title);
            return (
              <article
                key={art.id}
                className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white"
              >
                <button
                  type="button"
                  onClick={() => {
                    setArtifactError("");
                    setArtifactVersions([]);
                    setIsHistoryVisible(false);
                    setCompareVersion(null);
                    setIsOrganizationEditorOpen(false);
                    setSelectedArtifact(art);
                  }}
                  className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-500"
                  aria-label={`Open ${displayTitle}`}
                >
                  <div className="flex min-h-[176px] flex-col p-4">
                    <div className="flex items-center justify-between gap-3 pr-10">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${art.category === "Code" ? "bg-[#f0eee8] text-[#66563e]" : "bg-[#f4f1e9] text-[#756344]"}`}
                        >
                          {art.category === "Code" ? <Code2 size={17} /> : <FileText size={17} />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-neutral-950">
                            {displayTitle}
                          </h3>
                          <p className="mt-1 text-xs text-neutral-500">
                            {preview.label ||
                              (art.category === "Code" ? art.language || "Code" : "Document")}
                            {art.isShared ? " · Shared" : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`mt-3 h-[68px] overflow-hidden rounded-xl border px-3.5 py-3 ${art.category === "Code" ? "border-[#e7e5df] bg-[#faf9f6] text-[#4b463f]" : "border-neutral-100 bg-[#faf9f6] text-neutral-600"}`}
                    >
                      {preview.label && (
                        <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                          First page
                        </div>
                      )}
                      <pre
                        className={`line-clamp-2 whitespace-pre-wrap break-words text-[13px] leading-[1.6] ${art.category === "Code" ? "font-mono text-[#4b463f]" : "font-sans"}`}
                      >
                        {preview.content || "No text preview available"}
                      </pre>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                      <span>{formatUpdatedAt(art.updatedAt)}</span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-neutral-800">
                        Open <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </div>
                </button>
                {art.isOwner !== false && (
                  <button
                    type="button"
                    aria-label={
                      art.isFavorite
                        ? `Remove ${art.title} from favorites`
                        : `Add ${art.title} to favorites`
                    }
                    title={art.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    disabled={organizationSavingId === art.id}
                    aria-pressed={Boolean(art.isFavorite)}
                    onClick={() => void handleToggleFavorite(art)}
                    className={`absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-transparent disabled:opacity-50 ${art.isFavorite ? "text-[#8a6b3e]" : "text-neutral-400"}`}
                  >
                    <Star size={15} fill={art.isFavorite ? "currentColor" : "none"} />
                  </button>
                )}
              </article>
            );
          })}
        </div>
        {!loading && filteredArtifacts.length === 0 && (
          <div className="mx-auto mt-16 flex max-w-lg flex-col items-center px-5 py-12 text-center">
            <p
              className={`text-base font-medium text-neutral-900 ${isInitialEmptyState ? "text-lg" : ""}`}
            >
              {searchQuery.trim()
                ? "No matching artifacts"
                : activeCategory !== "All"
                  ? `No ${activeCategory.toLowerCase()} yet`
                  : "Create an artifact"}
            </p>
            {!isInitialEmptyState && (
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                {searchQuery.trim()
                  ? `Nothing matches “${searchQuery.trim()}”. Try a different title or phrase.`
                  : `Your ${activeCategory.toLowerCase()} artifacts will appear here.`}
              </p>
            )}
            {!isInitialEmptyState ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                  setFavoriteOnly(false);
                  setCollectionFilter("");
                  setTagFilter("");
                }}
                className="mt-5 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Clear filters
              </button>
            ) : (
              <div className="mt-5 flex flex-col items-center">
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCreate("Documents")}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
                  >
                    <FileText size={15} /> New document
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCreate("Code")}
                    className="inline-flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
                  >
                    <Code2 size={15} /> Code
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Artifact Modal */}
      {selectedArtifact && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="artifact-preview-title"
          onKeyDown={(event) => {
            if (event.key === "Escape") setSelectedArtifact(null);
          }}
          onClick={() => setSelectedArtifact(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[min(88vh,920px)] w-full max-w-6xl flex-col rounded-[28px] border border-neutral-200/70 bg-white p-5 shadow-[0_28px_90px_rgba(0,0,0,0.22)] md:p-7"
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h2
                  id="artifact-preview-title"
                  className="max-w-[min(70vw,760px)] truncate text-[19px] font-semibold tracking-[-0.02em] text-neutral-950"
                >
                  {presentArtifactTitle(selectedArtifact.title)}
                </h2>
                <span className="mt-1 block text-[12px] text-neutral-500">
                  {selectedArtifact.isOwner === false
                    ? "Shared with you · Read only"
                    : `${selectedArtifact.category === "Documents" ? "Document" : "Code"} · ${formatUpdatedAt(selectedArtifact.updatedAt)}`}
                </span>
              </div>
              <button
                type="button"
                aria-label="Close artifact preview"
                onClick={() => setSelectedArtifact(null)}
                className="flex size-9 items-center justify-center rounded-full text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 hover:bg-neutral-100 hover:text-neutral-950"
              >
                <X size={16} />
              </button>
            </div>

            <div
              className={`my-5 min-h-0 select-text ${selectedArtifact.category === "Code" ? "overflow-hidden" : "max-h-[min(60vh,560px)] overflow-y-auto"}`}
              style={
                selectedArtifact.category === "Code"
                  ? {
                      height: `${Math.min(560, Math.max(240, selectedArtifact.content.split("\n").length * 24 + 88))}px`,
                      maxHeight: "min(56vh, 560px)",
                    }
                  : undefined
              }
            >
              <ArtifactContentView
                category={selectedArtifact.category}
                content={selectedArtifact.content}
                language={selectedArtifact.language}
              />
            </div>

            {isOrganizationEditorOpen && selectedArtifact.isOwner !== false && (
              <div className="mb-4 grid gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label className="grid gap-1.5 text-xs font-medium text-neutral-600">
                  Collection
                  <input
                    maxLength={80}
                    value={collectionDraft}
                    onChange={(event) => setCollectionDraft(event.target.value)}
                    placeholder="e.g. Biology revision"
                    className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-neutral-600">
                  Tags{" "}
                  <span className="font-normal text-neutral-400">Comma separated, up to 12</span>
                  <input
                    maxLength={400}
                    value={tagsDraft}
                    onChange={(event) => setTagsDraft(event.target.value)}
                    placeholder="exam, chapter 4, review"
                    className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                </label>
                <button
                  type="button"
                  disabled={organizationSavingId === selectedArtifact.id}
                  onClick={() => void handleSaveOrganization()}
                  className="h-10 rounded-xl bg-neutral-950 px-4 text-xs font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {organizationSavingId === selectedArtifact.id ? "Saving…" : "Save"}
                </button>
              </div>
            )}

            {compareVersion && (
              <div className="mb-4 max-h-64 overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-neutral-700">
                    Current version compared with{" "}
                    {new Date(compareVersion.updatedAt).toLocaleString()}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCompareVersion(null)}
                    className="text-xs text-neutral-500 hover:text-neutral-900"
                  >
                    Close comparison
                  </button>
                </div>
                {(() => {
                  const diff = diffArtifactContent(
                    compareVersion.content,
                    selectedArtifact.content
                  );
                  return diff.tooLarge ? (
                    <p className="text-xs text-neutral-500">
                      This artifact is too large for an in-place comparison. Restore or export
                      either version to review it.
                    </p>
                  ) : (
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-5">
                      {diff.lines.map((line, index) => (
                        <span
                          key={`${index}-${line.kind}`}
                          className={
                            line.kind === "added"
                              ? "block bg-emerald-100 text-emerald-900"
                              : line.kind === "removed"
                                ? "block bg-rose-100 text-rose-900"
                                : "block text-neutral-600"
                          }
                        >
                          {line.kind === "added" ? "+ " : line.kind === "removed" ? "− " : "  "}
                          {line.text || " "}
                        </span>
                      ))}
                    </pre>
                  );
                })()}
              </div>
            )}

            {isHistoryVisible && (
              <div className="max-h-40 overflow-y-auto rounded-xl border border-neutral-200 p-3">
                {artifactVersions.length === 0 ? (
                  <p className="text-xs text-neutral-500">No earlier versions yet.</p>
                ) : (
                  artifactVersions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between gap-3 border-b border-neutral-100 py-2 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-neutral-800">
                          {version.title}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {new Date(version.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCompareVersion(version)}
                        className="shrink-0 rounded-lg border border-neutral-200 px-2 py-1 text-[11px] text-neutral-700 hover:bg-neutral-50"
                      >
                        Compare
                      </button>
                      {selectedArtifact.isOwner !== false && (
                        <button
                          type="button"
                          disabled={restoringVersionId === version.id}
                          onClick={async () => {
                            if (restoringVersionId) return;
                            setRestoringVersionId(version.id);
                            try {
                              const restored = await updateArtifact(selectedArtifact.id, {
                                title: version.title,
                                category: version.category,
                                content: version.content,
                                language: version.language,
                                modelUsed: version.modelUsed,
                                isShared: Boolean(selectedArtifact.isShared),
                              });
                              setSelectedArtifact(restored);
                              setArtifactVersions(await getVersions(restored.id));
                            } catch (error) {
                              setArtifactError(
                                error instanceof Error
                                  ? error.message
                                  : "Could not restore this version."
                              );
                            } finally {
                              setRestoringVersionId(null);
                            }
                          }}
                          className="shrink-0 rounded-lg border border-neutral-200 px-2 py-1 text-[11px] hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-60"
                        >
                          {restoringVersionId === version.id ? "Restoring…" : "Restore"}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {artifactError && (
              <p role="alert" className="text-xs text-rose-600">
                {artifactError}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1.5 border-t border-neutral-100 pt-4">
              {selectedArtifact.isOwner !== false && (
                <>
                  <button
                    type="button"
                    disabled={organizationSavingId === selectedArtifact.id}
                    onClick={() => void handleToggleFavorite(selectedArtifact)}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-[12.5px] font-medium transition-colors ${selectedArtifact.isFavorite ? "bg-[#f3f0e8] text-[#756344]" : "bg-neutral-100/70 text-neutral-700 hover:bg-neutral-100"}`}
                  >
                    <Star size={13} fill={selectedArtifact.isFavorite ? "currentColor" : "none"} />
                    {selectedArtifact.isFavorite ? "Favorited" : "Favorite"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCollectionDraft(selectedArtifact.collection ?? "");
                      setTagsDraft((selectedArtifact.tags ?? []).join(", "));
                      setIsOrganizationEditorOpen((open) => !open);
                    }}
                    aria-expanded={isOrganizationEditorOpen}
                    className={`inline-flex min-h-10 items-center rounded-xl px-3.5 text-[12.5px] font-medium transition-colors ${isOrganizationEditorOpen ? "bg-[#f0eee8] text-[#66563e]" : "bg-neutral-100/70 text-neutral-700 hover:bg-neutral-100"}`}
                  >
                    Organize
                  </button>
                </>
              )}
              {selectedArtifact.isOwner !== false && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingArtifactId(selectedArtifact.id);
                    setNewTitle(selectedArtifact.title);
                    setNewCategory(selectedArtifact.category);
                    setNewLanguage(
                      selectedArtifact.language ||
                        (selectedArtifact.category === "Code" ? "javascript" : "markdown")
                    );
                    setNewContent(selectedArtifact.content);
                    setEditorMode("Edit");
                    setIsDiscardConfirmationOpen(false);
                    setArtifactError("");
                    setSelectedArtifact(null);
                    setIsCreateOpen(true);
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-neutral-100/70 px-3.5 text-[12.5px] font-medium text-neutral-800 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                >
                  <Pencil size={13} /> Edit
                </button>
              )}
              <div ref={artifactActionsRef} className="relative">
                <button
                  type="button"
                  aria-expanded={isArtifactActionsOpen}
                  aria-controls="artifact-more-actions"
                  onClick={() => setIsArtifactActionsOpen((open) => !open)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-100/70 px-3 text-[12.5px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                >
                  <MoreHorizontal size={16} /> More
                </button>
                {isArtifactActionsOpen && (
                  <div
                    id="artifact-more-actions"
                    role="group"
                    aria-label="More artifact actions"
                    className="absolute bottom-[calc(100%+8px)] left-0 z-40 w-56 rounded-2xl border border-neutral-200/80 bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)] ring-1 ring-black/5"
                  >
                    {selectedArtifact.isOwner !== false && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsArtifactActionsOpen(false);
                          handleDuplicate(selectedArtifact);
                        }}
                        className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-neutral-700 hover:bg-neutral-50"
                      >
                        <CopyPlus size={15} className="text-neutral-500" /> Duplicate
                      </button>
                    )}
                    {user && selectedArtifact.isOwner !== false && (
                      <button
                        type="button"
                        disabled={isUpdatingShare}
                        onClick={async () => {
                          if (isUpdatingShare) return;
                          setIsArtifactActionsOpen(false);
                          setIsUpdatingShare(true);
                          try {
                            await setShared(selectedArtifact.id, !selectedArtifact.isShared);
                            setSelectedArtifact((current) =>
                              current ? { ...current, isShared: !current.isShared } : null
                            );
                          } catch (error) {
                            setArtifactError(
                              error instanceof Error ? error.message : "Could not update sharing."
                            );
                          } finally {
                            setIsUpdatingShare(false);
                          }
                        }}
                        className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                      >
                        <Share2 size={15} className="text-neutral-500" />{" "}
                        {selectedArtifact.isShared ? "Stop sharing" : "Share with signed-in users"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsArtifactActionsOpen(false);
                        exportArtifact(selectedArtifact);
                      }}
                      className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-neutral-700 hover:bg-neutral-50"
                    >
                      <Download size={15} className="text-neutral-500" /> Export
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsArtifactActionsOpen(false);
                        handleCopy(selectedArtifact.id, selectedArtifact.content);
                      }}
                      className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-neutral-700 hover:bg-neutral-50"
                    >
                      {copiedId === selectedArtifact.id ? (
                        <Check size={15} className="text-neutral-500" />
                      ) : (
                        <Copy size={15} className="text-neutral-500" />
                      )}
                      {copiedId === selectedArtifact.id ? "Copied" : "Copy content"}
                    </button>
                    {selectedArtifact.isOwner !== false && (
                      <button
                        type="button"
                        disabled={isLoadingHistory}
                        onClick={() => {
                          setIsArtifactActionsOpen(false);
                          if (isHistoryVisible) setIsHistoryVisible(false);
                          else void handleShowHistory();
                        }}
                        className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                      >
                        <ArchiveRestore size={15} className="text-neutral-500" /> Version history
                      </button>
                    )}
                    {selectedArtifact.isOwner !== false && (
                      <>
                        <div className="my-1 border-t border-neutral-100" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsArtifactActionsOpen(false);
                            setDeleteError("");
                            setDeleteTarget(selectedArtifact);
                          }}
                          className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={15} /> Delete artifact
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {onNavigateToChat && (
                <button
                  type="button"
                  onClick={() => {
                    const prompt = artifactChatPrompt(
                      selectedArtifact.title,
                      selectedArtifact.content
                    );
                    setSelectedArtifact(null);
                    onNavigateToChat(prompt);
                  }}
                  className="ml-auto inline-flex min-h-10 items-center rounded-xl bg-neutral-950 px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
                >
                  Continue in Chat
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-artifact-title"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !isDeleting) setDeleteTarget(null);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl">
            <h2 id="delete-artifact-title" className="text-base font-semibold text-neutral-900">
              Delete this artifact?
            </h2>
            <p className="mt-2 break-words text-sm text-neutral-600">
              “{deleteTarget.title}” will be removed from your library.
              {deleteTarget.isShared ? " Anyone it was shared with will lose access." : ""}
            </p>
            {deleteError && (
              <p role="alert" className="mt-3 text-sm text-rose-600">
                {deleteError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-xl border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (isDeleting) return;
                  setIsDeleting(true);
                  try {
                    await removeArtifact(deleteTarget.id);
                    if (selectedArtifact?.id === deleteTarget.id) setSelectedArtifact(null);
                    setDeleteTarget(null);
                    setDeleteError("");
                  } catch (error) {
                    setDeleteError(
                      error instanceof Error ? error.message : "Could not delete artifact."
                    );
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isDeleting ? "Deleting…" : "Delete artifact"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Artifact Modal */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="artifact-editor-title"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              requestCloseEditor();
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateSubmit}
            className="flex max-h-[min(90vh,960px)] w-full max-w-6xl flex-col gap-4 overflow-y-auto rounded-[28px] border border-neutral-200/70 bg-white p-5 shadow-[0_28px_90px_rgba(0,0,0,0.22)] md:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="artifact-editor-title"
                  className="text-[18px] font-semibold text-neutral-900"
                >
                  {editingArtifactId ? "Edit artifact" : "Create artifact"}
                </h2>
              </div>
              <div className="flex shrink-0 items-start gap-2">
                {recoveredDraft && (
                  <div
                    ref={recoveredDraftMenuRef}
                    className="flex flex-col items-end"
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        event.stopPropagation();
                        setIsRecoveredDraftMenuOpen(false);
                        recoveredDraftTriggerRef.current?.focus();
                      }
                    }}
                  >
                    <button
                      ref={recoveredDraftTriggerRef}
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={isRecoveredDraftMenuOpen}
                      aria-controls="artifact-recovered-draft-menu"
                      onClick={() => setIsRecoveredDraftMenuOpen((open) => !open)}
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                    >
                      <ArchiveRestore size={14} className="text-neutral-500" />
                      Saved draft
                      <ChevronDown
                        size={14}
                        className={`text-neutral-400 transition-transform ${isRecoveredDraftMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isRecoveredDraftMenuOpen && (
                      <div
                        id="artifact-recovered-draft-menu"
                        role="group"
                        aria-label="Saved draft actions"
                        className="mt-2 w-60 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(48,40,30,0.14)]"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setNewTitle(recoveredDraft.title);
                            setNewCategory(recoveredDraft.category);
                            setNewLanguage(recoveredDraft.language);
                            setNewContent(recoveredDraft.content);
                            setRecoveredDraft(null);
                            setIsRecoveredDraftMenuOpen(false);
                          }}
                          className="flex h-9 w-full items-center rounded-lg px-2.5 text-left text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                        >
                          Recover draft
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            window.localStorage.removeItem(
                              artifactDraftKey(user?.uid, editingArtifactId)
                            );
                            setRecoveredDraft(null);
                            setIsRecoveredDraftMenuOpen(false);
                          }}
                          className="flex h-9 w-full items-center rounded-lg px-2.5 text-left text-xs text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                        >
                          Discard draft
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  aria-label="Close artifact editor"
                  onClick={requestCloseEditor}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <label htmlFor="artifact-title" className="sr-only">
              Artifact title
            </label>
            <input
              id="artifact-title"
              type="text"
              required
              maxLength={300}
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Artifact title..."
              className="h-12 w-full shrink-0 rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 text-[14px] text-neutral-900 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-100"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                className="inline-flex rounded-xl bg-neutral-100 p-1"
                role="group"
                aria-label="Artifact type"
              >
                {(["Documents", "Code"] as const).map((category) => (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={newCategory === category}
                    onClick={() => {
                      setNewCategory(category);
                      setNewLanguage(category === "Code" ? "javascript" : "markdown");
                    }}
                    className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors ${newCategory === category ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-900"}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="inline-flex rounded-xl bg-neutral-100 p-1" aria-label="Editor view">
                {(["Edit", "Preview"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={editorMode === mode}
                    onClick={() => setEditorMode(mode)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors ${editorMode === mode ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-900"}`}
                  >
                    {mode === "Edit" ? <Code size={14} /> : <Eye size={14} />}
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid min-h-[min(36vh,360px)] grid-cols-1 gap-4 pb-4">
              {editorMode !== "Preview" && newCategory === "Code" && (
                <ArtifactCodeEditor
                  title={newTitle}
                  language={newLanguage}
                  content={newContent}
                  onLanguageChange={setNewLanguage}
                  onContentChange={setNewContent}
                />
              )}
              {editorMode !== "Preview" && newCategory === "Documents" && (
                <div className="min-h-[320px]">
                  <label
                    htmlFor="artifact-content"
                    className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-[#756f66]"
                  >
                    <span>Content</span>
                    <span>{newContent.length.toLocaleString()} / 200,000</span>
                  </label>
                  <textarea
                    id="artifact-content"
                    rows={16}
                    required
                    maxLength={200_000}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Write Markdown or notes..."
                    className="h-[min(36vh,360px)] min-h-[320px] w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50/40 px-4 py-4 font-mono text-[13px] leading-6 text-neutral-900 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-100"
                  />
                </div>
              )}
              {editorMode !== "Edit" && (
                <div className="min-h-[320px]">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#756f66]">
                    {newCategory === "Code" && newLanguage.toLowerCase() === "html"
                      ? "Isolated preview"
                      : "Preview"}
                  </p>
                  <div
                    className={`h-[min(36vh,360px)] min-h-[320px] overflow-hidden ${newCategory === "Documents" ? "rounded-2xl border border-neutral-200 bg-white p-1" : ""}`}
                  >
                    <ArtifactContentView
                      category={newCategory}
                      content={newContent}
                      language={newLanguage}
                    />
                  </div>
                </div>
              )}
            </div>

            {artifactError && (
              <p role="alert" className="text-xs text-rose-600">
                {artifactError}
              </p>
            )}

            <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-end gap-3 border-t border-neutral-100 bg-white/95 px-5 py-4 backdrop-blur md:-mx-7 md:-mb-7 md:px-7">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={requestCloseEditor}
                  className="h-10 rounded-xl px-4 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newTitle.trim() || !newContent.trim()}
                  className="h-10 rounded-xl bg-neutral-950 px-4 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
                >
                  {isSaving ? "Saving…" : editingArtifactId ? "Save changes" : "Save artifact"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {isDiscardConfirmationOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="discard-artifact-title"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setIsDiscardConfirmationOpen(false);
            }
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl">
            <h2 id="discard-artifact-title" className="text-base font-semibold text-neutral-900">
              Discard unsaved changes?
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Your edits will be lost if you leave the editor now.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDiscardConfirmationOpen(false)}
                className="rounded-xl border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDiscardConfirmationOpen(false);
                  window.localStorage.removeItem(artifactDraftKey(user?.uid, editingArtifactId));
                  setIsCreateOpen(false);
                  setEditingArtifactId(null);
                }}
                className="rounded-xl bg-neutral-950 px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Discard changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtifactsScreen;
