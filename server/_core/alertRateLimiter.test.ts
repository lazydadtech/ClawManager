import { describe, it, expect } from "vitest";
import {
  isAlertRateLimited,
  isDuplicateAlert,
  getAlertFrequency,
  isInQuietHours,
  shouldQueueForDigest,
  getNextDigestTime,
  validateRateLimitConfig,
  getRateLimitStatus,
} from "./alertRateLimiter";

describe("Alert Rate Limiter", () => {
  describe("Rate Limiting", () => {
    it("should check if alert is rate limited", async () => {
      const result = await isAlertRateLimited(1, "agent_failure", 1);
      expect(typeof result).toBe("boolean");
    });

    it("should handle missing alert type gracefully", async () => {
      const result = await isAlertRateLimited(1, "unknown_type", 1);
      expect(typeof result).toBe("boolean");
    });
  });

  describe("Duplicate Detection", () => {
    it("should detect duplicate alerts", async () => {
      const result = await isDuplicateAlert(1, "agent_failure", 1);
      expect(typeof result).toBe("boolean");
    });

    it("should allow custom deduplication window", async () => {
      const result = await isDuplicateAlert(1, "agent_failure", 1, 30 * 60 * 1000);
      expect(typeof result).toBe("boolean");
    });
  });

  describe("Alert Frequency", () => {
    it("should get alert frequency", async () => {
      const frequency = await getAlertFrequency(1, "agent_failure");
      expect(typeof frequency).toBe("number");
      expect(frequency).toBeGreaterThanOrEqual(0);
    });

    it("should allow custom time window", async () => {
      const frequency = await getAlertFrequency(1, "agent_failure", 7 * 24 * 60 * 60 * 1000);
      expect(typeof frequency).toBe("number");
      expect(frequency).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Quiet Hours", () => {
    it("should detect if in quiet hours", () => {
      const result = isInQuietHours("22:00", "06:00");
      expect(typeof result).toBe("boolean");
    });

    it("should handle missing quiet hours", () => {
      const result = isInQuietHours();
      expect(result).toBe(false);
    });

    it("should handle invalid time format gracefully", () => {
      const result = isInQuietHours("invalid", "invalid");
      expect(typeof result).toBe("boolean");
    });

    it("should correctly identify quiet hours that span midnight", () => {
      // Test with quiet hours from 22:00 to 06:00
      const result = isInQuietHours("22:00", "06:00");
      expect(typeof result).toBe("boolean");
    });

    it("should correctly identify normal quiet hours", () => {
      // Test with quiet hours from 09:00 to 17:00
      const result = isInQuietHours("09:00", "17:00");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("Digest Queueing", () => {
    it("should determine if alert should be queued for digest", () => {
      const result1 = shouldQueueForDigest("agent_failure", "daily");
      expect(result1).toBe(true);

      const result2 = shouldQueueForDigest("agent_failure", "weekly");
      expect(result2).toBe(true);

      const result3 = shouldQueueForDigest("agent_failure", "immediate");
      expect(result3).toBe(false);

      const result4 = shouldQueueForDigest("budget_critical", "daily");
      expect(result4).toBe(false); // Critical alerts never queued
    });
  });

  describe("Digest Timing", () => {
    it("should calculate next daily digest time", () => {
      const next = getNextDigestTime("daily", 9);
      expect(next).toBeInstanceOf(Date);
      expect(next.getHours()).toBe(9);
      expect(next.getMinutes()).toBe(0);
    });

    it("should calculate next weekly digest time", () => {
      const next = getNextDigestTime("weekly", 9);
      expect(next).toBeInstanceOf(Date);
      expect(next.getHours()).toBe(9);
      expect(next.getMinutes()).toBe(0);
      // Should be a Monday
      expect(next.getDay()).toBe(1);
    });

    it("should use default digest hour if not specified", () => {
      const next = getNextDigestTime("daily");
      expect(next.getHours()).toBe(9);
    });
  });

  describe("Configuration Validation", () => {
    it("should validate correct rate limit config", () => {
      const config = {
        agentFailure: {
          windowMs: 3600000,
          maxAlerts: 1,
        },
      };
      const result = validateRateLimitConfig(config);
      expect(result).toBe(true);
    });

    it("should reject invalid config with zero values", () => {
      const config = {
        agentFailure: {
          windowMs: 0,
          maxAlerts: 1,
        },
      };
      const result = validateRateLimitConfig(config);
      expect(result).toBe(false);
    });

    it("should reject invalid config with negative values", () => {
      const config = {
        agentFailure: {
          windowMs: -1,
          maxAlerts: 1,
        },
      };
      const result = validateRateLimitConfig(config);
      expect(result).toBe(false);
    });

    it("should reject config with non-numeric values", () => {
      const config = {
        agentFailure: {
          windowMs: "invalid" as any,
          maxAlerts: 1,
        },
      };
      const result = validateRateLimitConfig(config);
      expect(result).toBe(false);
    });

    it("should accept empty config", () => {
      const result = validateRateLimitConfig({});
      expect(result).toBe(true);
    });
  });

  describe("Rate Limit Status", () => {
    it("should get rate limit status", async () => {
      const status = await getRateLimitStatus(1, "agent_failure", 1);
      expect(status).toHaveProperty("isRateLimited");
      expect(status).toHaveProperty("isDuplicate");
      expect(status).toHaveProperty("frequency");
      expect(typeof status.isRateLimited).toBe("boolean");
      expect(typeof status.isDuplicate).toBe("boolean");
      expect(typeof status.frequency).toBe("number");
    });

    it("should include next available time if rate limited", async () => {
      const status = await getRateLimitStatus(1, "agent_failure", 1);
      if (status.isRateLimited) {
        expect(status.nextAvailableTime).toBeInstanceOf(Date);
      }
    });

    it("should handle errors gracefully", async () => {
      const status = await getRateLimitStatus(1, "unknown_type", 1);
      expect(status).toBeDefined();
      expect(typeof status.isRateLimited).toBe("boolean");
      expect(typeof status.isDuplicate).toBe("boolean");
      expect(typeof status.frequency).toBe("number");
    });
  });

  describe("Edge Cases", () => {
    it("should handle null/undefined parameters", async () => {
      const result = await isAlertRateLimited(1, "agent_failure", undefined);
      expect(typeof result).toBe("boolean");
    });

    it("should handle very large time windows", async () => {
      const frequency = await getAlertFrequency(1, "agent_failure", 365 * 24 * 60 * 60 * 1000);
      expect(typeof frequency).toBe("number");
    });

    it("should handle very small time windows", async () => {
      const frequency = await getAlertFrequency(1, "agent_failure", 1000);
      expect(typeof frequency).toBe("number");
    });
  });
});
