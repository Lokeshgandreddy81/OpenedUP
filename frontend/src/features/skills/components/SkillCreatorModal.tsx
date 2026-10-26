import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Save,
  Plus,
  Loader2,
  Terminal,
  Send,
  ChevronDown,
  Check,
  FileCode,
  FileText,
  Upload,
} from "lucide-react";
import {
  validateSkillDraft,
  createSkillFromJson,
  testScratchSkill,
  type SkillItem,
  type SkillScope,
} from "../services/skillsApi";
import { extractPdfText } from "../../artifacts";

interface SkillCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkillCreated: (skill: SkillItem) => void;
  initialDraft?: {
    name?: string;
    description?: string;
    instructions?: string;
    files?: ExtraFile[];
  };
}

export interface ExtraFile {
  relativePath: string;
  content: string;
}

export const SkillCreatorModal: React.FC<SkillCreatorModalProps> = ({
  isOpen,
  onClose,
  onSkillCreated,
  initialDraft,
}) => {
  const [activeTab, setActiveTab] = useState<"editor" | "test">("editor");

  // Form fields
  const [name, setName] = useState(initialDraft?.name || "");
  const [description, setDescription] = useState(initialDraft?.description || "");
  const [scope, setScope] = useState<SkillScope>("user");
  const [isScopeDropdownOpen, setIsScopeDropdownOpen] = useState(false);
  const scopeDropdownRef = useRef<HTMLDivElement | null>(null);

  const [categories] = useState("Productivity, Engineering");
  const [instructions, setInstructions] = useState(
    initialDraft?.instructions ||
      "# Instructions\n\nExplain step-by-step how the model should complete tasks using this skill.\n\n## Guidelines\n- Be specific about input/output formats.\n- Use scripts under scripts/ if automated computation is needed."
  );
  const [extraFiles, setExtraFiles] = useState<ExtraFile[]>(initialDraft?.files || []);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(-1); // -1 for SKILL.md
  const [isReadingFile, setIsReadingFile] = useState(false);

  // Desktop file input ref for seamless adding of .md, .pdf, .py, etc.
  const desktopFileInputRef = useRef<HTMLInputElement | null>(null);

  // Live validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Test panel state
  const [testPrompt, setTestPrompt] = useState("Summarize this sample test input data.");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    toolTraces: Array<{ toolName: string; input: Record<string, unknown>; output: string; isError: boolean }>;
    finalText: string;
  } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Saving state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync initial draft changes
  useEffect(() => {
    if (initialDraft) {
      if (initialDraft.name) setName(initialDraft.name);
      if (initialDraft.description) setDescription(initialDraft.description);
      if (initialDraft.instructions) setInstructions(initialDraft.instructions);
      if (initialDraft.files) setExtraFiles(initialDraft.files);
    }
  }, [initialDraft]);

  // Click outside to dismiss scope dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (scopeDropdownRef.current && !scopeDropdownRef.current.contains(e.target as Node)) {
        setIsScopeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate full SKILL.md string from frontmatter + instructions
  const fullSkillMd = React.useMemo(() => {
    const cats = categories
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const catYaml =
      cats.length > 0
        ? `categories:\n${cats.map((c) => `  - ${c}`).join("\n")}`
        : "";

    return `---
name: ${name.trim() || "untitled-skill"}
description: ${description.trim() || "No description provided."}
${catYaml}
---
${instructions}`;
  }, [name, description, categories, instructions]);

  // Run live validation on change
  useEffect(() => {
    if (!name && !description) return;
    const timer = setTimeout(() => {
      void validateSkillDraft({
        name,
        description,
        skillMd: fullSkillMd,
        files: extraFiles,
      }).then((res) => {
        setValidationErrors(res.errors || []);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [name, description, fullSkillMd, extraFiles]);

  if (!isOpen) return null;

  // Handle desktop file upload (.md, .pdf, .py, .txt, .json, .sh, etc.)
  const handleDesktopFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsReadingFile(true);
    try {
      const addedFiles: ExtraFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const lowerName = file.name.toLowerCase();

        if (lowerName.endsWith(".pdf")) {
          // Extract text from PDF
          const { content } = await extractPdfText(file);
          if (activeFileIndex === -1 && (!instructions || instructions.startsWith("# Instructions"))) {
            // Populate instructions directly
            setInstructions(content);
            if (!name) {
              setName(file.name.replace(/\.pdf$/i, "").toLowerCase().replace(/[^a-z0-9-]/g, "-"));
            }
          } else {
            addedFiles.push({
              relativePath: `references/${file.name}.txt`,
              content,
            });
          }
        } else if (lowerName.endsWith(".md") || lowerName.endsWith(".txt") || lowerName.endsWith(".py") || lowerName.endsWith(".json") || lowerName.endsWith(".sh") || lowerName.endsWith(".yaml") || lowerName.endsWith(".yml")) {
          const text = await file.text();

          if (lowerName === "skill.md") {
            // Populate main SKILL.md instructions
            setInstructions(text);
          } else {
            const path = lowerName.endsWith(".py") || lowerName.endsWith(".sh") ? `scripts/${file.name}` : file.name;
            addedFiles.push({
              relativePath: path,
              content: text,
            });
          }
        } else {
          // Generic text read
          const text = await file.text();
          addedFiles.push({
            relativePath: file.name,
            content: text,
          });
        }
      }

      if (addedFiles.length > 0) {
        setExtraFiles((prev) => {
          const filtered = prev.filter(
            (p) => !addedFiles.some((a) => a.relativePath === p.relativePath)
          );
          return [...filtered, ...addedFiles];
        });
        setActiveFileIndex(extraFiles.length + addedFiles.length - 1);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load desktop file.");
    } finally {
      setIsReadingFile(false);
      if (desktopFileInputRef.current) desktopFileInputRef.current.value = "";
    }
  };

  const handleCreateEmptyFile = () => {
    const filename = prompt("Enter file relative path (e.g. scripts/run.py or templates/doc.md):");
    if (!filename || !filename.trim()) return;
    const clean = filename.trim();
    if (extraFiles.some((f) => f.relativePath === clean)) {
      alert("A file with this path already exists.");
      return;
    }
    const newFiles = [
      ...extraFiles,
      { relativePath: clean, content: clean.endsWith(".py") ? "#!/usr/bin/env python3\n" : "" },
    ];
    setExtraFiles(newFiles);
    setActiveFileIndex(newFiles.length - 1);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = extraFiles.filter((_, i) => i !== index);
    setExtraFiles(newFiles);
    setActiveFileIndex(-1);
  };

  const handleRunScratchTest = async () => {
    setIsTesting(true);
    setTestError(null);
    setTestResult(null);

    try {
      const res = await testScratchSkill(
        {
          name: name.trim() || "test-skill",
          description: description.trim() || "Test description for scratch simulation.",
          skillMd: fullSkillMd,
          files: extraFiles,
        },
        testPrompt
      );
      setTestResult(res);
    } catch (err: unknown) {
      setTestError(err instanceof Error ? err.message : "Scratch execution test failed.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (status: "draft" | "approved" | "pending_review") => {
    setIsSubmitting(true);
    setSaveError(null);

    try {
      const created = await createSkillFromJson({
        name: name.trim(),
        description: description.trim(),
        skillMd: fullSkillMd,
        files: extraFiles,
        scope,
        approvalStatus: status,
      });
      onSkillCreated(created);
      onClose();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save skill.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scopeLabels: Record<SkillScope, { title: string; subtitle: string }> = {
    user: { title: "Private", subtitle: "My Personal Library" },
    org: { title: "Organization", subtitle: "Team Shared" },
    directory: { title: "Directory", subtitle: "Public Marketplace" },
    builtin: { title: "Built-in", subtitle: "System Built-in" },
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-150">
      {/* 30%+ bigger size: max-w-5xl h-[88vh] max-h-[860px] */}
      <div className="bg-white rounded-3xl shadow-[0_30px_90px_-20px_rgba(0,0,0,0.3)] w-full max-w-5xl h-[88vh] max-h-[860px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 border border-neutral-200/50">
        
        {/* Hidden desktop file picker for .md, .pdf, .py, .txt, .json */}
        <input
          ref={desktopFileInputRef}
          type="file"
          multiple
          accept=".md,.pdf,.txt,.py,.json,.yaml,.yml,.sh,.csv"
          className="hidden"
          onChange={handleDesktopFileSelect}
        />

        {/* Clean Header */}
        <div className="px-7 sm:px-8 py-5 flex items-center justify-between border-b border-neutral-100 shrink-0">
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Create Skill</h2>

          <div className="flex items-center gap-3">
            <div className="bg-neutral-100 p-0.5 rounded-xl inline-flex items-center text-xs sm:text-[13px]">
              <button
                type="button"
                onClick={() => setActiveTab("editor")}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === "editor"
                    ? "bg-white text-neutral-900 font-semibold shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900 font-medium"
                }`}
              >
                Package Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("test")}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === "test"
                    ? "bg-white text-neutral-900 font-semibold shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900 font-medium"
                }`}
              >
                <Play size={12} className="text-neutral-700" />
                <span>Test Harness</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-800 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-7 sm:px-8 py-6 space-y-5">
          {saveError && (
            <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-700 text-xs flex items-center justify-between">
              <span>{saveError}</span>
              <button onClick={() => setSaveError(null)} className="text-rose-500 hover:text-rose-700">
                <X size={14} />
              </button>
            </div>
          )}

          {activeTab === "editor" ? (
            <div className="space-y-5">
              {/* Basic Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Skill Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="e.g. data-analyst-pro"
                    className="w-full px-3.5 py-2.5 bg-[#F8F8FA] focus:bg-white text-neutral-900 text-xs sm:text-[13px] font-mono rounded-xl border border-neutral-200/70 focus:border-neutral-400 outline-none transition-colors placeholder:text-neutral-400"
                  />
                </div>

                {/* Scope & Visibility Dropdown - Clean & Sleek */}
                <div className="relative" ref={scopeDropdownRef}>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Scope & Visibility
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsScopeDropdownOpen((prev) => !prev)}
                    className="w-full h-[42px] px-3.5 rounded-xl bg-[#F8F8FA] hover:bg-neutral-100/80 border border-neutral-200/70 flex items-center justify-between text-left text-xs sm:text-[13px] text-neutral-900 font-medium transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span>{scopeLabels[scope].title}</span>
                      <span className="text-neutral-400 font-normal text-xs">
                        ({scopeLabels[scope].subtitle})
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-neutral-400 transition-transform duration-150 ${
                        isScopeDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isScopeDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl bg-white p-1.5 shadow-[0_16px_36px_-10px_rgba(0,0,0,0.18)] border border-neutral-200/80 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
                      {(["user", "org", "directory"] as SkillScope[]).map((s) => {
                        const isSelected = scope === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setScope(s);
                              setIsScopeDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs sm:text-[13px] transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-neutral-100 text-neutral-950 font-semibold"
                                : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-normal"
                            }`}
                          >
                            <div>
                              <span className="block font-medium">{scopeLabels[s].title}</span>
                              <span className="block text-[11px] text-neutral-400">
                                {scopeLabels[s].subtitle}
                              </span>
                            </div>
                            {isSelected && <Check size={14} className="text-neutral-900 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-700">
                    Description
                  </label>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {description.length}/1024
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Used for analyzing, inspecting, and computing summary statistics from CSV files..."
                  className="w-full px-3.5 py-2.5 bg-[#F8F8FA] focus:bg-white text-neutral-900 text-xs sm:text-[13px] rounded-xl border border-neutral-200/70 focus:border-neutral-400 outline-none transition-colors leading-relaxed placeholder:text-neutral-400"
                />
              </div>

              {/* Package Files & Code Editor */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700">
                    Package Files & Instructions
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => desktopFileInputRef.current?.click()}
                      disabled={isReadingFile}
                      className="h-7 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200/70 text-neutral-800 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Upload .md, .pdf, or code from computer"
                    >
                      {isReadingFile ? (
                        <Loader2 size={12} className="animate-spin text-neutral-600" />
                      ) : (
                        <Upload size={12} className="text-neutral-600" />
                      )}
                      <span>Add from desktop (.md, .pdf)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCreateEmptyFile}
                      className="h-7 px-2.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus size={12} /> Empty script
                    </button>
                  </div>
                </div>

                {/* File Tabs - Normal Light Colors */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveFileIndex(-1)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                      activeFileIndex === -1
                        ? "bg-white text-neutral-950 font-semibold shadow-xs border border-neutral-200/80"
                        : "text-neutral-600 hover:bg-neutral-100 border border-transparent font-medium"
                    }`}
                  >
                    <FileText size={12} className={activeFileIndex === -1 ? "text-neutral-900" : "text-neutral-400"} />
                    <span>SKILL.md</span>
                  </button>

                  {extraFiles.map((file, idx) => (
                    <div
                      key={file.relativePath}
                      onClick={() => setActiveFileIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 ${
                        activeFileIndex === idx
                          ? "bg-white text-neutral-950 font-semibold shadow-xs border border-neutral-200/80"
                          : "text-neutral-600 hover:bg-neutral-100 border border-transparent font-medium"
                      }`}
                    >
                      <FileCode size={12} className={activeFileIndex === idx ? "text-neutral-900" : "text-neutral-400"} />
                      <span>{file.relativePath}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className="text-neutral-400 hover:text-rose-500 ml-0.5 p-0.5"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Text Editor in Normal Light Color */}
                <div className="rounded-2xl overflow-hidden border border-neutral-200/80 bg-[#FAFAFC] font-mono text-xs">
                  <div className="bg-[#F4F4F6] border-b border-neutral-200/70 px-4 py-2.5 flex items-center justify-between text-neutral-500 text-xs shrink-0">
                    <span className="text-neutral-800 font-semibold">
                      {activeFileIndex === -1 ? "SKILL.md" : extraFiles[activeFileIndex]?.relativePath}
                    </span>
                    <span className="text-neutral-400 font-normal">UTF-8</span>
                  </div>

                  {activeFileIndex === -1 ? (
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={12}
                      className="w-full p-4 bg-[#FAFAFC] text-neutral-850 font-mono text-xs focus:outline-none resize-y leading-relaxed"
                    />
                  ) : (
                    <textarea
                      value={extraFiles[activeFileIndex]?.content || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExtraFiles((prev) =>
                          prev.map((f, i) => (i === activeFileIndex ? { ...f, content: val } : f))
                        );
                      }}
                      rows={12}
                      className="w-full p-4 bg-[#FAFAFC] text-neutral-850 font-mono text-xs focus:outline-none resize-y leading-relaxed"
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Test This Skill Tab */
            <div className="space-y-5">
              <div className="p-5 bg-[#F8F8FA] border border-neutral-200/60 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                    <Terminal size={15} className="text-neutral-700" />
                    Scratch Simulation Sandbox
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    Ephemeral
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-700 block">
                    Test Prompt
                  </label>
                  <input
                    type="text"
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    placeholder="Enter test prompt..."
                    className="w-full px-3.5 py-2.5 bg-white text-neutral-900 text-xs sm:text-[13px] rounded-xl border border-neutral-200/70 focus:border-neutral-400 outline-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleRunScratchTest}
                    disabled={isTesting}
                    className="h-8 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isTesting ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                    <span>{isTesting ? "Executing..." : "Run Test"}</span>
                  </button>
                </div>
              </div>

              {testError && (
                <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-700 text-xs">
                  {testError}
                </div>
              )}

              {testResult && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Execution Trace ({testResult.toolTraces.length} steps)
                  </h3>

                  <div className="space-y-2.5">
                    {testResult.toolTraces.map((trace, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl overflow-hidden border border-neutral-200/70 bg-[#FAFAFC] text-neutral-800 text-xs font-mono"
                      >
                        <div className="px-3.5 py-2 bg-[#F4F4F6] border-b border-neutral-200/60 flex items-center justify-between text-xs">
                          <span className="font-semibold text-neutral-900">
                            {idx + 1}. {trace.toolName}
                          </span>
                          <span className={trace.isError ? "text-rose-600 font-medium" : "text-emerald-600 font-medium"}>
                            {trace.isError ? "Error" : "Success"}
                          </span>
                        </div>

                        <div className="p-3.5 space-y-2 text-xs">
                          <div>
                            <span className="text-neutral-400 block text-[11px] uppercase">Input</span>
                            <pre className="text-neutral-700 overflow-x-auto whitespace-pre-wrap mt-0.5">
                              {JSON.stringify(trace.input, null, 2)}
                            </pre>
                          </div>

                          <div>
                            <span className="text-neutral-400 block text-[11px] uppercase">Output</span>
                            <pre className="text-neutral-700 overflow-x-auto whitespace-pre-wrap mt-0.5">
                              {trace.output}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-[#F8F8FA] border border-neutral-200/60 rounded-2xl space-y-1">
                    <span className="text-xs font-semibold text-neutral-900 block">Final Output</span>
                    <p className="text-xs sm:text-[13px] text-neutral-700 leading-relaxed whitespace-pre-wrap font-mono">
                      {testResult.finalText}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clean Footer Actions */}
        <div className="px-7 sm:px-8 py-4 flex items-center justify-between border-t border-neutral-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-xs sm:text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSave("draft")}
              disabled={isSubmitting || !name.trim()}
              className="h-9 px-4 rounded-xl text-neutral-700 hover:bg-neutral-100 text-xs sm:text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Save size={13} />
              <span>Save draft</span>
            </button>

            {scope === "user" ? (
              <button
                type="button"
                onClick={() => handleSave("approved")}
                disabled={isSubmitting || !name.trim() || validationErrors.length > 0}
                className="h-9 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs sm:text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-40"
              >
                {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : null}
                <span>Save to Library</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSave("pending_review")}
                disabled={isSubmitting || !name.trim() || validationErrors.length > 0}
                className="h-9 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs sm:text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-40"
              >
                {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>Submit for Review</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
