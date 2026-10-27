import {
  parseSkillMd,
  validateRelativePath,
  validatePackageFiles,
  type RawFileInput,
  MAX_SKILL_MD_BYTES,
  MAX_DESCRIPTION_LENGTH,
} from "./skillParser.js";

export interface DescriptionQuality {
  score: "poor" | "fair" | "good";
  hint: string;
  suggestions: string[];
}

const TRIGGER_PHRASES = [
  "use this skill when",
  "use when",
  "use for",
  "used for",
  "used to",
  "used when",
  "triggers on",
  "call this when",
  "activate when",
  "for tasks involving",
  "helps with",
  "handles",
  "specialized in",
  "when the user asks",
];

export function evaluateDescriptionQuality(description: string): DescriptionQuality {
  const text = (description || "").trim();
  const suggestions: string[] = [];

  if (text.length === 0) {
    return {
      score: "poor",
      hint: "Description is empty. The model will not know when to choose this skill.",
      suggestions: [
        "Explain what tasks this skill solves.",
        "Add trigger phrases like 'Use this skill when...'",
      ],
    };
  }

  if (text.length < 40) {
    suggestions.push(
      "Description is under 40 characters. Describe the specific workflow or file types handled."
    );
  }

  const lower = text.toLowerCase();
  const hasTrigger = TRIGGER_PHRASES.some((phrase) => lower.includes(phrase));

  if (!hasTrigger) {
    suggestions.push(
      "Include explicit trigger phrasing (e.g. 'Use this skill when the user asks to summarize CSV files...')."
    );
  }

  if (suggestions.length === 0) {
    return {
      score: "good",
      hint: "High quality description with clear trigger context for the model.",
      suggestions: [],
    };
  }

  return {
    score: text.length < 40 && !hasTrigger ? "poor" : "fair",
    hint: suggestions[0]!,
    suggestions,
  };
}

export interface SkillDraftInput {
  name: string;
  description: string;
  skillMd: string;
  files?: Array<{ relativePath: string; content: string }>;
}

export function validateSkillDraft(draft: SkillDraftInput): {
  valid: boolean;
  errors: string[];
  quality: DescriptionQuality;
} {
  const errors: string[] = [];

  // 1. Name validation
  const name = (draft.name || "").trim();
  if (!name) {
    errors.push("Skill name is required.");
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    errors.push(
      "Skill name must be lowercase alphanumeric with optional hyphens (e.g., 'csv-summary')."
    );
  }

  // 2. Description validation
  const description = (draft.description || "").trim();
  if (!description) {
    errors.push("Skill description is required.");
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`);
  }

  // 3. SKILL.md validation
  const skillMd = (draft.skillMd || "").trim();
  if (!skillMd) {
    errors.push("SKILL.md content is required.");
  } else if (Buffer.byteLength(skillMd, "utf8") > MAX_SKILL_MD_BYTES) {
    errors.push("SKILL.md exceeds maximum allowed size (200KB).");
  } else {
    try {
      parseSkillMd(skillMd);
    } catch (err) {
      errors.push(`SKILL.md format error: ${(err as Error).message}`);
    }
  }

  // 4. Extra files validation
  if (draft.files && Array.isArray(draft.files)) {
    const rawFiles: RawFileInput[] = draft.files.map((f) => ({
      relativePath: f.relativePath,
      content: Buffer.from(f.content || "", "utf8"),
    }));

    for (const f of draft.files) {
      try {
        validateRelativePath(f.relativePath);
      } catch (err) {
        errors.push(`File path error in '${f.relativePath}': ${(err as Error).message}`);
      }
    }

    try {
      validatePackageFiles([
        { relativePath: "SKILL.md", content: Buffer.from(skillMd || "", "utf8") },
        ...rawFiles,
      ]);
    } catch (err) {
      errors.push(`Package file error: ${(err as Error).message}`);
    }
  }

  const quality = evaluateDescriptionQuality(description);

  return {
    valid: errors.length === 0,
    errors,
    quality,
  };
}
