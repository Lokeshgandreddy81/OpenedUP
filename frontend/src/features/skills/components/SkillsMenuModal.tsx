import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Upload,
  X,
  Check,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  getSkills,
  setConversationSkills,
  uploadSkill,
  deleteSkill,
  createSkillFromJson,
  type SkillItem,
} from "../services/skillsApi";
import { extractPdfText } from "../../artifacts";

export interface SkillsMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  enabledSkills: SkillItem[];
  onSkillsChange: (skills: SkillItem[]) => void;
}

const BUILTIN_PLATFORM_SKILL_NAMES = new Set([
  "hello-format",
  "csv-summary",
  "web-research-analyst",
  "sql-schema-architect",
  "markdown-doc-writer",
  "fastapi-backend-scaffolder",
]);

function isUserCreatedSkill(skill: SkillItem): boolean {
  if (skill.scope === "builtin" || skill.scope === "directory") return false;
  if (BUILTIN_PLATFORM_SKILL_NAMES.has(skill.name)) return false;
  return skill.scope === "user";
}

function getSkillMonogram(name: string): string {
  const clean = name.replace(/^skill-/, "");
  const parts = clean.split(/[-_\s]+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function formatSkillDescription(desc: string): string {
  if (!desc) return "Custom skill.";
  return desc
    .replace(/^use\s+(this\s+skill\s+)?(when\s+asked\s+to|to)\s+/i, "Used for ")
    .replace(/^use\s+when\s+/i, "Used when ")
    .replace(/^used\s+to\s+/i, "Used for ");
}

export const SkillsMenuModal: React.FC<SkillsMenuModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  enabledSkills,
  onSkillsChange,
}) => {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const enabledIds = useMemo(() => new Set(enabledSkills.map((s) => s.id)), [enabledSkills]);

  const loadSkills = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSkills({ scope: "user" });
      setSkills(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load skills.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void loadSkills();
    }
  }, [isOpen]);

  const handleToggle = async (skill: SkillItem) => {
    const isCurrentlyEnabled = enabledIds.has(skill.id);
    const updatedIds = isCurrentlyEnabled
      ? enabledSkills.filter((s) => s.id !== skill.id).map((s) => s.id)
      : [...enabledSkills.map((s) => s.id), skill.id];

    // Optimistic UI update
    const updatedSkills = isCurrentlyEnabled
      ? enabledSkills.filter((s) => s.id !== skill.id)
      : [...enabledSkills, skill];
    onSkillsChange(updatedSkills);

    const targetId = conversationId || "guest-chat";
    try {
      const persisted = await setConversationSkills(targetId, updatedIds);
      onSkillsChange(persisted);
    } catch (err: unknown) {
      // Rollback
      onSkillsChange(enabledSkills);
      setError(err instanceof Error ? err.message : "Failed to toggle skill.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, skillId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this custom skill?")) return;
    try {
      await deleteSkill(skillId);
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      onSkillsChange(enabledSkills.filter((s) => s.id !== skillId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete skill.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0]!;

    setIsUploading(true);
    setUploadError(null);
    try {
      let created: SkillItem;
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith(".zip")) {
        created = await uploadSkill(file, "user");
      } else if (lowerName.endsWith(".pdf")) {
        const { content } = await extractPdfText(file);
        const cleanName =
          file.name
            .replace(/\.pdf$/i, "")
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/^-+|-+$/g, "") || "pdf-skill";
        created = await createSkillFromJson({
          name: cleanName,
          description: `Used for referencing and applying knowledge from ${file.name}`,
          skillMd: `---\nname: ${cleanName}\ndescription: Used for referencing and applying knowledge from ${file.name}\n---\n# ${file.name}\n\n${content}`,
          files: [],
          scope: "user",
          approvalStatus: "approved",
        });
      } else if (lowerName.endsWith(".md") || lowerName.endsWith(".markdown") || lowerName.endsWith(".txt")) {
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
          : `---\nname: ${cleanName}\ndescription: Used for custom instructions from ${file.name}\n---\n${text}`;
        created = await createSkillFromJson({
          name: cleanName,
          description: `Used for custom instructions from ${file.name}`,
          skillMd,
          files: [],
          scope: "user",
          approvalStatus: "approved",
        });
      } else {
        throw new Error("Unsupported format. Please select a .md, .pdf, or .zip file.");
      }

      setSkills((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
      await handleToggle(created);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload skill.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Strictly user-created custom skills appear here; built-in / platform skills are active defaults
  const userCreatedSkills = useMemo(() => {
    return skills.filter(isUserCreatedSkill);
  }, [skills]);

  const filteredSkills = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return userCreatedSkills;
    return userCreatedSkills.filter(
      (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }, [userCreatedSkills, searchQuery]);

  const enabledUserSkillsCount = useMemo(() => {
    return enabledSkills.filter(isUserCreatedSkill).length;
  }, [enabledSkills]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-semibold text-neutral-900 tracking-tight">
              Skills for this chat
            </h2>
            <p className="text-[12.5px] text-neutral-500 mt-0.5">
              Enable custom skills to provide project guidelines, files, and sandbox tools.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="px-6 pb-3 flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search custom skills…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 focus:bg-white text-[13px] text-neutral-900 placeholder-neutral-400 rounded-xl focus:ring-2 focus:ring-neutral-900/10 border-0 outline-none transition-all"
            />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept=".zip,.md,.markdown,.pdf,application/pdf,text/markdown,text/plain"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-[12.5px] font-medium transition-colors shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            <span>Upload</span>
          </button>
        </div>

        {/* Upload error banner */}
        {uploadError && (
          <div className="mx-6 mb-3 p-3.5 bg-rose-50 rounded-2xl flex items-start gap-2 text-[12px] text-rose-700">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <div className="flex-1">{uploadError}</div>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-rose-400 hover:text-rose-700"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2">
              <Loader2 size={24} className="animate-spin text-neutral-900" />
              <span className="text-[13px]">Loading skills…</span>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-rose-600 text-[13px]">{error}</div>
          ) : userCreatedSkills.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-[13px]">
              No custom skills yet. Upload a .md, .pdf, or .zip file to get started.
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-[13px]">
              No custom skills match &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredSkills.map((skill) => (
                <SkillRow
                  key={skill.id}
                  skill={skill}
                  isEnabled={enabledIds.has(skill.id)}
                  onToggle={() => handleToggle(skill)}
                  onDelete={(e) => handleDelete(e, skill.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between text-[12.5px] text-neutral-500">
          <span>
            {enabledUserSkillsCount} skill{enabledUserSkillsCount === 1 ? "" : "s"} enabled
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl font-medium transition-colors cursor-pointer text-[12.5px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

interface SkillRowProps {
  skill: SkillItem;
  isEnabled: boolean;
  onToggle: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

const SkillRow: React.FC<SkillRowProps> = ({ skill, isEnabled, onToggle, onDelete }) => {
  return (
    <div
      onClick={onToggle}
      className={`group p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
        isEnabled
          ? "bg-neutral-100"
          : "bg-neutral-50/70 hover:bg-neutral-100/70"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-xl bg-neutral-200/50 flex items-center justify-center shrink-0 font-mono text-[11px] font-semibold text-neutral-800 tracking-tight">
          {getSkillMonogram(skill.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[13px] text-neutral-900 tracking-tight">
              {skill.name}
            </span>
            {skill.version > 1 && (
              <span className="text-[10.5px] font-mono text-neutral-400">
                v{skill.version}
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-neutral-500 line-clamp-1 mt-0.5">
            {formatSkillDescription(skill.description)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {onDelete && (
          <button
            type="button"
            title="Delete custom skill"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/60 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        )}

        {/* Switch Toggle */}
        <div
          className={`w-9 h-5 rounded-full transition-colors relative shrink-0 flex items-center p-0.5 ${
            isEnabled ? "bg-neutral-950" : "bg-neutral-200"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-150 flex items-center justify-center ${
              isEnabled ? "translate-x-4" : "translate-x-0"
            }`}
          >
            {isEnabled && <Check size={10} strokeWidth={3} className="text-neutral-950" />}
          </div>
        </div>
      </div>
    </div>
  );
};
