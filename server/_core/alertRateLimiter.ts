import { getDb } from "../db";
import { notifications } from "../../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";

/**
 * Alert Rate Limiter Service
 * Prevents duplicate alerts and implements rate limiting
 */

interface RateLimitConfig {
  agentFailure: {
    windowMs: number; // Time window in milliseconds
    maxAlerts: number; // Max alerts per window
  };
  agentRecovery: {
    windowMs: number;
    maxAlerts: number;
  };
  budgetWarning: {
    windowMs: number;
    maxAlerts: number;
  };
  budgetCritical: {
    windowMs: number;
    maxAlerts: number;
  };
}

// Default rate limit configuration
const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  agentFailure: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAlerts: 1, // Max 1 alert per hour per agent
  },
  agentRecovery: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAlerts: 1,
  },
  budgetWarning: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxAlerts: 1, // Max 1 warning per day
  },
  budgetCritical: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAlerts: 3, // Max 3 critical alerts per hour (bypass rate limiting)
  },
};

/**
 * Check if alert should be rate limited
 */
export async function isAlertRateLimited(
  userId: number,
  alertType: string,
  agentId?: number | null,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Get rate limit config for this alert type
    const typeConfig =
      config[alertType as keyof RateLimitConfig] || config.agentFailure;
    const windowStart = new Date(Date.now() - typeConfig.windowMs);

    // Count recent alerts of this type
    const recentAlerts = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.notificationType, alertType as any),
          agentId ? eq(notifications.relatedAgentId, agentId) : undefined,
          gte(notifications.createdAt, windowStart),
          eq(notifications.status, "sent")
        )
      );

    // If we've hit the limit, rate limit this alert
    return recentAlerts.length >= typeConfig.maxAlerts;
  } catch (error) {
    console.error("[AlertRateLimiter] Error checking rate limit:", error);
    // On error, don't rate limit (fail open)
    return false;
  }
}

/**
 * Check if alert is a duplicate (exact same alert sent recently)
 */
export async function isDuplicateAlert(
  userId: number,
  alertType: string,
  agentId?: number | null,
  deduplicationWindowMs: number = 60 * 60 * 1000 // 1 hour default
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const windowStart = new Date(Date.now() - deduplicationWindowMs);

    const recentAlert = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.notificationType, alertType as any),
          agentId ? eq(notifications.relatedAgentId, agentId) : undefined,
          gte(notifications.createdAt, windowStart),
          eq(notifications.status, "sent")
        )
      )
      .limit(1);

    return recentAlert.length > 0;
  } catch (error) {
    console.error("[AlertRateLimiter] Error checking duplicate alert:", error);
    // On error, don't consider it a duplicate (fail open)
    return false;
  }
}

/**
 * Get alert frequency for a user and alert type
 */
export async function getAlertFrequency(
  userId: number,
  alertType: string,
  windowMs: number = 24 * 60 * 60 * 1000 // 24 hours default
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;

    const windowStart = new Date(Date.now() - windowMs);

    const alerts = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.notificationType, alertType as any),
          gte(notifications.createdAt, windowStart)
        )
      );

    return alerts.length;
  } catch (error) {
    console.error("[AlertRateLimiter] Error getting alert frequency:", error);
    return 0;
  }
}

/**
 * Check if user is in quiet hours (no alerts should be sent)
 */
export function isInQuietHours(
  quietStartTime?: string,
  quietEndTime?: string
): boolean {
  if (!quietStartTime || !quietEndTime) {
    return false;
  }

  try {
    const now = new Date();
    const [startHour, startMin] = quietStartTime.split(":").map(Number);
    const [endHour, endMin] = quietEndTime.split(":").map(Number);

    const startTimeMinutes = startHour * 60 + startMin;
    const endTimeMinutes = endHour * 60 + endMin;
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    if (startTimeMinutes <= endTimeMinutes) {
      // Normal case: quiet hours don't span midnight
      return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
    } else {
      // Quiet hours span midnight
      return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes < endTimeMinutes;
    }
  } catch (error) {
    console.error("[AlertRateLimiter] Error checking quiet hours:", error);
    return false;
  }
}

/**
 * Check if alert should be queued for digest instead of sent immediately
 */
export function shouldQueueForDigest(
  alertType: string,
  digestFrequency?: string
): boolean {
  // Critical budget alerts should never be queued
  if (alertType === "budget_critical") {
    return false;
  }

  // Queue for digest if frequency is set to daily or weekly
  return digestFrequency === "daily" || digestFrequency === "weekly";
}

/**
 * Get next digest send time based on frequency
 */
export function getNextDigestTime(
  frequency: string,
  digestHour: number = 9 // Default 9 AM
): Date {
  const next = new Date();

  if (frequency === "daily") {
    // Next day at digestHour
    next.setDate(next.getDate() + 1);
    next.setHours(digestHour, 0, 0, 0);
  } else if (frequency === "weekly") {
    // Next Monday at digestHour
    const daysUntilMonday = (1 - next.getDay() + 7) % 7 || 7;
    next.setDate(next.getDate() + daysUntilMonday);
    next.setHours(digestHour, 0, 0, 0);
  }

  return next;
}

/**
 * Validate rate limit configuration
 */
export function validateRateLimitConfig(config: Partial<RateLimitConfig>): boolean {
  try {
    for (const [key, value] of Object.entries(config)) {
      if (value && typeof value === "object") {
        if (
          typeof value.windowMs !== "number" ||
          typeof value.maxAlerts !== "number"
        ) {
          return false;
        }
        if (value.windowMs <= 0 || value.maxAlerts <= 0) {
          return false;
        }
      }
    }
    return true;
  } catch (error) {
    console.error("[AlertRateLimiter] Error validating config:", error);
    return false;
  }
}

/**
 * Get rate limit status for display
 */
export async function getRateLimitStatus(
  userId: number,
  alertType: string,
  agentId?: number | null,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS
): Promise<{
  isRateLimited: boolean;
  isDuplicate: boolean;
  frequency: number;
  nextAvailableTime?: Date;
}> {
  try {
    const typeConfig =
      config[alertType as keyof RateLimitConfig] || config.agentFailure;
    const isRateLimited = await isAlertRateLimited(
      userId,
      alertType,
      agentId,
      config
    );
    const isDuplicate = await isDuplicateAlert(userId, alertType, agentId);
    const frequency = await getAlertFrequency(
      userId,
      alertType,
      typeConfig.windowMs
    );

    let nextAvailableTime: Date | undefined;
    if (isRateLimited) {
      nextAvailableTime = new Date(Date.now() + typeConfig.windowMs);
    }

    return {
      isRateLimited,
      isDuplicate,
      frequency,
      nextAvailableTime,
    };
  } catch (error) {
    console.error("[AlertRateLimiter] Error getting rate limit status:", error);
    return {
      isRateLimited: false,
      isDuplicate: false,
      frequency: 0,
    };
  }
}
