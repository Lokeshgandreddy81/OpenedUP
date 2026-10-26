import crypto from "node:crypto";
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import AdmZip from "adm-zip";
import {
  parseSkillZip,
  validatePackageFiles,
  validateRelativePath,
  SkillValidationError,
  MAX_SKILL_MD_BYTES,
} from "./skillParser.js";
import {
  resolveSkillVersionDir,
  writeSkillFilesToDisk,
  readSkillFileWithVerification,
  SkillIntegrityError,
} from "./skillStorage.js";

describe("Phase 2: Upload & Package Security Tests", () => {
  function createZip(entries: Array<{ path: string; content: string | Buffer; attr?: number }>): Buffer {
    const zip = new AdmZip();
    for (const entry of entries) {
      const data = typeof entry.content === "string" ? Buffer.from(entry.content, "utf8") : entry.content;
      zip.addFile(entry.path, data);
      if (entry.attr) {
        const zipEntry = zip.getEntry(entry.path);
        if (zipEntry) {
          zipEntry.attr = entry.attr;
        }
      }
    }
    return zip.toBuffer();
  }

  test("Zip & Package: rejects path traversal (..) in relative path and package", () => {
    assert.throws(
      () => validateRelativePath("../evil.txt"),
      (err: unknown) => err instanceof SkillValidationError && err.message.includes("Path traversal")
    );

    assert.throws(
      () =>
        validatePackageFiles([
          { relativePath: "../evil.txt", content: Buffer.from("malicious") },
        ]),
      (err: unknown) => err instanceof SkillValidationError && err.message.includes("Path traversal")
    );
  });

  test("Zip & Package: rejects absolute path in package", () => {
    assert.throws(
      () => validateRelativePath("/etc/shadow"),
      (err: unknown) => err instanceof SkillValidationError && err.message.includes("Path traversal")
    );

    assert.throws(
      () =>
        validatePackageFiles([
          { relativePath: "/etc/shadow", content: Buffer.from("malicious") },
        ]),
      (err: unknown) => err instanceof SkillValidationError && err.message.includes("Path traversal")
    );
  });

  test("Zip: rejects zip bombs with too many files (> 500 files)", () => {
    const entries: Array<{ path: string; content: string }> = [
      { path: "SKILL.md", content: "---\nname: my-skill\ndescription: A valid skill\n---\nBody" },
    ];
    for (let i = 0; i < 505; i++) {
      entries.push({ path: `file_${i}.txt`, content: "a" });
    }
    const zipBuffer = createZip(entries);

    assert.throws(
      () => parseSkillZip(zipBuffer),
      (err: unknown) => err instanceof SkillValidationError && err.message.includes("Zip bomb detected: package contains")
    );
  });

  test("Zip: rejects zip bombs with uncompressed size > 20MB", () => {
    const bigData = Buffer.alloc(21 * 1024 * 1024, 0x41); // 21MB
    const zipBuffer = createZip([
      { path: "SKILL.md", content: "---\nname: my-skill\ndescription: A valid skill\n---\nBody" },
      { path: "huge.bin", content: bigData },
    ]);

    assert.throws(
      () => parseSkillZip(zipBuffer),
      (err: unknown) => err instanceof SkillValidationError && err.message.includes("Zip bomb detected: uncompressed size")
    );
  });

  test("Zip & Package: rejects duplicate entries in package", () => {
    assert.throws(
      () =>
        validatePackageFiles([
          { relativePath: "file.txt", content: Buffer.from("1") },
          { relativePath: "file.txt", content: Buffer.from("2") },
        ]),
      (err: unknown) => err instanceof SkillValidationError && err.message.includes("Duplicate file entry")
    );
  });

  test("Zip: rejects unsupported binary outside scripts/ and templates/", () => {
    const zipBuffer = createZip([
      { path: "SKILL.md", content: "---\nname: my-skill\ndescription: A valid skill\n---\nBody" },
      { path: "bad_binary.exe", content: Buffer.from([0x4d, 0x5a, 0x90, 0x00]) },
    ]);

    assert.throws(
      () => parseSkillZip(zipBuffer),
      (err: unknown) => err instanceof SkillValidationError && err.message.includes("Binary files are only permitted")
    );
  });

  test("Zip: permits binaries inside scripts/ and templates/", () => {
    const zipBuffer = createZip([
      { path: "SKILL.md", content: "---\nname: my-skill\ndescription: A valid skill\n---\nBody" },
      { path: "scripts/worker.bin", content: Buffer.from([0x01, 0x02, 0x03]) },
      { path: "templates/data.bin", content: Buffer.from([0x04, 0x05, 0x06]) },
    ]);

    const parsed = parseSkillZip(zipBuffer);
    assert.equal(parsed.name, "my-skill");
    assert.equal(parsed.files.length, 3);
  });

  test("Zip: rejects SKILL.md exceeding 200KB", () => {
    const oversizeBody = "x".repeat(MAX_SKILL_MD_BYTES + 100);
    const zipBuffer = createZip([
      {
        path: "SKILL.md",
        content: `---\nname: oversize-skill\ndescription: Oversize skill\n---\n${oversizeBody}`,
      },
    ]);

    assert.throws(
      () => parseSkillZip(zipBuffer),
      (err: unknown) => err instanceof SkillValidationError && err.message.includes("200KB")
    );
  });

  test("Storage: immutable version storage and SHA256 checksum verification", () => {
    const tmpStorage = fs.mkdtempSync(path.join(os.tmpdir(), "skill-store-test-"));
    process.env["SKILLS_STORAGE_DIR"] = tmpStorage;

    try {
      const v1Dir = resolveSkillVersionDir("user", "test-skill", 1);
      const v2Dir = resolveSkillVersionDir("user", "test-skill", 2);

      assert.notEqual(v1Dir, v2Dir, "Versions must be stored in distinct immutable directories");

      const fileContent = Buffer.from("Hello version 1 content", "utf8");
      const sha256 = crypto.createHash("sha256").update(fileContent).digest("hex");
      const fileEntry = {
        relativePath: "data.txt",
        content: fileContent,
        sizeBytes: fileContent.length,
        sha256,
      };

      writeSkillFilesToDisk(v1Dir, [fileEntry]);

      // Read with hash verification: succeeds on valid hash
      const verified = readSkillFileWithVerification(v1Dir, "data.txt", sha256);
      assert.equal(verified.toString("utf8"), "Hello version 1 content");

      // Tampering detection: if file on disk is modified, readSkillFileWithVerification throws
      fs.writeFileSync(path.join(v1Dir, "data.txt"), "Tampered content!");
      assert.throws(
        () => readSkillFileWithVerification(v1Dir, "data.txt", sha256),
        (err: unknown) => err instanceof SkillIntegrityError && err.message.includes("hash mismatch")
      );
    } finally {
      fs.rmSync(tmpStorage, { recursive: true, force: true });
    }
  });
});
