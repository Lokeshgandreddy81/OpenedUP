import React, { useState } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  Code2,
  FileText,
  Copy,
  Check,
  Trash2,
  ArrowUpRight,
  X,
  Pencil,
  Download,
} from "lucide-react";
import {
  useArtifacts,
  type ArtifactItem,
  type ArtifactVersion,
} from "../services/artifactStore";
import { useChatAuth } from "../../../app/auth/ChatAuthContext";

export type ArtifactCategory = "All" | "Code" | "Documents";
export type ArtifactSubTab = "Yours" | "Shared";

export interface ArtifactsScreenProps {
  onNavigateToChat?: (prompt?: string) => void;
}

const SlidersFilterIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 15,
  className = "text-neutral-800",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="3" y1="2" x2="3" y2="14" />
    <circle cx="3" cy="5" r="1.8" fill="white" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="2" x2="8" y2="14" />
    <circle cx="8" cy="11" r="1.8" fill="white" stroke="currentColor" strokeWidth="1.5" />
    <line x1="13" y1="2" x2="13" y2="14" />
    <circle cx="13" cy="7" r="1.8" fill="white" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const ArtifactsScreen: React.FC<ArtifactsScreenProps> = ({ onNavigateToChat }) => {
  const [activeCategory, setActiveCategory] = useState<ArtifactCategory>("All");
  const [subTab, setSubTab] = useState<ArtifactSubTab>("Yours");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const {
    artifacts,
    loading,
    error: syncError,
    addArtifact,
    updateArtifact,
    getVersions,
    removeArtifact,
    setShared,
  } = useArtifacts();
  const { user, signIn } = useChatAuth();
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"Code" | "Documents">("Documents");
  const [newContent, setNewContent] = useState("");
  const [editingArtifactId, setEditingArtifactId] = useState<string | null>(null);
  const [artifactError, setArtifactError] = useState("");
  const [artifactVersions, setArtifactVersions] = useState<ArtifactVersion[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  const filteredArtifacts = artifacts.filter((art) => {
    if (activeCategory !== "All" && art.category !== activeCategory) return false;
    if (subTab === "Yours" && art.isOwner === false) return false;
    if (subTab === "Shared" && !art.isShared) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      art.title.toLowerCase().includes(q) ||
      art.content.toLowerCase().includes(q) ||
      (art.modelUsed && art.modelUsed.toLowerCase().includes(q))
    );
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const handleOpenCreate = (cat: "Code" | "Documents") => {
    setIsAddMenuOpen(false);
    setNewCategory(cat);
    setNewTitle("");
    setNewContent("");
    setEditingArtifactId(null);
    setArtifactError("");
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subTab === "Shared" && !user) {
      void signIn();
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const item = {
        title: newTitle.trim(),
        category: newCategory,
        content: newContent,
        language: newCategory === "Code" ? "typescript" : "markdown",
        modelUsed: "Manual BYOK",
        isShared: editingArtifactId
          ? Boolean(artifacts.find((artifact) => artifact.id === editingArtifactId)?.isShared)
          : subTab === "Shared",
      };
      const saved = editingArtifactId
        ? await updateArtifact(editingArtifactId, item)
        : await addArtifact(item);
      setIsCreateOpen(false);
      setSelectedArtifact(saved);
      setEditingArtifactId(null);
    } catch (error) {
      setArtifactError(error instanceof Error ? error.message : "Could not save artifact.");
    }
  };

  const exportArtifact = (artifact: ArtifactItem) => {
    const blob = new Blob([artifact.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeTitle = artifact.title.replace(/[\\/:*?"<>|]+/g, "-") || "artifact";
    link.download = `${safeTitle}${artifact.category === "Code" ? ".ts" : ".md"}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleShowHistory = async () => {
    if (isHistoryVisible) {
      setIsHistoryVisible(false);
      return;
    }
    try {
      setArtifactVersions(await getVersions(selectedArtifact!.id));
      setIsHistoryVisible(true);
      setArtifactError("");
    } catch (error) {
      setArtifactError(error instanceof Error ? error.message : "Could not load artifact history.");
    }
  };

  return (
    <div className="flex-1 w-full h-full bg-white flex flex-col font-sans select-none overflow-y-auto">
      <div className="w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-7 md:pt-8 pb-12 flex flex-col">
        {/* Title in Editorial Serif font matching Customize */}
        <h1 className="text-[28px] md:text-[30px] font-serif text-neutral-900 font-normal tracking-tight">
          Artifacts
        </h1>

        {/* Navigation & Controls Toolbar spanning full width */}
        <div className="mt-5 md:mt-6 flex flex-wrap items-center justify-between gap-3 w-full">
          {/* Left: Category tabs & segment toggle */}
          <div className="flex items-center gap-2">
            {/* Category tabs: All, Code, Documents */}
            <div className="flex items-center gap-1">
              {(["All", "Code", "Documents"] as ArtifactCategory[]).map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`text-[13.5px] transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#ECECF1] text-neutral-900 font-medium px-3.5 py-1 rounded-lg"
                        : "text-neutral-500 hover:text-neutral-800 font-normal px-2.5 py-1 rounded-lg"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Vertical separator */}
            <div className="w-[1px] h-4 bg-neutral-200 mx-3 shrink-0" />

            {/* Sub-tab segmented control: Yours | Shared */}
            <div className="bg-[#F1F1F4] p-0.5 rounded-lg inline-flex items-center">
              {(["Yours", "Shared"] as ArtifactSubTab[]).map((tab) => {
                const isActive = subTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      if (tab === "Shared" && !user) {
                        void signIn();
                        return;
                      }
                      setSubTab(tab);
                    }}
                    className={`text-[12.5px] transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-neutral-900 font-medium px-3 py-1 rounded-md shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800 font-normal px-2.5 py-1 rounded-md"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Search, Filter icon, + Add button */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search
                size={14}
                className="absolute left-2.5 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artifacts"
                className="h-8 pl-8 pr-3 w-52 sm:w-60 md:w-64 text-[13px] text-neutral-900 placeholder-neutral-400 bg-white border border-neutral-200/90 rounded-lg outline-none focus:border-neutral-400 transition-colors"
              />
            </div>

            {/* Filter Sliders Button */}
            <button
              type="button"
              aria-label="Filter"
              title="Filter"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/80 transition-colors cursor-pointer"
            >
              <SlidersFilterIcon size={15} className="text-neutral-800" />
            </button>

            {/* + Add Button with Chevron Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAddMenuOpen((v) => !v)}
                className="h-8 bg-neutral-950 text-white hover:bg-neutral-800 text-[13px] font-medium px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <Plus size={14} strokeWidth={2} />
                <span>Add</span>
                <ChevronDown size={13} strokeWidth={2} className="text-white/80" />
              </button>

              {isAddMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-neutral-200/80 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-[13px] text-neutral-700 select-none"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenCreate("Documents")}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 hover:text-neutral-950 cursor-pointer"
                  >
                    New document
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCreate("Code")}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 hover:text-neutral-950 cursor-pointer"
                  >
                    New code artifact
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Artifacts Grid */}
        {syncError && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {syncError}
          </p>
        )}
        {loading && (
          <p role="status" className="mt-5 text-sm text-neutral-500">
            Loading your artifacts…
          </p>
        )}
        <div className="mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArtifacts.map((art) => {
            const isCopied = copiedId === art.id;
            return (
              <div
                key={art.id}
                onClick={() => setSelectedArtifact(art)}
                className="group rounded-2xl border border-neutral-200/90 hover:border-neutral-300 bg-white p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-sm cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
                        {art.category === "Code" ? <Code2 size={15} /> : <FileText size={15} />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[14.5px] font-medium text-neutral-900 truncate">
                          {art.title}
                        </h3>
                        <span className="text-[11.5px] text-neutral-400">
                          {art.category} {art.modelUsed ? `· ${art.modelUsed}` : ""}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (art.isOwner === false) return;
                        void removeArtifact(art.id)
                          .then(() => {
                            if (selectedArtifact?.id === art.id) setSelectedArtifact(null);
                          })
                          .catch((error: unknown) =>
                            setArtifactError(
                              error instanceof Error ? error.message : "Could not delete artifact."
                            )
                          );
                      }}
                      title="Delete artifact"
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <pre className="mt-3.5 p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-[11.5px] font-mono text-neutral-600 line-clamp-4 overflow-hidden whitespace-pre-wrap">
                    {art.content}
                  </pre>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[12px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(art.id, art.content);
                    }}
                    className="text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check size={12} className="text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {onNavigateToChat && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToChat(
                          `Analyze and refine this artifact "${art.title}":\n\n${art.content}`
                        );
                      }}
                      className="text-neutral-700 hover:text-black font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open in Chat</span>
                      <ArrowUpRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!loading && filteredArtifacts.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 px-5 py-10 text-center">
            <p className="text-sm font-medium text-neutral-800">No artifacts found</p>
            <p className="mt-1 text-sm text-neutral-500">
              {searchQuery.trim()
                ? "Try a different search."
                : "Saved documents and code artifacts will appear here."}
            </p>
          </div>
        )}
      </div>

      {/* Preview Artifact Modal */}
      {selectedArtifact && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedArtifact(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200/80 p-6 md:p-7 flex flex-col max-h-[82vh]"
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h2 className="text-[18px] font-semibold text-neutral-900">
                  {selectedArtifact.title}
                </h2>
                <span className="text-[12px] text-neutral-400">
                  {selectedArtifact.category} · {selectedArtifact.modelUsed || "BYOK"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArtifact(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <pre className="my-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70 text-[12.5px] font-mono text-neutral-800 overflow-y-auto whitespace-pre-wrap select-text flex-1">
              {selectedArtifact.content}
            </pre>

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
                      {selectedArtifact.isOwner !== false && (
                        <button
                          type="button"
                          onClick={async () => {
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
                            }
                          }}
                          className="shrink-0 rounded-lg border border-neutral-200 px-2 py-1 text-[11px] hover:bg-neutral-50"
                        >
                          Restore
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

            <div className="flex items-center justify-end gap-2.5 pt-2">
              {user && selectedArtifact.isOwner !== false && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await setShared(selectedArtifact.id, !selectedArtifact.isShared);
                      setSelectedArtifact((current) =>
                        current ? { ...current, isShared: !current.isShared } : null
                      );
                    } catch (error) {
                      setArtifactError(
                        error instanceof Error ? error.message : "Could not update sharing."
                      );
                    }
                  }}
                  className="mr-auto px-3.5 py-1.5 rounded-xl border border-neutral-200 text-[12.5px] font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  {selectedArtifact.isShared ? "Stop sharing" : "Share with signed-in users"}
                </button>
              )}
              <button
                type="button"
                onClick={() => exportArtifact(selectedArtifact)}
                className="px-3.5 py-1.5 rounded-xl border border-neutral-200 text-[12.5px] font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Download size={13} /> Export
              </button>
              {selectedArtifact.isOwner !== false && (
                <button
                  type="button"
                  onClick={() => void handleShowHistory()}
                  className="px-3.5 py-1.5 rounded-xl border border-neutral-200 text-[12.5px] font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  {isHistoryVisible ? "Hide history" : "History"}
                </button>
              )}
              {selectedArtifact.isOwner !== false && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingArtifactId(selectedArtifact.id);
                    setNewTitle(selectedArtifact.title);
                    setNewCategory(selectedArtifact.category);
                    setNewContent(selectedArtifact.content);
                    setArtifactError("");
                    setSelectedArtifact(null);
                    setIsCreateOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-neutral-200 text-[12.5px] font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Pencil size={13} /> Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => handleCopy(selectedArtifact.id, selectedArtifact.content)}
                className="px-3.5 py-1.5 rounded-xl border border-neutral-200 text-[12.5px] font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                {copiedId === selectedArtifact.id ? "Copied" : "Copy content"}
              </button>
              {onNavigateToChat && (
                <button
                  type="button"
                  onClick={() => {
                    const prompt = `Refine this artifact "${selectedArtifact.title}":\n\n${selectedArtifact.content}`;
                    setSelectedArtifact(null);
                    onNavigateToChat(prompt);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 text-[12.5px] font-medium cursor-pointer"
                >
                  Continue in Chat
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Artifact Modal */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsCreateOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateSubmit}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200/80 p-6 md:p-7 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-neutral-900">
                {editingArtifactId ? "Edit" : "New"} {newCategory === "Code" ? "Code" : "Document"}{" "}
                Artifact
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <input
              type="text"
              required
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Artifact title..."
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-[13.5px] text-neutral-900 outline-none focus:border-neutral-400"
            />

            <textarea
              rows={7}
              required
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={
                newCategory === "Code" ? "Paste or write code..." : "Write markdown or notes..."
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 font-mono text-[12.5px] text-neutral-900 outline-none focus:border-neutral-400 resize-y"
            />

            {artifactError && (
              <p role="alert" className="text-xs text-rose-600">
                {artifactError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 text-[13px] font-medium cursor-pointer"
              >
                {editingArtifactId ? "Save changes" : "Save Artifact"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ArtifactsScreen;
