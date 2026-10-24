import React, { useState, useRef } from "react";
import {
  ChevronDown,
  Search,
  Pin,
  Plus,
  Mic,
  FileText,
  Files,
  Trash2,
  Edit2,
  X,
  Check,
} from "lucide-react";
import { getChatModels, MODEL_REGISTRY } from "@charan-interiors/contracts";
import { useProviderKeys } from "../../customize";
import type { ProjectItem, ProjectSession } from "./projectTypes";
import { readChatAttachments } from "../../../app/files/chatAttachments";
import { useSpeechInput } from "../../../app/hooks/useSpeechInput";

export interface ProjectWorkspaceViewProps {
  project: ProjectItem;
  onBackToProjects: () => void;
  onStartSession: (initialPrompt: string, modelId?: string) => void;
  onOpenSession: (session: ProjectSession) => void;
  onUpdateProject: (updated: ProjectItem) => void;
  onDeleteProject: (projectId: string) => void;
}

const WORKSPACE_MODELS = getChatModels().map((model) => model.id);

export const ProjectWorkspaceView: React.FC<ProjectWorkspaceViewProps> = ({
  project,
  onBackToProjects,
  onStartSession,
  onOpenSession,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [promptText, setPromptText] = useState("");
  const [selectedModelId, setSelectedModelId] = useState<string>("claude-opus-5.5");
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
  const [instructionsText, setInstructionsText] = useState(project.customInstructions || "");
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description || "");
  const [isPinned, setIsPinned] = useState(Boolean(project.isPinned));
  const [fileError, setFileError] = useState("");
  const {
    isListening,
    error: speechError,
    toggle: toggleSpeechInput,
  } = useSpeechInput((transcript) =>
    setPromptText((current) => `${current}${current ? " " : ""}${transcript}`)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { hasKey } = useProviderKeys();
  const activeMeta = MODEL_REGISTRY[selectedModelId] || MODEL_REGISTRY["claude-opus-5.5"];
  const isModelConnected = hasKey(activeMeta.provider);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (promptText.trim()) {
        onStartSession(promptText.trim(), selectedModelId);
        setPromptText("");
      }
    }
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

  const togglePin = () => {
    const nextPin = !isPinned;
    setIsPinned(nextPin);
    onUpdateProject({
      ...project,
      isPinned: nextPin,
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
      {/* ── Top Bar / Breadcrumb Aligned with Content (Left to Left, Right to Right) ── */}
      <header className="w-full shrink-0 border-b border-transparent">
        <div className="w-full px-6 sm:px-7 md:px-8 pt-7 pb-4 flex items-center justify-between">
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
                className="flex items-center gap-1.5 text-neutral-900 font-medium hover:text-black transition-colors cursor-pointer"
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

          {/* Right: Search & Pin Icons */}
          <div className="flex items-center gap-1 text-neutral-600 -mr-1">
            <button
              type="button"
              title="Search"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <Search size={18} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={togglePin}
              title={isPinned ? "Unpin project" : "Pin project"}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer hover:bg-neutral-100 ${
                isPinned
                  ? "text-amber-600 bg-amber-50/60"
                  : "text-neutral-600 hover:text-neutral-950"
              }`}
            >
              <Pin size={18} strokeWidth={1.8} className={isPinned ? "fill-amber-500" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Workspace Body ── */}
      <div className="flex-1 w-full overflow-y-auto">
        <div className="w-full px-6 sm:px-7 md:px-8 pt-4 pb-20 flex flex-col md:flex-row justify-between gap-8 lg:gap-12">
          {/* Left Column: Title, Subtitle, Large Input Box, Recents */}
          <div className="flex-1 md:pl-20 min-w-0 max-w-4xl lg:max-w-[1000px] xl:max-w-[1080px] flex flex-col">
            {/* Project Title (Serif, commanding & elegant) */}
            <h1 className="text-[36px] md:text-[40px] font-serif text-neutral-900 tracking-tight font-normal leading-tight mb-1.5">
              {project.name}
            </h1>

            {/* Project Subtitle / Description */}
            <p className="text-[15px] text-neutral-500 mb-7 font-normal">
              {project.description || "Job"}
            </p>

            {/* New Session Input Card */}
            <div className="w-full bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-neutral-300 focus-within:border-neutral-400 focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all flex flex-col">
              <textarea
                rows={2}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`New session in ${project.name}`}
                className="w-full bg-transparent outline-none resize-none text-[15.5px] text-neutral-900 placeholder:text-neutral-400 min-h-[72px] leading-relaxed"
              />

              {/* Bottom Actions Row Inside Input Card */}
              <div className="flex items-center justify-between pt-2 border-t border-transparent">
                {/* Plus Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Add files or content"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <Plus size={17} strokeWidth={2} />
                </button>

                {/* Voice dictation */}
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <button
                    type="button"
                    title={isListening ? "Stop dictation" : "Dictate"}
                    aria-label={isListening ? "Stop dictation" : "Dictate"}
                    aria-pressed={isListening}
                    onClick={toggleSpeechInput}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer ${isListening ? "text-rose-600 bg-rose-50" : ""}`}
                  >
                    <Mic size={16} strokeWidth={1.8} />
                    {isListening && <span className="text-[11px]">Listening</span>}
                  </button>
                </div>
              </div>
              {speechError && (
                <p role="alert" className="mt-2 text-xs text-rose-600">
                  {speechError}
                </p>
              )}
            </div>

            {/* Interactive BYOK Model Picker below card on the right */}
            <div className="relative flex items-center gap-2 justify-end text-[12px] text-neutral-400 mt-2.5 font-normal pr-1">
              <button
                type="button"
                onClick={() => setIsModelPickerOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isModelConnected ? "bg-emerald-500" : "bg-neutral-300"
                  }`}
                />
                <span className="text-neutral-700 font-medium">{activeMeta.name}</span>
                <span className="text-neutral-400">Medium</span>
                <span className="text-neutral-500">BYOK</span>
                <ChevronDown size={11} className="text-neutral-400" />
              </button>

              {isModelPickerOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-neutral-200/90 p-1 z-40">
                  {WORKSPACE_MODELS.map((mId) => {
                    const meta = MODEL_REGISTRY[mId];
                    if (!meta) return null;
                    const connected = hasKey(meta.provider);
                    const isSelected = mId === selectedModelId;
                    return (
                      <button
                        key={mId}
                        type="button"
                        onClick={() => {
                          setSelectedModelId(mId);
                          setIsModelPickerOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[12px] cursor-pointer ${
                          isSelected
                            ? "bg-neutral-100 text-neutral-900 font-medium"
                            : "text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              connected ? "bg-emerald-500" : "bg-neutral-300"
                            }`}
                          />
                          <span>{meta.name}</span>
                        </div>
                        {isSelected && <Check size={12} className="text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recents Section directly under input card */}
            {project.sessions && project.sessions.length > 0 && (
              <div className="mt-10">
                <h2 className="text-[13.5px] text-neutral-500 font-medium mb-3">Recents</h2>
                <div className="flex flex-col gap-0.5">
                  {project.sessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => onOpenSession(sess)}
                      className="flex items-center justify-between py-2.5 -mx-3 px-3 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer group"
                    >
                      <span className="text-[15px] text-neutral-800 group-hover:text-black font-normal">
                        {sess.title}
                      </span>
                      <span className="text-[13px] text-neutral-400 font-normal">
                        {formatRelativeTime(sess.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Instructions, Files, Private Label */}
          <div className="w-full md:w-72 lg:w-80 shrink-0 pt-2 flex flex-col">
            {/* Instructions Row */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5 text-neutral-800">
                <FileText size={17} strokeWidth={1.8} className="text-neutral-600" />
                <span className="text-[14.5px] font-normal">Instructions</span>
              </div>
              <button
                type="button"
                onClick={() => setIsInstructionsModalOpen(true)}
                className="text-[13.5px] text-neutral-600 hover:text-black font-normal cursor-pointer transition-colors px-2 py-0.5 rounded-lg hover:bg-neutral-100"
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
            <div className="h-px bg-neutral-200/50 my-2" />

            {/* Files Row */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5 text-neutral-800">
                <Files size={17} strokeWidth={1.8} className="text-neutral-600" />
                <span className="text-[14.5px] font-normal">Files</span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[13.5px] text-neutral-600 hover:text-black font-normal cursor-pointer transition-colors px-2 py-0.5 rounded-lg hover:bg-neutral-100"
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
              <div className="flex flex-col gap-1.5 mt-1.5 mb-2">
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
                      onClick={() => handleRemoveFile(file.id)}
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
            <span className="text-[13px] text-neutral-400 mt-6 block font-normal px-0.5">
              Private
            </span>
          </div>
        </div>
      </div>

      {/* ── Edit Project Details Modal ── */}
      {isInstructionsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsInstructionsModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150"
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
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-[13.5px] font-normal text-neutral-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="mb-3 block text-[13px] font-medium text-neutral-700">
              Description
              <textarea
                rows={2}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                maxLength={4000}
                className="mt-1.5 w-full resize-y rounded-xl border border-neutral-200 px-3.5 py-2.5 text-[13.5px] font-normal text-neutral-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200/90 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[13.5px] text-neutral-900 outline-none transition-all resize-y"
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
                className="px-4 py-2 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 text-[13px] font-medium transition-colors cursor-pointer shadow-xs"
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
