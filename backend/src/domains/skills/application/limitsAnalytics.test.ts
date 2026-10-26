import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { openChatDatabase } from "../../../platform/database/chatDatabase.js";
import { SkillRepository } from "../repositories/skillRepository.js";
import {
  checkUploadRateLimit,
  checkSkillToolRateLimit,
  checkBashRateLimit,
  recordBashCpuUsage,
  resetRateLimitsForTesting,
} from "./rateLimits.js";
import { handleSkillToolCall } from "./skillToolHandler.js";

describe("Phase 7: Limits & Analytics Tests", () => {
  let db: ReturnType<typeof openChatDatabase>;
  let repo: SkillRepository;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetRateLimitsForTesting();
    db = openChatDatabase(":memory:");
    repo = new SkillRepository(db);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetRateLimitsForTesting();
  });

  test("1. Skill uploads rate limit throttles after limit and provides retry time", () => {
    process.env["SKILL_UPLOADS_PER_HOUR"] = "3";
    const userKey = "user-uploader-1";

    assert.equal(checkUploadRateLimit(userKey).allowed, true);
    assert.equal(checkUploadRateLimit(userKey).allowed, true);
    assert.equal(checkUploadRateLimit(userKey).allowed, true);

    const fourth = checkUploadRateLimit(userKey);
    assert.equal(fourth.allowed, false);
    assert.ok(fourth.message?.includes("Skill upload rate limit exceeded"));
    assert.ok(typeof fourth.retryAfterSeconds === "number" && fourth.retryAfterSeconds > 0);
  });

  test("2. Skill tool calls per conversation per minute throttles and returns model-readable error", () => {
    process.env["SKILL_TOOL_CALLS_PER_CONV_PER_MIN"] = "2";
    const convId = "conv-skill-limit";

    assert.equal(checkSkillToolRateLimit(convId).allowed, true);
    assert.equal(checkSkillToolRateLimit(convId).allowed, true);

    const third = checkSkillToolRateLimit(convId);
    assert.equal(third.allowed, false);
    assert.ok(third.message?.includes("Rate limit exceeded"));

    // Verify handleSkillToolCall surfaces this error cleanly to model
    const toolCallRes = handleSkillToolCall("any-skill", convId, "user-1", repo);
    assert.equal(toolCallRes.isError, true);
    assert.ok(toolCallRes.content.includes("Rate limit exceeded"));
  });

  test("3. Bash calls per conversation per minute throttles cleanly", () => {
    process.env["BASH_CALLS_PER_CONV_PER_MIN"] = "2";
    const convId = "conv-bash-limit";

    assert.equal(checkBashRateLimit(convId, "user-1").allowed, true);
    assert.equal(checkBashRateLimit(convId, "user-1").allowed, true);

    const third = checkBashRateLimit(convId, "user-1");
    assert.equal(third.allowed, false);
    assert.ok(third.message?.includes("maximum of 2 Bash calls per minute"));
  });

  test("4. Per-user daily sandbox CPU-seconds limit throttles when exceeded", () => {
    process.env["USER_DAILY_SANDBOX_CPU_SECONDS"] = "5"; // 5 seconds max
    const userId = "cpu-heavy-user";
    const convId = "conv-cpu-1";

    assert.equal(checkBashRateLimit(convId, userId).allowed, true);

    // Simulate 6.5s of accumulated bash execution
    recordBashCpuUsage(userId, 6500);

    const checkAfterHeavyBash = checkBashRateLimit("conv-cpu-2", userId);
    assert.equal(checkAfterHeavyBash.allowed, false);
    assert.ok(checkAfterHeavyBash.message?.includes("Daily sandbox CPU quota exceeded"));
  });

  test("5. Analytics from skill_usage computes top skills, failure rates, and averages", () => {
    const convId1 = "conv-analytics-1";
    const convId2 = "conv-analytics-2";

    // Seed usage
    repo.logUsage(convId1, "csv-summary", "user-1", "Skill", 120, "success");
    repo.logUsage(convId1, "csv-summary", "user-1", "Bash", 450, "success");
    repo.logUsage(convId1, "csv-summary", "user-1", "Bash", 310, "error");

    repo.logUsage(convId2, "web-research", "user-2", "Skill", 80, "success");
    repo.logUsage(convId2, "web-research", "user-2", "Read", 25, "success");

    const analytics = repo.getAnalytics(7);

    assert.equal(analytics.totalCalls, 5);
    assert.equal(analytics.totalToolLoops, 2);
    assert.equal(analytics.averageIterations, 2.5); // 5 calls / 2 conversations

    // Top skills
    assert.ok(analytics.topSkills.length >= 2);
    const csvStat = analytics.topSkills.find((s) => s.skill === "csv-summary");
    assert.ok(csvStat);
    assert.equal(csvStat.callCount, 3);
    assert.equal(csvStat.failureCount, 1);

    // Failure rate: 1 failure out of 5 calls = 0.20
    assert.equal(analytics.failureRate, 0.2);

    // Calls per day has today's date
    assert.ok(analytics.callsPerDay.length >= 1);
    assert.equal(analytics.callsPerDay[0]!.calls, 5);
  });
});
