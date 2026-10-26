/**
 * Configurable rate limits and quotas for Skills feature.
 * - Skill uploads per hour
 * - Skill tool calls per conversation per minute
 * - Bash calls per conversation per minute
 * - Per-user daily sandbox CPU-seconds
 */

export interface RateLimitResult {
  allowed: boolean;
  message?: string;
  retryAfterSeconds?: number;
}

interface WindowBucket {
  timestamps: number[];
}

const uploadBuckets = new Map<string, WindowBucket>();
const skillToolBuckets = new Map<string, WindowBucket>();
const bashToolBuckets = new Map<string, WindowBucket>();
const userDailyCpuUsage = new Map<string, { totalSeconds: number; resetAt: number }>();

function cleanWindow(bucket: WindowBucket, windowMs: number, now: number): void {
  const threshold = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter((t) => t > threshold);
}

export function getUploadsPerHourLimit(): number {
  const envVal = process.env["SKILL_UPLOADS_PER_HOUR"];
  return envVal ? parseInt(envVal, 10) : 30;
}

export function getSkillToolCallsPerMinLimit(): number {
  const envVal = process.env["SKILL_TOOL_CALLS_PER_CONV_PER_MIN"];
  return envVal ? parseInt(envVal, 10) : 20;
}

export function getBashCallsPerMinLimit(): number {
  const envVal = process.env["BASH_CALLS_PER_CONV_PER_MIN"];
  return envVal ? parseInt(envVal, 10) : 30;
}

export function getUserDailyCpuSecondsLimit(): number {
  const envVal = process.env["USER_DAILY_SANDBOX_CPU_SECONDS"];
  return envVal ? parseInt(envVal, 10) : 300;
}

export function checkUploadRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const limit = getUploadsPerHourLimit();

  let bucket = uploadBuckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    uploadBuckets.set(key, bucket);
  }

  cleanWindow(bucket, windowMs, now);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      message: `Skill upload rate limit exceeded (${limit}/hour). Please retry in ${retryAfterSeconds} seconds.`,
    };
  }

  bucket.timestamps.push(now);
  return { allowed: true };
}

export function checkSkillToolRateLimit(conversationId: string): RateLimitResult {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const limit = getSkillToolCallsPerMinLimit();

  let bucket = skillToolBuckets.get(conversationId);
  if (!bucket) {
    bucket = { timestamps: [] };
    skillToolBuckets.set(conversationId, bucket);
  }

  cleanWindow(bucket, windowMs, now);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      message: `Rate limit exceeded: Conversation reached maximum of ${limit} Skill tool calls per minute. Please pause before loading more skills.`,
    };
  }

  bucket.timestamps.push(now);
  return { allowed: true };
}

export function checkBashRateLimit(conversationId: string, userId?: string | null): RateLimitResult {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const limit = getBashCallsPerMinLimit();

  // 1. Check conversation per-minute bash call rate
  let bucket = bashToolBuckets.get(conversationId);
  if (!bucket) {
    bucket = { timestamps: [] };
    bashToolBuckets.set(conversationId, bucket);
  }

  cleanWindow(bucket, windowMs, now);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      message: `Rate limit exceeded: Conversation reached maximum of ${limit} Bash calls per minute. Please wait before executing more commands.`,
    };
  }

  // 2. Check per-user daily CPU quota
  if (userId) {
    const dailyLimit = getUserDailyCpuSecondsLimit();
    const userUsage = userDailyCpuUsage.get(userId);
    if (userUsage && now < userUsage.resetAt && userUsage.totalSeconds >= dailyLimit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((userUsage.resetAt - now) / 1000));
      return {
        allowed: false,
        retryAfterSeconds,
        message: `Daily sandbox CPU quota exceeded for user (${userUsage.totalSeconds.toFixed(1)}s / ${dailyLimit}s). Reset in ${retryAfterSeconds} seconds.`,
      };
    }
  }

  bucket.timestamps.push(now);
  return { allowed: true };
}

export function recordBashCpuUsage(userId: string, durationMs: number): void {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const cpuSeconds = durationMs / 1000;

  let usage = userDailyCpuUsage.get(userId);
  if (!usage || now >= usage.resetAt) {
    usage = { totalSeconds: 0, resetAt: now + dayMs };
    userDailyCpuUsage.set(userId, usage);
  }

  usage.totalSeconds += cpuSeconds;
}

export function resetRateLimitsForTesting(): void {
  uploadBuckets.clear();
  skillToolBuckets.clear();
  bashToolBuckets.clear();
  userDailyCpuUsage.clear();
}
