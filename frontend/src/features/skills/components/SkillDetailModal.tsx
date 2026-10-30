import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Check, FileCode, Loader2, Wrench, Bot, Copy, Trash2 } from "lucide-react";
import { useChatAuth } from "../../../app/auth/useChatAuth";
import {
  getSkillContents,
  addDirectorySkillToLibrary,
  deleteSkill,
  type SkillContents,
  type SkillItem,
} from "../services/skillsApi";
import {
  formatSkillDescription,
  formatSkillTitle,
  getSkillIcon,
  isBuiltinSkill,
} from "../services/skillPresentation";

interface SkillDetailModalProps {
  skillId: string;
  onClose: () => void;
  onSkillAdded?: (skill: SkillItem) => void;
  onSkillDeleted?: (skillId: string) => void;
  isAlreadyAdded?: boolean;
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  skillId,
  onClose,
  onSkillAdded,
  onSkillDeleted,
  isAlreadyAdded = false,
}) => {
  const { user } = useChatAuth();
  const userId = user?.uid;
  const currentUserIdRef = useRef(userId);
  currentUserIdRef.current = userId;
  const [activeTab, setActiveTab] = useState<"overview" | "contents" | "agents">("overview");
  const [skillDataState, setSkillDataState] = useState<{
    userId: string | undefined;
    skillId: string;
    skill: SkillContents | null;
  }>({ userId, skillId, skill: null });
  const hasCurrentSkillData =
    skillDataState.userId === userId && skillDataState.skillId === skillId;
  const skillData = hasCurrentSkillData ? skillDataState.skill : null;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string>("SKILL.md");
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(isAlreadyAdded);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const visibleError = hasCurrentSkillData ? error : null;
  const visibleIsLoading = !hasCurrentSkillData || isLoading;
  const visibleAdded = hasCurrentSkillData ? added : isAlreadyAdded;
  const visibleIsAdding = hasCurrentSkillData && isAdding;
  const visibleIsDeleting = hasCurrentSkillData && isDeleting;

  const handleDelete = async () => {
    const requestUserId = userId;
    if (
      !confirm(
        `Are you sure you want to delete '${skillData?.name || "this skill"}'? This cannot be undone.`
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteSkill(skillId, requestUserId);
      if (currentUserIdRef.current !== requestUserId) return;
      onSkillDeleted?.(skillId);
      onClose();
    } catch (err) {
      if (currentUserIdRef.current === requestUserId) {
        alert(err instanceof Error ? err.message : "Failed to delete skill");
      }
    } finally {
      if (currentUserIdRef.current === requestUserId) setIsDeleting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const requestUserId = userId;
    setIsLoading(true);
    setError(null);
    setSkillDataState({ userId: requestUserId, skillId, skill: null });
    setAdded(isAlreadyAdded);
    setIsAdding(false);
    setIsDeleting(false);

    getSkillContents(skillId, requestUserId)
      .then((data) => {
        if (!cancelled && currentUserIdRef.current === requestUserId) {
          setSkillDataState({ userId: requestUserId, skillId, skill: data });
          if (data.files && data.files.length > 0) {
            setSelectedFilePath(data.files[0].relativePath);
          }
        }
      })
      .catch((err) => {
        if (!cancelled && currentUserIdRef.current === requestUserId) {
          setError(err instanceof Error ? err.message : "Failed to load skill contents");
        }
      })
      .finally(() => {
        if (!cancelled && currentUserIdRef.current === requestUserId) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAlreadyAdded, skillId, userId]);

  const handleAdd = async () => {
    if (visibleAdded || visibleIsAdding) return;
    const requestUserId = userId;
    setIsAdding(true);
    try {
      const copy = await addDirectorySkillToLibrary(skillId, requestUserId);
      if (currentUserIdRef.current !== requestUserId) return;
      setAdded(true);
      onSkillAdded?.(copy);
    } catch (err) {
      if (currentUserIdRef.current === requestUserId) {
        alert(err instanceof Error ? err.message : "Failed to add to library");
      }
    } finally {
      if (currentUserIdRef.current === requestUserId) setIsAdding(false);
    }
  };

  const selectedFile = skillData?.files.find((file) => file.relativePath === selectedFilePath);

  const handleCopyContent = () => {
    if (!selectedFile?.content) return;
    void navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 backdrop-blur-xs p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-3xl shadow-[0_30px_90px_-20px_rgba(0,0,0,0.3)] w-full max-w-5xl h-[86vh] max-h-[860px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 border border-neutral-200/50">
        {/* Header */}
        <div className="p-6 sm:p-7 pb-4 flex items-start justify-between gap-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-4 sm:gap-4.5 min-w-0">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-neutral-200/60 flex items-center justify-center shrink-0 text-neutral-800">
              {getSkillIcon(skillData?.name || "", 24)}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-[22px] font-bold text-neutral-900 tracking-tight truncate leading-tight">
                {formatSkillTitle(skillData?.name || "")}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                <span className="font-mono text-neutral-500 font-normal">{skillData?.name}</span>
                {skillData?.author && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span className="text-neutral-500 font-sans">By {skillData.author}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {!isBuiltinSkill(skillData) && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={visibleIsDeleting}
                className="h-10 px-4 rounded-xl text-xs sm:text-[13px] font-medium text-neutral-800 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200/70 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Delete this skill"
              >
                {visibleIsDeleting ? (
                  <Loader2 size={14} className="animate-spin text-neutral-700" />
                ) : (
                  <Trash2 size={14} className="text-neutral-700" />
                )}
                <span className="leading-none text-neutral-900">Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAdd}
              disabled={visibleAdded || visibleIsAdding}
              className={`h-10 px-5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-xs ${
                visibleAdded
                  ? "bg-neutral-100 text-neutral-500 cursor-default"
                  : "bg-neutral-950 hover:bg-neutral-800 text-white"
              }`}
            >
              {visibleAdded ? (
                <>
                  <Check size={15} className="text-neutral-500" />
                  <span>Added</span>
                </>
              ) : visibleIsAdding ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus size={15} />
                  <span>Add to library</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-800 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="px-6 sm:px-7 py-3 border-b border-neutral-100/80 bg-neutral-50/40 shrink-0">
          <div className="bg-neutral-100/80 p-1 rounded-xl inline-flex items-center text-xs sm:text-[13px]">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white text-neutral-900 font-semibold shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 font-medium"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contents")}
              className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === "contents"
                  ? "bg-white text-neutral-900 font-semibold shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 font-medium"
              }`}
            >
              <span>Contents</span>
              {skillData?.files && (
                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-md bg-neutral-200/60 text-neutral-700">
                  {skillData.files.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("agents")}
              className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === "agents"
                  ? "bg-white text-neutral-900 font-semibold shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 font-medium"
              }`}
            >
              <span>Agents</span>
              {skillData?.agents && skillData.agents.length > 0 && (
                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-md bg-neutral-200/60 text-neutral-700">
                  {skillData.agents.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {visibleIsLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-neutral-400">
              <Loader2 size={28} className="animate-spin text-neutral-900 mb-3" />
              <p className="text-sm">Loading package contents...</p>
            </div>
          ) : visibleError ? (
            <div className="p-6">
              <div className="p-4 bg-rose-50 rounded-2xl text-rose-700 text-sm">{visibleError}</div>
            </div>
          ) : activeTab === "overview" ? (
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F8F8FA] border border-neutral-100">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                    Isolation
                  </span>
                  <span className="text-xs sm:text-[13px] font-medium text-neutral-800">
                    Docker Sandbox
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F8F8FA] border border-neutral-100">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                    Tools Required
                  </span>
                  <span className="text-xs sm:text-[13px] font-medium text-neutral-800 truncate block">
                    {skillData?.toolsRequired && skillData.toolsRequired.length > 0
                      ? skillData.toolsRequired.join(", ")
                      : "None (Instructions)"}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F8F8FA] border border-neutral-100">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                    Files in Package
                  </span>
                  <span className="text-xs sm:text-[13px] font-medium text-neutral-800">
                    {skillData?.files?.length || 1} file(s)
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F8F8FA] border border-neutral-100">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                    Scope
                  </span>
                  <span className="text-xs sm:text-[13px] font-medium text-neutral-800 capitalize">
                    {isBuiltinSkill(skillData) ? "Built-in" : skillData?.scope || "Personal"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2.5">
                  What this skill does
                </span>
                <p className="text-[15px] sm:text-[16px] text-neutral-800 leading-relaxed bg-[#F8F8FA] p-5 sm:p-6 rounded-2xl border border-neutral-100">
                  {formatSkillDescription(skillData?.description || "")}
                </p>
              </div>

              {/* Tools & Capabilities */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2.5">
                  Tools & Capabilities
                </span>
                {skillData?.toolsRequired && skillData.toolsRequired.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skillData.toolsRequired.map((t: string) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-mono font-medium"
                      >
                        <Wrench size={13} className="text-neutral-500" />
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">
                    Instructions only — no external tools required
                  </p>
                )}
              </div>

              {/* Categories */}
              {skillData?.categories && skillData.categories.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2.5">
                    Categories
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {skillData.categories.map((c: string) => (
                      <span
                        key={c}
                        className="px-3.5 py-1 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Changelog */}
              {skillData?.changelog && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
                    Changelog
                  </span>
                  <p className="text-sm text-neutral-600 leading-relaxed bg-[#F8F8FA] p-4 rounded-xl border border-neutral-100">
                    {skillData.changelog}
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === "contents" ? (
            /* 2-Column Split File Tree and Code Viewer for Best View - Clean Light Normal Colors */
            <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden border-t border-neutral-100">
              {/* File list sidebar */}
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-200/70 bg-[#FBFBFC] p-3 space-y-1.5 overflow-y-auto shrink-0">
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Files ({skillData?.files?.length || 0})
                </div>
                {skillData?.files?.map((file) => {
                  const isSelected = selectedFilePath === file.relativePath;
                  return (
                    <button
                      key={file.relativePath}
                      type="button"
                      onClick={() => setSelectedFilePath(file.relativePath)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-white text-neutral-950 font-semibold shadow-xs border border-neutral-200/80"
                          : "text-neutral-600 hover:bg-neutral-200/60 font-medium border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCode
                          size={14}
                          className={
                            isSelected ? "text-neutral-900 shrink-0" : "text-neutral-400 shrink-0"
                          }
                        />
                        <span className="truncate">{file.relativePath}</span>
                      </div>
                      {file.sizeBytes && (
                        <span className="text-[10.5px] shrink-0 text-neutral-400 font-normal">
                          {file.sizeBytes < 1024
                            ? `${file.sizeBytes} B`
                            : `${(file.sizeBytes / 1024).toFixed(1)} KB`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Code Viewer in Normal Clean Light Color */}
              <div className="flex-1 min-h-0 flex flex-col bg-[#FAFAFC] text-neutral-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-[#F4F4F6] border-b border-neutral-200/70 flex items-center justify-between text-neutral-500 text-xs shrink-0 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-900 font-semibold">{selectedFilePath}</span>
                    {selectedFile?.sizeBytes && (
                      <span className="text-neutral-400 font-normal">
                        ({selectedFile.sizeBytes} bytes)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyContent}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-neutral-200/80 hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950 transition-colors cursor-pointer text-xs font-sans font-medium shadow-2xs"
                  >
                    {copied ? (
                      <Check size={13} className="text-emerald-600" />
                    ) : (
                      <Copy size={13} className="text-neutral-500" />
                    )}
                    <span>{copied ? "Copied" : "Copy content"}</span>
                  </button>
                </div>
                <div className="flex-1 min-h-0 p-5 overflow-auto leading-relaxed select-text bg-[#FAFAFC]">
                  <pre className="whitespace-pre font-mono text-xs sm:text-[13px] text-neutral-850 selection:bg-neutral-200">
                    {selectedFile?.content || "(Binary or empty file content)"}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
              {skillData?.agents && skillData.agents.length > 0 ? (
                <div className="space-y-4">
                  {skillData.agents.map((ag) => (
                    <div
                      key={ag.name}
                      className="p-5 rounded-2xl bg-[#F8F8FA] border border-neutral-200/60 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-neutral-200/60 flex items-center justify-center text-neutral-800">
                          <Bot size={20} />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-neutral-900">{ag.name}</h4>
                          <p className="text-xs sm:text-sm text-neutral-500">{ag.description}</p>
                        </div>
                      </div>

                      {ag.tools && ag.tools.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-neutral-400 font-medium">Tools:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {ag.tools.map((t: string) => (
                              <span
                                key={t}
                                className="px-2.5 py-0.5 rounded-lg bg-neutral-200/60 text-neutral-700 font-mono text-[11px]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {ag.systemPrompt && (
                        <div className="rounded-xl overflow-hidden border border-neutral-200/70 bg-[#FAFAFC] text-neutral-800">
                          <div className="px-3 py-1.5 bg-[#F4F4F6] border-b border-neutral-200/60 text-[11px] font-mono text-neutral-500 font-medium">
                            System Prompt
                          </div>
                          <pre className="p-4 text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed select-text text-neutral-800">
                            {ag.systemPrompt}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-neutral-400">
                  <Bot size={36} className="mx-auto mb-3 text-neutral-300" />
                  <p className="text-base font-semibold text-neutral-700">No specialized agents</p>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-md mx-auto">
                    This skill operates through direct instructions and sandbox scripts, without
                    configuring secondary agent personalities.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
