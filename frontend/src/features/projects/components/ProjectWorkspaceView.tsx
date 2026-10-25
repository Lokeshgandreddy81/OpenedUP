import React, { useState, useRef } from "react";
import { ChevronDown, Search, FileText, Files, Trash2, Edit2, X } from "lucide-react";
import { getModelMeta } from "@charan-interiors/contracts";
import { useProviderKeys } from "../../customize/publicApi";
import type { ProjectItem, ProjectSession } from "./projectTypes";
import { readChatAttachments } from "../../../app/files/chatAttachments";
import { ChatInput, type AiModelId, type EffortLevel } from "../../chat";
import type { ChatAttachmentFile } from "../../../app/files/chatAttachments";

export interface ProjectWorkspaceViewProps {
  project: ProjectItem;
  onBackToProjects: () => void;
  onStartSession: (
    initialPrompt: string,
    modelId?: AiModelId,
    effort?: EffortLevel,
    attachments?: ChatAttachmentFile[]
  ) => void;
  onOpenSession: (session: ProjectSession) => void;
  onUpdateProject: (updated: ProjectItem) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenProviders: () => void;
  onOpenProjects: () => void;
  onOpenPlugins: () => void;
  onOpenBenchmarks: () => void;
}

export const ProjectWorkspaceView: React.FC<ProjectWorkspaceViewProps> = ({
  project,
  onBackToProjects,
  onStartSession,
  onOpenSession,
  onUpdateProject,
  onDeleteProject,
  onOpenProviders,
  onOpenProjects,
  onOpenPlugins,
  onOpenBenchmarks,
}) => {
  const [selectedModelId, setSelectedModelId] = useState<AiModelId>(
    "openrouter-nemotron-3.5-lightning-free"
  );
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
  const [isSessionSearchOpen, setIsSessionSearchOpen] = useState(false);
  const [sessionSearch, setSessionSearch] = useState("");
  const [instructionsText, setInstructionsText] = useState(project.customInstructions || "");
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description || "");
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { hasKey } = useProviderKeys();
  const filteredSessions = (project.sessions || []).filter((session) =>
    session.title.toLocaleLowerCase().includes(sessionSearch.trim().toLocaleLowerCase())
  );

  const handleModelChange = (model: AiModelId) => {
    const metadata = getModelMeta(model);
    if (!metadata.isFree && !hasKey(metadata.provider)) {
      onOpenProviders();
      return;
    }
    setSelectedModelId(model);
  };

  const handleSaveInstructions = () => {
    if (!projectName.trim()) return;
    onUpdateProject({
      ...project,
      name: projectName.trim(),
      description: projectDescription.trim() || undefined,
      customInstructions: instructionsText.trim() || undefined,
      updatedAt: Date.now(),
    });
    setIsInstructionsModalOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const result = await readChatAttachments(Array.from(files), project.files || []);
    setFileError(result.errors.join(" "));
    const newFiles = result.files;

    onUpdateProject({
      ...project,
      files: [...(project.files || []), ...newFiles],
      updatedAt: Date.now(),
    });

    e.target.value = "";
  };

  const handleRemoveFile = (fileId: string) => {
    onUpdateProject({
      ...project,
      files: (project.files || []).filter((f) => f.id !== fileId),
      updatedAt: Date.now(),
    });
  };

  const formatRelativeTime = (timestamp?: number): string => {
    if (!timestamp) return "Recently";
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="flex-1 w-full h-full bg-white flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-150">
      {/* Compact project breadcrumb bar */}
      <header className="w-full shrink-0 bg-white">
        <div className="w-full px-4 sm:px-5 h-14 flex items-center justify-start gap-3">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-2 text-[14px]">
            <button
              type="button"
              onClick={onBackToProjects}
              className="text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer font-normal"
            >
              Projects
            </button>
            <span className="text-neutral-300 font-light mx-0.5">/</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHeaderMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 text-neutral-900 font-medium hover:text-neutral-700 transition-colors cursor-pointer"
              >
                <span>{project.name}</span>
                <ChevronDown size={14} className="text-neutral-400 mt-0.5" />
              </button>

              {/* Project dropdown options */}
              {isHeaderMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-neutral-200/90 py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      setProjectName(project.name);
                      setProjectDescription(project.description || "");
                      setInstructionsText(project.customInstructions || "");
                      setIsInstructionsModalOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 cursor-pointer font-medium"
                  >
                    <Edit2 size={13} className="text-neutral-500" />
                    <span>Edit project details</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      onDeleteProject(project.id);
                    }}
                    className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer font-medium"
                  >
                    <Trash2 size={13} />
                    <span>Delete project</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Workspace Body ── */}
      <div className="flex-1 w-full overflow-y-auto">
        <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-10 pt-7 pb-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 xl:gap-10">
          {/* Left Column: Title, Subtitle, Large Input Box, Recents */}
          <div className="min-w-0 flex flex-col">
            <p className="text-[11px] uppercase tracking-[0.12em] font-medium text-[#8a765c] mb-1.5">
              Project workspace
            </p>
            <h1 className="text-[30px] md:text-[34px] font-serif text-neutral-900 tracking-tight font-normal leading-tight mb-1.5">
              {project.name}
            </h1>

            {/* Project Subtitle / Description */}
            {project.description && (
              <p className="text-[14px] text-neutral-500 mb-6 font-normal leading-relaxed">
                {project.description}
              </p>
            )}
            {!project.description && <div className="mb-6" />}

            <div className="mb-5 w-full">
              <ChatInput
                onSendMessage={(message, model, effort, attachments) =>
                  onStartSession(message, model, effort, attachments)
                }
                isThinking={false}
                stableFrame
                placeholder={`New session in ${project.name}`}
                selectedModel={selectedModelId}
                onChangeModel={handleModelChange}
                onOpenProjects={onOpenProjects}
                onOpenPlugins={onOpenPlugins}
                onOpenBenchmarks={onOpenBenchmarks}
                onOpenProviders={onOpenProviders}
              />
            </div>

            {/* Recents Section directly under input card */}
            <div className="mt-7">
              <div className="flex items-center justify-between border-b border-[#eeece8] pb-2.5 mb-1">
                <div>
                  <h2 className="text-[16px] text-neutral-900 font-medium">Recent sessions</h2>
                </div>
                {isSessionSearchOpen ? (
                  <div className="relative w-56 sm:w-64">
                    <Search
                      size={15}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      autoFocus
                      type="text"
                      aria-label="Search recent sessions"
                      value={sessionSearch}
                      onChange={(event) => setSessionSearch(event.target.value)}
                      placeholder="Search sessions"
                      className="h-9 w-full rounded-lg border border-[#e9e6e1] bg-white pl-9 pr-9 text-[13px] text-neutral-800 placeholder:text-neutral-400 outline-none transition-colors focus:border-[#b9aa95] focus:ring-2 focus:ring-[#806b4f]/10"
                    />
                    <button
                      type="button"
                      aria-label="Close session search"
                      onClick={() => {
                        setIsSessionSearchOpen(false);
                        setSessionSearch("");
                      }}
                      className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label="Search sessions"
                    onClick={() => setIsSessionSearchOpen(true)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:bg-[#f2f0ec] hover:text-neutral-900"
                  >
                    <Search size={16} />
                  </button>
                )}
              </div>
              {filteredSessions.length > 0 ? (
                <div className="divide-y divide-[#f1efeb]">
                  {filteredSessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => onOpenSession(sess)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpenSession(sess);
                        }
                      }}
                      className="flex items-center justify-between gap-4 py-3 px-1 rounded-lg hover:bg-[#f8f6f3] transition-colors cursor-pointer group"
                    >
                      <span className="text-[14px] text-neutral-800 group-hover:text-neutral-950 font-medium truncate">
                        {sess.title}
                      </span>
                      <span className="text-[12px] text-neutral-500 font-normal shrink-0">
                        {formatRelativeTime(sess.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-5 text-[13px] text-neutral-500">
                  {project.sessions?.length
                    ? "No sessions match your search."
                    : "Your sessions will appear here."}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Instructions, Files, Private Label */}
          <div className="w-full shrink-0 self-start rounded-2xl bg-[#faf9f7] p-5">
            <h2 className="text-[15px] font-medium text-neutral-900 mb-1">Project context</h2>
            <p className="text-[12px] text-neutral-500 mb-4">
              Details and files are available in every session.
            </p>
            {/* Instructions Row */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5 text-neutral-800">
                <FileText size={17} strokeWidth={1.8} className="text-neutral-600" />
                <span className="text-[14.5px] font-normal">Instructions</span>
              </div>
              <button
                type="button"
                onClick={() => setIsInstructionsModalOpen(true)}
                className="text-[13.5px] text-neutral-600 hover:text-neutral-900 font-normal cursor-pointer transition-colors px-2 py-0.5 rounded-lg hover:bg-[#f2f0ec]"
              >
                {project.customInstructions ? "Edit" : "Add"}
              </button>
            </div>

            {/* Instructions preview if set */}
            {project.customInstructions && (
              <div className="mb-2 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-100 text-[12.5px] text-neutral-600 line-clamp-2 leading-relaxed">
                {project.customInstructions}
              </div>
            )}

            {/* Divider Line */}
            <div className="h-px bg-[#eeece8] my-2" />

            {/* Files Row */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5 text-neutral-800">
                <Files size={17} strokeWidth={1.8} className="text-neutral-600" />
                <span className="text-[14.5px] font-normal">Files</span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[13.5px] text-neutral-600 hover:text-neutral-900 font-normal cursor-pointer transition-colors px-2 py-0.5 rounded-lg hover:bg-[#f2f0ec]"
              >
                Add
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Uploaded Files List */}
            {project.files && project.files.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1.5 mb-2 max-h-64 overflow-y-auto">
                {project.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-100 text-[12.5px] text-neutral-700"
                  >
                    <span className="truncate max-w-[200px]" title={file.name}>
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => file.id && handleRemoveFile(file.id)}
                      className="text-neutral-400 hover:text-rose-600 cursor-pointer transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {fileError && (
              <p role="alert" className="text-xs text-rose-600">
                {fileError}
              </p>
            )}

            {/* Private Tag */}
            <div className="mt-4 pt-3 border-t border-[#eeece8] text-[12px] text-neutral-500">
              Private to your workspace
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Project Details Modal ── */}
      {isInstructionsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsInstructionsModalOpen(false)}
          className="fixed inset-0 z-50 bg-neutral-900/35 backdrop-blur-[3px] flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200/80 p-7 flex flex-col animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-semibold text-neutral-900 tracking-tight">
                Project details
              </h2>
              <button
                type="button"
                onClick={() => setIsInstructionsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <label className="mb-3 block text-[13px] font-medium text-neutral-700">
              Project name
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                maxLength={200}
                className="mt-1.5 w-full rounded-xl border border-[#e6e2dc] px-3.5 py-2.5 text-[13.5px] font-normal text-neutral-900 outline-none focus:border-[#b9aa95] focus:ring-2 focus:ring-[#806b4f]/10"
              />
            </label>
            <label className="mb-3 block text-[13px] font-medium text-neutral-700">
              Description
              <textarea
                rows={2}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                maxLength={4000}
                className="mt-1.5 w-full resize-y rounded-xl border border-[#e6e2dc] px-3.5 py-2.5 text-[13.5px] font-normal text-neutral-900 outline-none focus:border-[#b9aa95] focus:ring-2 focus:ring-[#806b4f]/10"
              />
            </label>
            <label className="mb-1 block text-[13px] font-medium text-neutral-700">
              Custom instructions
            </label>

            <textarea
              rows={6}
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              placeholder="e.g. Always reference financial formulas, cite specific document chapters, summarize key totals..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6e2dc] focus:border-[#b9aa95] focus:ring-2 focus:ring-[#806b4f]/10 text-[13.5px] text-neutral-900 outline-none transition-all resize-y"
            />

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setIsInstructionsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-[13px] font-medium text-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveInstructions}
                className="px-4 py-2 rounded-xl bg-[#806b4f] text-white hover:bg-[#705c43] text-[13px] font-medium transition-colors cursor-pointer shadow-sm"
              >
                Save project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
